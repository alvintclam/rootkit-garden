import {
  BASE_HP,
  BASE_SPEED,
  BOSS_PURGE_CD,
  COLONY_DOT,
  COLONY_XP_EVERY,
  DASH_COOLDOWN,
  DASH_FRAMES,
  DASH_SPEED,
  EGG_PRUNE_STREAK,
  EGG_SEED,
  EXPLOIT_CAP,
  EXPLOIT_EMPOWER,
  EXPLOIT_WINDOW,
  FF_CHAIN,
  FF_COLONY,
  FF_EMPOWER,
  FF_SHELLSPIKE,
  FF_SLOWBUFF,
  FF_SWARM,
  FLOWER_MAX_HP,
  FLOWER_RADIUS,
  GRID_CELLS,
  GRID_COLS,
  GRID_ROWS,
  H,
  HEAT_DASH_VENT,
  HEAT_DECAY,
  HEAT_MAX,
  HEAT_MISS,
  HEAT_NEIGHBOR,
  HEAT_PER_FIRE,
  HEAT_PRUNE_DUMP,
  HEAT_SILENCE,
  MAX_ENEMIES,
  MAX_FLOWERS,
  MAX_PARTICLES,
  MAX_PATCHES,
  MAX_PROJECTILES,
  PATCH_LIFE,
  PATCH_RADIUS,
  PF_SPIKE,
  PF_SPIKE_USED,
  PLANT_GRID,
  PLAYER_RADIUS,
  SCAN_CD,
  SCAN_HALF_ANGLE,
  SCAN_MARK,
  SCAN_RANGE,
  SCAN_SILENCE,
  SURVIVE_TICKS,
  W,
  XP_BASE,
  XP_GROWTH,
} from './constants'
import {
  BOSS_MAX_HP,
  BOSS_PULSE_CD,
  BOSS_PULSE_DAMAGE,
  BOSS_PULSE_RANGE,
  BOSS_PULSE_TELE,
  BOSS_SPAWN_TICK,
  BOSS_TELE_TICKS,
  ENEMY_DEFS,
  EnemyKind,
} from './enemies'
import { FLOWER_DEFS, FlowerKind, FlowerStyle } from './flowers'
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

const WAVE_PERIOD = 60 * 15
const STORY_STEPS = 4
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

function cellIndex(x: number, y: number): number {
  const cx = Math.round(x / PLANT_GRID)
  const cy = Math.round(y / PLANT_GRID)
  if (cx < 0 || cy < 0 || cx >= GRID_COLS || cy >= GRID_ROWS) return -1
  return cy * GRID_COLS + cx
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

function nearestEnemySkip(world: World, x: number, y: number, range: number, skip: number): number {
  const r2 = range * range
  let best = -1
  let bestD = r2
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (!world.enemyAlive[i] || i === skip) continue
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

function killEnemy(world: World, e: number): void {
  spawnHitBurst(world, world.enemyX[e], world.enemyY[e])
  if (world.bossSlot === e) world.bossSlot = -1
  const kind = world.enemyKind[e]
  releaseEnemy(world, e)
  world.killCount++
  world.events |= SimEvent.Kill
  gainXp(world, ENEMY_DEFS[kind].xp)
}

function patchBlocks(world: World, x: number, y: number): boolean {
  const r2 = PATCH_RADIUS * PATCH_RADIUS
  for (let i = 0; i < MAX_PATCHES; i++) {
    if (!world.patchAlive[i]) continue
    if (dist2(x, y, world.patchX[i], world.patchY[i]) <= r2) return true
  }
  return false
}

function spawnPatch(world: World, x: number, y: number): void {
  for (let i = 0; i < MAX_PATCHES; i++) {
    if (world.patchAlive[i]) continue
    world.patchAlive[i] = 1
    world.patchX[i] = x
    world.patchY[i] = y
    world.patchLife[i] = PATCH_LIFE
    return
  }
}

function addExploit(world: World): void {
  if (world.exploitStacks >= EXPLOIT_CAP) return
  world.exploitStacks++
  const win = Math.floor(EXPLOIT_WINDOW * world.upgrades.exploitWindowMul)
  world.exploitTimer = win
  if (world.exploitStacks >= EXPLOIT_CAP) {
    fireExploitBurst(world)
  }
}

function fireExploitBurst(world: World): void {
  world.exploitStacks = 0
  world.exploitTimer = 0
  world.exploitEmpower = EXPLOIT_EMPOWER
  world.events |= SimEvent.Exploit
  world.hitstop = 4
  let dmgMul = world.upgrades.damageMul * 1.35
  if (world.eggFlags & EGG_KONAMI) dmgMul *= 1.08
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    const target = nearestEnemy(world, world.flowerX[i], world.flowerY[i], 220)
    if (target < 0) {
      fireDirected(world, world.flowerX[i], world.flowerY[i], nextFloat(world.rng) * 6.28, 10 * dmgMul, 7)
      continue
    }
    fireProjectile(
      world,
      world.flowerX[i],
      world.flowerY[i],
      world.enemyX[target],
      world.enemyY[target],
      12 * dmgMul,
      7.5,
      1,
      0,
    )
  }
}

function neighborCount(world: World, slot: number): number {
  let n = 0
  const x = world.flowerX[slot]
  const y = world.flowerY[slot]
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (i === slot || !world.flowerAlive[i]) continue
    const dx = Math.abs(world.flowerX[i] - x)
    const dy = Math.abs(world.flowerY[i] - y)
    if (dx <= PLANT_GRID + 1 && dy <= PLANT_GRID + 1 && (dx > 0.5 || dy > 0.5)) n++
  }
  return n
}

