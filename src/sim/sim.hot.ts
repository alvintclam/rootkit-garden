import {
  BASE_HP,
  BASE_SPEED,
  DASH_COOLDOWN,
  DASH_FRAMES,
  DASH_SPEED,
  EGG_PRUNE_STREAK,
  EGG_SEED,
  FLOWER_RADIUS,
  H,
  MAX_ENEMIES,
  MAX_FLOWERS,
  MAX_PARTICLES,
  MAX_PROJECTILES,
  PLANT_GRID,
  PLAYER_RADIUS,
  SURVIVE_TICKS,
  W,
  XP_BASE,
  XP_GROWTH,
} from './constants'
import {
  BOSS_PULSE_CD,
  BOSS_PULSE_DAMAGE,
  BOSS_PULSE_RANGE,
  BOSS_PULSE_TELE,
  BOSS_SPAWN_TICK,
  BOSS_TELE_TICKS,
  ENEMY_DEFS,
  EnemyKind,
} from './enemies'
import { FLOWER_DEFS, FlowerStyle } from './flowers'
import { CmdBit } from './inputCmd'
import { nextFloat, nextInt, nextRange } from './rng'
import { Phase, tryEnter, type PhaseId } from './state'
import {
  applyUpgrade,
  cyclePlantKind,
  rollUpgradeChoices,
  UpgradeId,
  type UpgradeIdValue,
} from './upgrades'
import { resetRun, ResultKey, type World } from './world'
import { SimEvent } from './events'
import { cycleDifficulty, difficultyDef } from './difficulty'
import {
  acquireEnemy,
  acquirePart,
  acquireProj,
  releaseEnemy,
  releasePart,
  releaseProj,
} from './pools'

const WAVE_PERIOD = 60 * 18
const STORY_STEPS = 3
const EGG_SEED_TITLE = 1
const EGG_KONAMI = 2
const EGG_PRUNE_RITUAL = 4

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo
  if (v > hi) return hi
  return v
}

function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}

function setPhase(world: World, to: PhaseId): boolean {
  const next = tryEnter(world.phase, to)
  if (next === null) return false
  world.phase = next
  return true
}

function rising(bits: number, prev: number, mask: number): boolean {
  return (bits & mask) !== 0 && (prev & mask) === 0
}

function aliveFlowerSlot(world: World): number {
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (world.flowerAlive[i] === 0) return i
  }
  return -1
}

function countAliveFlowers(world: World): number {
  let n = 0
  for (let i = 0; i < MAX_FLOWERS; i++) if (world.flowerAlive[i]) n++
  return n
}