function hasNeighbor(world: World, gx: number, gy: number): boolean {
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    const dx = Math.abs(world.flowerX[i] - gx)
    const dy = Math.abs(world.flowerY[i] - gy)
    if (dx <= PLANT_GRID + 1 && dy <= PLANT_GRID + 1 && (dx > 0.5 || dy > 0.5)) return true
  }
  return false
}

function rebuildAdjacency(world: World): void {
  for (let i = 0; i < GRID_CELLS; i++) world.gridMap[i] = -1
  for (let i = 0; i < MAX_FLOWERS; i++) {
    world.flowerFlags[i] = world.flowerFlags[i] & FF_EMPOWER
    world.flowerLinkA[i] = -1
    world.flowerLinkB[i] = -1
    world.adjVisited[i] = 0
  }
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    const ci = cellIndex(world.flowerX[i], world.flowerY[i])
    if (ci >= 0) world.gridMap[ci] = i
  }

  let synProc = 0
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    const cx = Math.round(world.flowerX[i] / PLANT_GRID)
    const cy = Math.round(world.flowerY[i] / PLANT_GRID)
    const kind = world.flowerKind[i]
    let linkA = -1
    let linkB = -1
    let flags = world.flowerFlags[i]
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        if (ox === 0 && oy === 0) continue
        const nx = cx + ox
        const ny = cy + oy
        if (nx < 0 || ny < 0 || nx >= GRID_COLS || ny >= GRID_ROWS) continue
        const nSlot = world.gridMap[ny * GRID_COLS + nx]
        if (nSlot < 0) continue
        if (linkA < 0) linkA = nSlot
        else if (linkB < 0 && nSlot !== linkA) linkB = nSlot
        const nk = world.flowerKind[nSlot]
        const nStyle = FLOWER_DEFS[nk].style
        if (kind === FlowerKind.Wormvine && nStyle !== FlowerStyle.Aura) {
          flags |= FF_CHAIN
          synProc = 1
        }
        if (nk === FlowerKind.Wormvine && FLOWER_DEFS[kind].style !== FlowerStyle.Aura) {
          // neighbor wormvine chains off us when it fires; mark us as shot partner visual only
          synProc = 1
        }
        if (kind === FlowerKind.Packet && nk === FlowerKind.Packet) {
          flags |= FF_SWARM
          synProc = 1
        }
        if (nk === FlowerKind.Slowfield) {
          flags |= FF_SLOWBUFF
          synProc = 1
        }
        if (kind === FlowerKind.Buckshot && nk === FlowerKind.Payload) {
          flags |= FF_SHELLSPIKE
          synProc = 1
        }
        if (kind === FlowerKind.Payload && nk === FlowerKind.Buckshot) {
          // payload enables buckshot neighbor; visual link
          synProc = 1
        }
      }
    }
    world.flowerFlags[i] = flags
    world.flowerLinkA[i] = linkA
    world.flowerLinkB[i] = linkB
  }

  // Root colony: connected same-kind clusters of 3+
  for (let start = 0; start < MAX_FLOWERS; start++) {
    if (!world.flowerAlive[start] || world.adjVisited[start]) continue
    const kind = world.flowerKind[start]
    let top = 0
    world.adjStack[top++] = start
    world.adjVisited[start] = 1
    let count = 0
    while (top > 0) {
      top--
      const cur = world.adjStack[top]
      count++
      const cx = Math.round(world.flowerX[cur] / PLANT_GRID)
      const cy = Math.round(world.flowerY[cur] / PLANT_GRID)
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (ox === 0 && oy === 0) continue
          const nx = cx + ox
          const ny = cy + oy
          if (nx < 0 || ny < 0 || nx >= GRID_COLS || ny >= GRID_ROWS) continue
          const nSlot = world.gridMap[ny * GRID_COLS + nx]
          if (nSlot < 0 || world.adjVisited[nSlot]) continue
          if (world.flowerKind[nSlot] !== kind) continue
          world.adjVisited[nSlot] = 1
          world.adjStack[top++] = nSlot
        }
      }
    }
    if (count >= 3) {
      synProc = 1
      for (let i = 0; i < MAX_FLOWERS; i++) {
        if (!world.flowerAlive[i]) continue
        if (world.flowerKind[i] !== kind) continue
        // mark only those visited in this flood — reuse visited==1 from this component
        // Re-flood is expensive; instead mark during count via stack copy.
      }
      // Re-walk component via grid again to set FF_COLONY
      top = 0
      world.adjStack[top++] = start
      while (top > 0) {
        top--
        const cur = world.adjStack[top]
        world.flowerFlags[cur] |= FF_COLONY
        const cx = Math.round(world.flowerX[cur] / PLANT_GRID)
        const cy = Math.round(world.flowerY[cur] / PLANT_GRID)
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            if (ox === 0 && oy === 0) continue
            const nx = cx + ox
            const ny = cy + oy
            if (nx < 0 || ny < 0 || nx >= GRID_COLS || ny >= GRID_ROWS) continue
            const nSlot = world.gridMap[ny * GRID_COLS + nx]
            if (nSlot < 0) continue
            if (world.flowerKind[nSlot] !== kind) continue
            if ((world.flowerFlags[nSlot] & FF_COLONY) === 0) {
              world.flowerFlags[nSlot] |= FF_COLONY
              world.adjStack[top++] = nSlot
            }
          }
        }
      }
    }
  }

  if (synProc) {
    // subtle: only pulse event occasionally to avoid SFX spam
    if ((world.tick & 31) === 0) world.events |= SimEvent.Synergy
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
  if (world.wave >= 3 && roll > 0.78) kind = EnemyKind.Heavyscan
  else if (roll > 0.48) kind = EnemyKind.Drone
  const def = ENEMY_DEFS[kind]
  const hpScale = 1 + world.wave * 0.12
  world.enemyAlive[slot] = 1
  world.enemyX[slot] = x
  world.enemyY[slot] = y
  world.enemyHp[slot] = def.hp * hpScale
  world.enemyKind[slot] = kind
  world.enemySlow[slot] = 0
  world.enemyTimer[slot] = kind === EnemyKind.Scanner ? nextInt(world.rng, 20, 60) : nextInt(world.rng, 40, 90)
  world.enemyPhase[slot] = nextFloat(world.rng) * 6.283185307179586
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
  world.bossPurgeCd = BOSS_PURGE_CD
  world.bossPurged = 0
  world.enemyAlive[slot] = 1
  world.enemyX[slot] = W * 0.5
  world.enemyY[slot] = -40
  world.enemyHp[slot] = def.hp
  world.enemyKind[slot] = EnemyKind.Boss
  world.enemySlow[slot] = 0
  world.enemyTimer[slot] = 0
  world.enemyPhase[slot] = 0
  world.events |= SimEvent.LevelUp
}

function tryPlant(world: World): void {
  if (countAliveFlowers(world) >= world.upgrades.maxFlowers) return
  const gx = Math.round(world.playerX / PLANT_GRID) * PLANT_GRID
  const gy = Math.round(world.playerY / PLANT_GRID) * PLANT_GRID
  if (patchBlocks(world, gx, gy)) return
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    if (dist2(gx, gy, world.flowerX[i], world.flowerY[i]) < 4) return
  }
  const slot = aliveFlowerSlot(world)
  if (slot < 0) return
  const adj = hasNeighbor(world, gx, gy)
  world.flowerAlive[slot] = 1
  world.flowerX[slot] = gx
  world.flowerY[slot] = gy
  world.flowerKind[slot] = world.plantKind
  world.flowerCd[slot] = world.exploitEmpower > 0 ? 4 : 10
  world.flowerHeat[slot] = 0
  world.flowerHp[slot] = FLOWER_MAX_HP
  world.flowerMark[slot] = 0
  world.flowerSilence[slot] = 0
  world.flowerFlags[slot] = world.exploitEmpower > 0 ? FF_EMPOWER : 0
  world.flowerLinkA[slot] = -1
  world.flowerLinkB[slot] = -1
  if (slot >= world.flowerCount) world.flowerCount = slot + 1
  world.pruneStreak = 0
  world.events |= SimEvent.Plant
  // Exploit: plant after dash/prune, or plant that creates adjacency
  if (world.recentDash > 0 || world.recentPrune > 0 || adj) addExploit(world)
  world.recentPlant = Math.floor(EXPLOIT_WINDOW * world.upgrades.exploitWindowMul)
  rebuildAdjacency(world)
}