function nearestEnemy(world: World, x: number, y: number, range: number): number {
  const r2 = range * range
  let best = -1
  let bestD = r2
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (!world.enemyAlive[i]) continue
    const d = dist2(x, y, world.enemyX[i], world.enemyY[i])
    if (d <= bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

function nearestFlower(world: World, x: number, y: number): number {
  let best = -1
  let bestD = 1e18
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    const d = dist2(x, y, world.flowerX[i], world.flowerY[i])
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

function gainXp(world: World, amount: number): void {
  world.xp += amount
  while (world.xp >= world.xpToNext) {
    world.xp -= world.xpToNext
    world.level += 1
    world.xpToNext = Math.floor(XP_BASE * Math.pow(XP_GROWTH, world.level - 1))
    rollUpgradeChoices(world.rng, world.upgrades, world.levelChoices)
    if (setPhase(world, Phase.LevelUp)) world.events |= SimEvent.LevelUp
  }
}

function spawnHitBurst(world: World, x: number, y: number): void {
  for (let k = 0; k < 4; k++) {
    const slot = acquirePart(world)
    if (slot < 0) return
    const a = nextFloat(world.rng) * 6.283185307179586
    const sp = 1.2 + nextFloat(world.rng) * 2.4
    world.partAlive[slot] = 1
    world.partX[slot] = x
    world.partY[slot] = y
    world.partVx[slot] = Math.cos(a) * sp
    world.partVy[slot] = Math.sin(a) * sp
    world.partLife[slot] = 12 + nextInt(world.rng, 0, 10)
  }
}

function spawnEnemy(world: World): void {
  const slot = acquireEnemy(world)
  if (slot < 0) return
  const edge = nextInt(world.rng, 0, 4)
  let x = 0
  let y = 0
  if (edge === 0) {
    x = nextRange(world.rng, 0, W)
    y = -20
  } else if (edge === 1) {
    x = nextRange(world.rng, 0, W)
    y = H + 20
  } else if (edge === 2) {
    x = -20
    y = nextRange(world.rng, 0, H)
  } else {
    x = W + 20
    y = nextRange(world.rng, 0, H)
  }
  let kind: number = EnemyKind.Scanner
  const roll = nextFloat(world.rng)
  if (world.wave >= 4 && roll > 0.82) kind = EnemyKind.Heavyscan
  else if (roll > 0.55) kind = EnemyKind.Drone
  const def = ENEMY_DEFS[kind]
  const hpScale = 1 + world.wave * 0.12
  world.enemyAlive[slot] = 1
  world.enemyX[slot] = x
  world.enemyY[slot] = y
  world.enemyHp[slot] = def.hp * hpScale
  world.enemyKind[slot] = kind
  world.enemySlow[slot] = 0
}

function spawnBoss(world: World): void {
  if (world.bossSpawned) return
  const slot = acquireEnemy(world)
  if (slot < 0) return
  const def = ENEMY_DEFS[EnemyKind.Boss]
  world.bossSpawned = 1
  world.bossSlot = slot
  world.bossPulseCd = BOSS_PULSE_CD
  world.bossPulseTele = 0
  world.enemyAlive[slot] = 1
  world.enemyX[slot] = W * 0.5
  world.enemyY[slot] = -40
  world.enemyHp[slot] = def.hp
  world.enemyKind[slot] = EnemyKind.Boss
  world.enemySlow[slot] = 0
  world.events |= SimEvent.LevelUp
}

function tryPlant(world: World): void {
  if (countAliveFlowers(world) >= world.upgrades.maxFlowers) return
  const gx = Math.round(world.playerX / PLANT_GRID) * PLANT_GRID
  const gy = Math.round(world.playerY / PLANT_GRID) * PLANT_GRID
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    if (dist2(gx, gy, world.flowerX[i], world.flowerY[i]) < 4) return
  }
  const slot = aliveFlowerSlot(world)
  if (slot < 0) return
  world.flowerAlive[slot] = 1
  world.flowerX[slot] = gx
  world.flowerY[slot] = gy
  world.flowerKind[slot] = world.plantKind
  world.flowerCd[slot] = 10
  if (slot >= world.flowerCount) world.flowerCount = slot + 1
  world.pruneStreak = 0
  world.events |= SimEvent.Plant
}

function tryPrune(world: World): void {
  const i = nearestFlower(world, world.playerX, world.playerY)
  if (i < 0) return
  if (dist2(world.playerX, world.playerY, world.flowerX[i], world.flowerY[i]) > 48 * 48) return
  world.flowerAlive[i] = 0
  if (world.upgrades.pruneHeal > 0) {
    world.playerHp = clamp(world.playerHp + world.upgrades.pruneHeal, 0, world.playerMaxHp)
  }
  world.pruneStreak++
  if (world.pruneStreak >= EGG_PRUNE_STREAK && (world.eggFlags & EGG_PRUNE_RITUAL) === 0) {
    world.eggFlags |= EGG_PRUNE_RITUAL
    world.playerHp = clamp(world.playerHp + 20, 0, world.playerMaxHp)
  }
  world.events |= SimEvent.Prune
}

function fireProjectile(
  world: World,
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  dmg: number,
  speed: number,
): void {
  const slot = acquireProj(world)
  if (slot < 0) return
  const dx = tx - fx
  const dy = ty - fy
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  world.projAlive[slot] = 1
  world.projX[slot] = fx
  world.projY[slot] = fy
  world.projVx[slot] = (dx / len) * speed
  world.projVy[slot] = (dy / len) * speed
  world.projDmg[slot] = dmg
}

function fireDirected(
  world: World,
  fx: number,
  fy: number,
  angle: number,
  dmg: number,
  speed: number,
): void {
  const slot = acquireProj(world)
  if (slot < 0) return
  world.projAlive[slot] = 1
  world.projX[slot] = fx
  world.projY[slot] = fy
  world.projVx[slot] = Math.cos(angle) * speed
  world.projVy[slot] = Math.sin(angle) * speed
  world.projDmg[slot] = dmg
}

function tickPlayer(world: World, bits: number): void {
  let mx = 0
  let my = 0
  if (bits & CmdBit.Left) mx -= 1
  if (bits & CmdBit.Right) mx += 1
  if (bits & CmdBit.Up) my -= 1
  if (bits & CmdBit.Down) my += 1
  if (mx !== 0 || my !== 0) {
    const len = Math.sqrt(mx * mx + my * my)
    mx /= len
    my /= len
  }
  if ((bits & CmdBit.Dash) && world.dashCd <= 0 && world.dashLeft <= 0) {
    world.dashLeft = DASH_FRAMES
    world.dashCd = Math.floor(DASH_COOLDOWN * world.upgrades.dashCooldownMul)
    world.events |= SimEvent.Dash
  }
  let moveMul = world.upgrades.moveMul
  if (world.eggFlags & EGG_KONAMI) moveMul *= 1.06
  const speed = world.dashLeft > 0 ? DASH_SPEED : BASE_SPEED * moveMul
  world.playerX = clamp(world.playerX + mx * speed, PLAYER_RADIUS, W - PLAYER_RADIUS)
  world.playerY = clamp(world.playerY + my * speed, PLAYER_RADIUS, H - PLAYER_RADIUS)
  if (world.dashLeft > 0) world.dashLeft--
  if (world.dashCd > 0) world.dashCd--
  if (bits & CmdBit.Cycle) world.plantKind = cyclePlantKind(world.upgrades, world.plantKind)
  if (bits & CmdBit.Plant) tryPlant(world)
  if (bits & CmdBit.Prune) tryPrune(world)
}

function applyAuraSlow(world: World, fx: number, fy: number, range: number, dmg: number): void {
  const r2 = range * range
  for (let e = 0; e < MAX_ENEMIES; e++) {
    if (!world.enemyAlive[e]) continue
    if (dist2(fx, fy, world.enemyX[e], world.enemyY[e]) > r2) continue
    if (world.enemySlow[e] < 45) world.enemySlow[e] = 45
    world.enemyHp[e] -= dmg * 0.15
    if (world.enemyHp[e] <= 0) {
      spawnHitBurst(world, world.enemyX[e], world.enemyY[e])
      if (world.bossSlot === e) {
        world.bossSlot = -1
      }
      releaseEnemy(world, e)
      world.killCount++
      world.events |= SimEvent.Kill
      gainXp(world, ENEMY_DEFS[world.enemyKind[e]].xp)
    }
  }
}

function tickFlowers(world: World): void {
  let dmgMul = world.upgrades.damageMul
  if (world.eggFlags & EGG_KONAMI) dmgMul *= 1.08
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    if (world.flowerCd[i] > 0) {
      world.flowerCd[i]--
      continue
    }
    const def = FLOWER_DEFS[world.flowerKind[i]]
    const range = def.range * world.upgrades.rangeMul
    const dmg = def.damage * dmgMul
    if (def.style === FlowerStyle.Aura) {
      applyAuraSlow(world, world.flowerX[i], world.flowerY[i], range, dmg)
      world.flowerCd[i] = Math.max(6, Math.floor(def.cooldown / world.upgrades.fireRateMul))
      continue
    }
    const target = nearestEnemy(world, world.flowerX[i], world.flowerY[i], range)
    if (target < 0) continue
    if (def.style === FlowerStyle.Spread) {
      const ang = Math.atan2(
        world.enemyY[target] - world.flowerY[i],
        world.enemyX[target] - world.flowerX[i],
      )
      fireDirected(world, world.flowerX[i], world.flowerY[i], ang - 0.28, dmg, def.projectileSpeed)
      fireDirected(world, world.flowerX[i], world.flowerY[i], ang, dmg, def.projectileSpeed)
      fireDirected(world, world.flowerX[i], world.flowerY[i], ang + 0.28, dmg, def.projectileSpeed)
    } else {
      fireProjectile(
        world,
        world.flowerX[i],
        world.flowerY[i],
        world.enemyX[target],
        world.enemyY[target],
        dmg,
        def.projectileSpeed,
      )
    }
    world.flowerCd[i] = Math.max(6, Math.floor(def.cooldown / world.upgrades.fireRateMul))
  }
}

function tickProjectiles(world: World): void {
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    if (!world.projAlive[i]) continue
    world.projX[i] += world.projVx[i]
    world.projY[i] += world.projVy[i]
    if (
      world.projX[i] < -40 ||
      world.projX[i] > W + 40 ||
      world.projY[i] < -40 ||
      world.projY[i] > H + 40
    ) {
      releaseProj(world, i)
      continue
    }
    for (let e = 0; e < MAX_ENEMIES; e++) {
      if (!world.enemyAlive[e]) continue
      const r = ENEMY_DEFS[world.enemyKind[e]].radius
      if (dist2(world.projX[i], world.projY[i], world.enemyX[e], world.enemyY[e]) <= r * r) {
        world.enemyHp[e] -= world.projDmg[i]
        releaseProj(world, i)
        if (world.enemyHp[e] <= 0) {
          spawnHitBurst(world, world.enemyX[e], world.enemyY[e])
          if (world.bossSlot === e) world.bossSlot = -1
          releaseEnemy(world, e)
          world.killCount++
          world.events |= SimEvent.Kill
          gainXp(world, ENEMY_DEFS[world.enemyKind[e]].xp)
        }
        break
      }
    }
  }
}

function tickBoss(world: World): void {
  if (!world.bossSpawned) {
    if (world.tick === BOSS_SPAWN_TICK - BOSS_TELE_TICKS) {
      world.bossTeleLeft = BOSS_TELE_TICKS
    }
    if (world.bossTeleLeft > 0) {
      world.bossTeleLeft--
      if (world.bossTeleLeft === 0) spawnBoss(world)
    }
    return
  }
  const slot = world.bossSlot
  if (slot < 0 || !world.enemyAlive[slot]) {
    world.bossSlot = -1
    return
  }
  if (world.bossPulseTele > 0) {
    world.bossPulseTele--
    if (world.bossPulseTele === 0) {
      if (
        dist2(world.playerX, world.playerY, world.enemyX[slot], world.enemyY[slot]) <=
        BOSS_PULSE_RANGE * BOSS_PULSE_RANGE
      ) {
        if (world.dashLeft <= 0) {
          world.playerHp -= BOSS_PULSE_DAMAGE * difficultyDef(world.difficulty).contactDmgMul
        }
      }
      world.bossPulseCd = BOSS_PULSE_CD
    }
    return
  }
  if (world.bossPulseCd > 0) world.bossPulseCd--
  if (world.bossPulseCd <= 0) world.bossPulseTele = BOSS_PULSE_TELE
}