function tryPrune(world: World): void {
  const i = nearestFlower(world, world.playerX, world.playerY)
  if (i < 0) return
  if (dist2(world.playerX, world.playerY, world.flowerX[i], world.flowerY[i]) > 48 * 48) return
  world.flowerAlive[i] = 0
  // Dump heat from neighbors
  const dump = HEAT_PRUNE_DUMP * world.upgrades.pruneDumpMul
  for (let n = 0; n < MAX_FLOWERS; n++) {
    if (!world.flowerAlive[n]) continue
    const dx = Math.abs(world.flowerX[n] - world.flowerX[i])
    const dy = Math.abs(world.flowerY[n] - world.flowerY[i])
    if (dx <= PLANT_GRID + 1 && dy <= PLANT_GRID + 1) {
      world.flowerHeat[n] = clamp(world.flowerHeat[n] - dump, 0, HEAT_MAX)
      if (world.flowerSilence[n] > 0 && world.flowerHeat[n] < HEAT_SILENCE) {
        world.flowerSilence[n] = 0
      }
    }
  }
  if (world.upgrades.pruneHeal > 0) {
    world.playerHp = clamp(world.playerHp + world.upgrades.pruneHeal, 0, world.playerMaxHp)
  }
  world.pruneStreak++
  if (world.pruneStreak >= EGG_PRUNE_STREAK && (world.eggFlags & EGG_PRUNE_RITUAL) === 0) {
    world.eggFlags |= EGG_PRUNE_RITUAL
    world.playerHp = clamp(world.playerHp + 20, 0, world.playerMaxHp)
  }
  world.events |= SimEvent.Prune
  if (world.recentPlant > 0 || world.recentDash > 0) addExploit(world)
  world.recentPrune = Math.floor(EXPLOIT_WINDOW * world.upgrades.exploitWindowMul)
  rebuildAdjacency(world)
}

function fireProjectile(
  world: World,
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  dmg: number,
  speed: number,
  bounce: number,
  flags: number,
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
  world.projBounce[slot] = bounce
  world.projFlags[slot] = flags
}