function tickEnemies(world: World): void {
  const diff = difficultyDef(world.difficulty)
  const dmgMul = diff.contactDmgMul
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (!world.enemyAlive[i]) continue
    const def = ENEMY_DEFS[world.enemyKind[i]]
    const dx = world.playerX - world.enemyX[i]
    const dy = world.playerY - world.enemyY[i]
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    let spd = def.speed * (1 + world.wave * 0.03) * diff.speedMul
    if (world.enemySlow[i] > 0) {
      spd *= 0.45
      world.enemySlow[i]--
    }
    world.enemyX[i] += (dx / len) * spd
    world.enemyY[i] += (dy / len) * spd
    const hitR = PLAYER_RADIUS + def.radius
    if (dist2(world.playerX, world.playerY, world.enemyX[i], world.enemyY[i]) <= hitR * hitR) {
      if (world.dashLeft <= 0) {
        const touch = world.enemyKind[i] === EnemyKind.Boss ? 0.55 : 0.35
        world.playerHp -= (touch + world.wave * 0.02) * dmgMul
      }
    }
    if (world.enemyKind[i] === EnemyKind.Boss) continue
    for (let f = 0; f < MAX_FLOWERS; f++) {
      if (!world.flowerAlive[f]) continue
      const fr = FLOWER_RADIUS + def.radius
      if (dist2(world.flowerX[f], world.flowerY[f], world.enemyX[i], world.enemyY[i]) <= fr * fr) {
        world.flowerAlive[f] = 0
      }
    }
  }
}

function tickParticles(world: World): void {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    if (!world.partAlive[i]) continue
    world.partX[i] += world.partVx[i]
    world.partY[i] += world.partVy[i]
    world.partLife[i]--
    if (world.partLife[i] <= 0) releasePart(world, i)
  }
}

function tickSpawns(world: World): void {
  world.spawnTimer--
  if (world.spawnTimer > 0) return
  const diff = difficultyDef(world.difficulty)
  world.wave = Math.floor(world.tick / WAVE_PERIOD) + 1
  const rawBatch = 1 + Math.min(5, Math.floor(world.wave / 2))
  const batch = Math.max(1, Math.floor(rawBatch * diff.batchMul + 0.0001))
  for (let i = 0; i < batch; i++) spawnEnemy(world)
  const base = Math.max(28, 95 - world.wave * 4)
  world.spawnTimer = Math.floor((base + nextInt(world.rng, 0, 18)) * diff.spawnIntervalMul)
}

function endRun(world: World, survived: boolean, key: number): void {
  world.survived = survived
  world.resultKey = key
  if (survived) world.events |= SimEvent.Win
  else world.events |= SimEvent.Die
  setPhase(world, Phase.Result)
}