function fireDirected(
  world: World,
  fx: number,
  fy: number,
  angle: number,
  dmg: number,
  speed: number,
  bounce?: number,
  flags?: number,
): void {
  const slot = acquireProj(world)
  if (slot < 0) return
  world.projAlive[slot] = 1
  world.projX[slot] = fx
  world.projY[slot] = fy
  world.projVx[slot] = Math.cos(angle) * speed
  world.projVy[slot] = Math.sin(angle) * speed
  world.projDmg[slot] = dmg
  world.projBounce[slot] = bounce ? bounce : 0
  world.projFlags[slot] = flags ? flags : 0
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
  if (bits & CmdBit.Dash && world.dashCd <= 0 && world.dashLeft <= 0) {
    world.dashLeft = DASH_FRAMES
    world.dashCd = Math.floor(DASH_COOLDOWN * world.upgrades.dashCooldownMul)
    world.events |= SimEvent.Dash
    if (world.recentPlant > 0 || world.recentPrune > 0) addExploit(world)
    world.recentDash = Math.floor(EXPLOIT_WINDOW * world.upgrades.exploitWindowMul)
  }
  let moveMul = world.upgrades.moveMul
  if (world.eggFlags & EGG_KONAMI) moveMul *= 1.06
  const speed = world.dashLeft > 0 ? DASH_SPEED : BASE_SPEED * moveMul
  world.playerX = clamp(world.playerX + mx * speed, PLAYER_RADIUS, W - PLAYER_RADIUS)
  world.playerY = clamp(world.playerY + my * speed, PLAYER_RADIUS, H - PLAYER_RADIUS)
  if (world.dashLeft > 0) {
    // Dash vent: cool nearby flowers
    const vent = HEAT_DASH_VENT * world.upgrades.dashVentMul
    for (let f = 0; f < MAX_FLOWERS; f++) {
      if (!world.flowerAlive[f]) continue
      if (dist2(world.playerX, world.playerY, world.flowerX[f], world.flowerY[f]) <= 36 * 36) {
        world.flowerHeat[f] = clamp(world.flowerHeat[f] - vent * 0.15, 0, HEAT_MAX)
      }
    }
    world.dashLeft--
  }
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
    if (world.enemyHp[e] <= 0) killEnemy(world, e)
  }
}

function applyColonyAura(world: World): void {
  const mul = world.upgrades.colonyMul
  let any = 0
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    if ((world.flowerFlags[i] & FF_COLONY) === 0) continue
    any = 1
    const fx = world.flowerX[i]
    const fy = world.flowerY[i]
    const r2 = 70 * 70
    for (let e = 0; e < MAX_ENEMIES; e++) {
      if (!world.enemyAlive[e]) continue
      if (dist2(fx, fy, world.enemyX[e], world.enemyY[e]) > r2) continue
      world.enemyHp[e] -= COLONY_DOT * mul
      if (world.enemyHp[e] <= 0) killEnemy(world, e)
    }
  }
  if (any) {
    world.colonyXpCd--
    if (world.colonyXpCd <= 0) {
      world.colonyXpCd = COLONY_XP_EVERY
      gainXp(world, Math.max(1, Math.floor(2 * mul)))
    }
  }
}