function beginRunFromMenu(world: World): void {
  world.tipSeen = true
  if (world.seed === EGG_SEED) world.eggFlags |= EGG_SEED_TITLE
  if (!world.storyDone) {
    world.storyStep = 0
    setPhase(world, Phase.Story)
    return
  }
  resetRun(world, world.seed)
  if (world.seed === EGG_SEED) world.eggFlags |= EGG_SEED_TITLE
}

function advanceStory(world: World): void {
  world.events |= SimEvent.StoryAdvance
  world.storyStep += 1
  if (world.storyStep >= STORY_STEPS) {
    world.storyDone = true
    resetRun(world, world.seed)
    if (world.seed === EGG_SEED) world.eggFlags |= EGG_SEED_TITLE
  }
}

function tickKonami(world: World, bits: number): void {
  if (world.eggFlags & EGG_KONAMI) return
  const prev = world.prevBits
  let step = world.konamiStep
  if (rising(bits, prev, CmdBit.Up)) {
    if (step === 0 || step === 1) step++
    else step = 1
  } else if (rising(bits, prev, CmdBit.Down)) {
    if (step === 2 || step === 3) step++
    else step = 0
  } else if (rising(bits, prev, CmdBit.Left | CmdBit.Right | CmdBit.Plant | CmdBit.Dash)) {
    step = 0
  }
  if (step >= 4) {
    world.eggFlags |= EGG_KONAMI
    world.upgrades.damageMul *= 1.08
    step = 0
  }
  world.konamiStep = step
}

function endRunCleanup(world: World, survived: boolean, key: number): void {
  endRun(world, survived, key)
}

export function simTick(world: World, bits: number): void {
  world.events = 0
  tickKonami(world, bits)

  if (world.phase === Phase.Menu) {
    if (world.seed === EGG_SEED) world.eggFlags |= EGG_SEED_TITLE
    if (bits & CmdBit.Diff) world.difficulty = cycleDifficulty(world.difficulty)
    if (bits & (CmdBit.Confirm | CmdBit.Plant | CmdBit.Dash)) beginRunFromMenu(world)
    world.prevBits = bits
    return
  }

  if (world.phase === Phase.Story) {
    if (bits & CmdBit.Pause) {
      world.storyDone = true
      resetRun(world, world.seed)
      if (world.seed === EGG_SEED) world.eggFlags |= EGG_SEED_TITLE
      world.prevBits = bits
      return
    }
    if (bits & (CmdBit.Confirm | CmdBit.Plant | CmdBit.Dash)) advanceStory(world)
    world.prevBits = bits
    return
  }

  if (world.phase === Phase.Result) {
    if (bits & (CmdBit.Restart | CmdBit.Confirm)) {
      const nextSeed = (world.seed + 0x9e3779b9 + world.tick) >>> 0
      resetRun(world, nextSeed || 1)
      if (world.seed === EGG_SEED) world.eggFlags |= EGG_SEED_TITLE
    }
    world.prevBits = bits
    return
  }

  if (world.phase === Phase.Pause) {
    if (bits & CmdBit.Pause) setPhase(world, Phase.Run)
    world.prevBits = bits
    return
  }

  if (world.phase === Phase.LevelUp) {
    let pick = -1
    if (bits & CmdBit.Pick1) pick = 0
    else if (bits & CmdBit.Pick2) pick = 1
    else if (bits & CmdBit.Pick3) pick = 2
    if (pick >= 0 && world.levelChoices[pick] >= 0) {
      applyUpgrade(world.upgrades, world.levelChoices[pick] as UpgradeIdValue)
      world.playerMaxHp = BASE_HP + world.upgrades.maxHpBonus
      if (world.playerHp > world.playerMaxHp) world.playerHp = world.playerMaxHp
      if (world.levelChoices[pick] === UpgradeId.Hp) world.playerHp = world.playerMaxHp
      setPhase(world, Phase.Run)
    }
    world.prevBits = bits
    return
  }

  if (bits & CmdBit.Pause) {
    setPhase(world, Phase.Pause)
    world.prevBits = bits
    return
  }

  tickPlayer(world, bits)
  tickSpawns(world)
  tickBoss(world)
  tickFlowers(world)
  tickProjectiles(world)
  tickEnemies(world)
  tickParticles(world)
  world.tick++
  world.prevBits = bits
  if (world.playerHp <= 0) {
    world.playerHp = 0
    endRunCleanup(world, false, ResultKey.Wiped)
    return
  }
  if (world.tick >= SURVIVE_TICKS) {
    endRunCleanup(world, true, ResultKey.Survived)
  }
}