function tickFlowers(world: World): void {
  let dmgMul = world.upgrades.damageMul
  if (world.eggFlags & EGG_KONAMI) dmgMul *= 1.08
  const synAmp = world.upgrades.synergyAmp
  const heatMul = world.upgrades.heatMul

  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue

    // heat decay
    if (world.flowerHeat[i] > 0) {
      world.flowerHeat[i] = clamp(world.flowerHeat[i] - HEAT_DECAY, 0, HEAT_MAX)
    }
    if (world.flowerMark[i] > 0) world.flowerMark[i]--
    if (world.flowerSilence[i] > 0) world.flowerSilence[i]--
    if ((world.flowerFlags[i] & FF_EMPOWER) !== 0 && world.exploitEmpower <= 0) {
      world.flowerFlags[i] &= ~FF_EMPOWER
    }

    if (world.flowerSilence[i] > 0) {
      if (world.flowerCd[i] > 0) world.flowerCd[i]--
      continue
    }

    if (world.flowerCd[i] > 0) {
      world.flowerCd[i]--
      continue
    }

    const def = FLOWER_DEFS[world.flowerKind[i]]
    const flags = world.flowerFlags[i]
    let range = def.range * world.upgrades.rangeMul
    let dmg = def.damage * dmgMul
    let rateMul = world.upgrades.fireRateMul

    if (flags & FF_SLOWBUFF) {
      rateMul *= 1.18 * synAmp
      dmg *= 1.1 * Math.min(1.25, synAmp)
    }
    if (flags & FF_EMPOWER) {
      rateMul *= 1.35
      dmg *= 1.4
    }
    if (flags & FF_SWARM) {
      rateMul *= 1.22 * Math.min(1.3, synAmp)
    }

    // Heat accrual before fire
    const dens = neighborCount(world, i)
    const heatGain = (HEAT_PER_FIRE + dens * HEAT_NEIGHBOR) * heatMul
    world.flowerHeat[i] = clamp(world.flowerHeat[i] + heatGain, 0, HEAT_MAX)

    // Overheat miss / silence / self-damage
    if (world.flowerHeat[i] >= HEAT_SILENCE) {
      world.flowerSilence[i] = 24
      world.flowerHp[i] -= 4
      world.events |= SimEvent.Overheat
      if (world.flowerHp[i] <= 0) {
        world.flowerAlive[i] = 0
        rebuildAdjacency(world)
        continue
      }
      world.flowerCd[i] = Math.max(6, Math.floor(def.cooldown / rateMul))
      continue
    }
    if (world.flowerHeat[i] >= HEAT_MISS) {
      const miss = (world.flowerHeat[i] - HEAT_MISS) / (HEAT_MAX - HEAT_MISS)
      if (nextFloat(world.rng) < miss * 0.55) {
        world.flowerCd[i] = Math.max(6, Math.floor(def.cooldown / rateMul))
        continue
      }
    }

    if (def.style === FlowerStyle.Aura) {
      applyAuraSlow(world, world.flowerX[i], world.flowerY[i], range, dmg)
      world.flowerCd[i] = Math.max(6, Math.floor(def.cooldown / rateMul))
      continue
    }

    const target = nearestEnemy(world, world.flowerX[i], world.flowerY[i], range)
    if (target < 0) continue

    let bounce = 0
    if (flags & FF_CHAIN) bounce = Math.max(1, Math.floor(synAmp))
    let pflags = 0
    if (flags & FF_SHELLSPIKE) pflags |= PF_SPIKE
    if (flags & FF_SHELLSPIKE) dmg *= 1.15 * synAmp

    if (def.style === FlowerStyle.Spread) {
      const ang = Math.atan2(
        world.enemyY[target] - world.flowerY[i],
        world.enemyX[target] - world.flowerX[i],
      )
      fireDirected(world, world.flowerX[i], world.flowerY[i], ang - 0.28, dmg, def.projectileSpeed, bounce, pflags)
      fireDirected(world, world.flowerX[i], world.flowerY[i], ang, dmg, def.projectileSpeed, bounce, pflags)
      fireDirected(world, world.flowerX[i], world.flowerY[i], ang + 0.28, dmg, def.projectileSpeed, bounce, pflags)
    } else {
      fireProjectile(
        world,
        world.flowerX[i],
        world.flowerY[i],
        world.enemyX[target],
        world.enemyY[target],
        dmg,
        def.projectileSpeed,
        bounce,
        pflags,
      )
      // Packet swarm dual shot
      if (flags & FF_SWARM) {
        const ang = Math.atan2(
          world.enemyY[target] - world.flowerY[i],
          world.enemyX[target] - world.flowerX[i],
        )
        fireDirected(
          world,
          world.flowerX[i],
          world.flowerY[i],
          ang + 0.18,
          dmg * 0.75,
          def.projectileSpeed,
          0,
          0,
        )
      }
      // Wormvine chain splash to second target
      if (flags & FF_CHAIN) {
        const second = nearestEnemySkip(world, world.flowerX[i], world.flowerY[i], range * 1.1, target)
        if (second >= 0) {
          fireProjectile(
            world,
            world.flowerX[i],
            world.flowerY[i],
            world.enemyX[second],
            world.enemyY[second],
            dmg * 0.65 * synAmp,
            def.projectileSpeed * 0.9,
            0,
            0,
          )
        }
      }
    }

    let cd = Math.max(6, Math.floor(def.cooldown / rateMul))
    if (flags & FF_SWARM) cd = Math.max(5, Math.floor(cd * 0.82))
    world.flowerCd[i] = cd
  }

  applyColonyAura(world)
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
        let dmg = world.projDmg[i]
        if ((world.projFlags[i] & PF_SPIKE) !== 0 && (world.projFlags[i] & PF_SPIKE_USED) === 0) {
          dmg *= 1.55
          world.projFlags[i] |= PF_SPIKE_USED
        }
        // Marked flowers' targets already handled; marked flowers take extra when hit by enemies — here enemies take normal proj dmg
        world.enemyHp[e] -= dmg
        const bounce = world.projBounce[i]
        const px = world.projX[i]
        const py = world.projY[i]
        const spd = Math.sqrt(world.projVx[i] * world.projVx[i] + world.projVy[i] * world.projVy[i]) || 6
        const leftFlags = world.projFlags[i]
        releaseProj(world, i)
        if (world.enemyHp[e] <= 0) {
          killEnemy(world, e)
        } else if (bounce > 0) {
          const next = nearestEnemySkip(world, px, py, 160, e)
          if (next >= 0) {
            fireProjectile(
              world,
              px,
              py,
              world.enemyX[next],
              world.enemyY[next],
              dmg * 0.7,
              spd,
              bounce - 1,
              leftFlags & ~PF_SPIKE,
            )
          }
        }
        break
      }
    }
  }
}

function bossPurgeFlower(world: World): void {
  const candidates = world.adjStack
  let n = 0
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    candidates[n++] = i
  }
  if (n <= 0) return
  const pick = nextInt(world.rng, 0, n)
  const slot = candidates[pick]
  world.flowerAlive[slot] = 0
  world.events |= SimEvent.Overheat
  world.hitstop = 3
  rebuildAdjacency(world)
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

  // Purge phase when below half HP or on purge CD
  if (world.bossPurgeCd > 0) world.bossPurgeCd--
  if (
    world.enemyHp[slot] <= BOSS_MAX_HP * 0.55 &&
    world.bossPurged === 0
  ) {
    world.bossPurged = 1
    bossPurgeFlower(world)
    world.bossPurgeCd = BOSS_PURGE_CD
  } else if (world.bossPurgeCd <= 0 && world.bossPurged > 0) {
    bossPurgeFlower(world)
    world.bossPurgeCd = BOSS_PURGE_CD
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

function scannerMark(world: World, ei: number): void {
  const ex = world.enemyX[ei]
  const ey = world.enemyY[ei]
  const ang = Math.atan2(world.playerY - ey, world.playerX - ex)
  world.enemyPhase[ei] = ang
  const r2 = SCAN_RANGE * SCAN_RANGE
  for (let f = 0; f < MAX_FLOWERS; f++) {
    if (!world.flowerAlive[f]) continue
    const dx = world.flowerX[f] - ex
    const dy = world.flowerY[f] - ey
    const d2 = dx * dx + dy * dy
    if (d2 > r2 || d2 < 1) continue
    const fang = Math.atan2(dy, dx)
    let diff = fang - ang
    while (diff > Math.PI) diff -= 6.283185307179586
    while (diff < -Math.PI) diff += 6.283185307179586
    if (diff < 0) diff = -diff
    if (diff <= SCAN_HALF_ANGLE) {
      world.flowerMark[f] = SCAN_MARK
      world.flowerSilence[f] = SCAN_SILENCE
    }
  }
}

function tickEnemies(world: World): void {
  const diff = difficultyDef(world.difficulty)
  const dmgMul = diff.contactDmgMul
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (!world.enemyAlive[i]) continue
    const kind = world.enemyKind[i]
    const def = ENEMY_DEFS[kind]
    const dx = world.playerX - world.enemyX[i]
    const dy = world.playerY - world.enemyY[i]
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    let spd = def.speed * (1 + world.wave * 0.03) * diff.speedMul
    if (world.enemySlow[i] > 0) {
      spd *= 0.45
      world.enemySlow[i]--
    }

    if (kind === EnemyKind.Drone) {
      // Strafe / orbit: mix chase with perpendicular orbit
      world.enemyPhase[i] += 0.045
      const ox = -dy / len
      const oy = dx / len
      const orbit = Math.sin(world.enemyPhase[i]) * 0.7
      world.enemyX[i] += (dx / len) * spd * 0.55 + ox * spd * orbit
      world.enemyY[i] += (dy / len) * spd * 0.55 + oy * spd * orbit
    } else if (kind === EnemyKind.Scanner) {
      world.enemyX[i] += (dx / len) * spd
      world.enemyY[i] += (dy / len) * spd
      world.enemyTimer[i]--
      if (world.enemyTimer[i] <= 0) {
        scannerMark(world, i)
        world.enemyTimer[i] = SCAN_CD
      }
    } else if (kind === EnemyKind.Heavyscan) {
      world.enemyX[i] += (dx / len) * spd
      world.enemyY[i] += (dy / len) * spd
      world.enemyTimer[i]--
      if (world.enemyTimer[i] <= 0) {
        spawnPatch(world, world.enemyX[i], world.enemyY[i])
        world.enemyTimer[i] = 150 + nextInt(world.rng, 0, 40)
      }
    } else {
      world.enemyX[i] += (dx / len) * spd
      world.enemyY[i] += (dy / len) * spd
    }

    const hitR = PLAYER_RADIUS + def.radius
    if (dist2(world.playerX, world.playerY, world.enemyX[i], world.enemyY[i]) <= hitR * hitR) {
      if (world.dashLeft <= 0) {
        const touch = kind === EnemyKind.Boss ? 0.55 : 0.35
        world.playerHp -= (touch + world.wave * 0.02) * dmgMul
      }
    }
    if (kind === EnemyKind.Boss) continue
    for (let f = 0; f < MAX_FLOWERS; f++) {
      if (!world.flowerAlive[f]) continue
      const fr = FLOWER_RADIUS + def.radius
      if (dist2(world.flowerX[f], world.flowerY[f], world.enemyX[i], world.enemyY[i]) <= fr * fr) {
        // Marked flowers take heavier trampling
        if (world.flowerMark[f] > 0) {
          world.flowerHp[f] -= 18
        } else {
          world.flowerHp[f] -= 10
        }
        if (world.flowerHp[f] <= 0) {
          world.flowerAlive[f] = 0
          rebuildAdjacency(world)
        }
      }
    }
  }
}

function tickPatches(world: World): void {
  for (let i = 0; i < MAX_PATCHES; i++) {
    if (!world.patchAlive[i]) continue
    world.patchLife[i]--
    if (world.patchLife[i] <= 0) world.patchAlive[i] = 0
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
  const base = Math.max(26, 90 - world.wave * 4)
  world.spawnTimer = Math.floor((base + nextInt(world.rng, 0, 18)) * diff.spawnIntervalMul)
}

function tickComboTimers(world: World): void {
  if (world.recentPlant > 0) world.recentPlant--
  if (world.recentDash > 0) world.recentDash--
  if (world.recentPrune > 0) world.recentPrune--
  if (world.exploitTimer > 0) {
    world.exploitTimer--
    if (world.exploitTimer <= 0 && world.exploitStacks > 0 && world.exploitStacks < EXPLOIT_CAP) {
      world.exploitStacks = Math.max(0, world.exploitStacks - 1)
      if (world.exploitStacks > 0) {
        world.exploitTimer = Math.floor(EXPLOIT_WINDOW * 0.45 * world.upgrades.exploitWindowMul)
      }
    }
  }
  if (world.exploitEmpower > 0) world.exploitEmpower--
  if (world.hitstop > 0) world.hitstop--
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

  // Hitstop-lite: skip movement ticks briefly but still advance timers lightly
  if (world.hitstop > 0) {
    world.hitstop--
    tickComboTimers(world)
    world.tick++
    world.prevBits = bits
    return
  }

  tickPlayer(world, bits)
  tickComboTimers(world)
  tickSpawns(world)
  tickBoss(world)
  // adjacency rebuild every 8 ticks (cheap) + on plant/prune
  if ((world.tick & 7) === 0) rebuildAdjacency(world)
  tickFlowers(world)
  tickProjectiles(world)
  tickEnemies(world)
  tickPatches(world)
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
