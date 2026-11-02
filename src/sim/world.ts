import {
  BASE_HP,
  GRID_CELLS,
  MAX_ENEMIES,
  MAX_FLOWERS,
  MAX_PARTICLES,
  MAX_FLOATS,
  MAX_PATCHES,
  MAX_PROJECTILES,
  MAX_TRAIL,
  W,
  H,
} from './constants'
import { FlowerKind, type FlowerKindId } from './flowers'
import { createRng, type Rng } from './rng'
import { createUpgrades, type PlayerUpgrades } from './upgrades'
import { Phase, type PhaseId } from './state'
import type { InputCmd } from './inputCmd'
import { Difficulty, difficultyDef, type DifficultyId } from './difficulty'
import { resetAllPools } from './pools'

export type World = {
  seed: number
  rng: Rng
  phase: PhaseId
  tick: number
  playerX: number
  playerY: number
  playerHp: number
  playerMaxHp: number
  dashLeft: number
  dashCd: number
  plantKind: FlowerKindId
  upgrades: PlayerUpgrades
  xp: number
  level: number
  xpToNext: number
  killCount: number
  survived: boolean
  levelChoices: number[]
  flowerCount: number
  flowerX: Float32Array
  flowerY: Float32Array
  flowerKind: Int8Array
  flowerCd: Int16Array
  flowerAlive: Uint8Array
  flowerHeat: Float32Array
  flowerHp: Float32Array
  flowerMark: Int16Array
  flowerSilence: Int16Array
  flowerFlags: Uint8Array
  flowerLinkA: Int8Array
  flowerLinkB: Int8Array
  enemyCount: number
  enemyLive: number
  enemyX: Float32Array
  enemyY: Float32Array
  enemyHp: Float32Array
  enemyKind: Int8Array
  enemyAlive: Uint8Array
  enemySlow: Int16Array
  enemyTimer: Int16Array
  enemyPhase: Float32Array
  enemyFree: Int16Array
  enemyFreeTop: number
  projCount: number
  projLive: number
  projX: Float32Array
  projY: Float32Array
  projVx: Float32Array
  projVy: Float32Array
  projDmg: Float32Array
  projAlive: Uint8Array
  projBounce: Int8Array
  projFlags: Uint8Array
  projFree: Int16Array
  projFreeTop: number
  partCount: number
  partLive: number
  partX: Float32Array
  partY: Float32Array
  partVx: Float32Array
  partVy: Float32Array
  partLife: Int16Array
  partAlive: Uint8Array
  partFree: Int16Array
  partFreeTop: number
  patchAlive: Uint8Array
  patchX: Float32Array
  patchY: Float32Array
  patchLife: Int16Array
  gridMap: Int16Array
  adjVisited: Uint8Array
  adjStack: Int8Array
  spawnTimer: number
  wave: number
  cmdLog: InputCmd[]
  tipSeen: boolean
  storyDone: boolean
  storyStep: number
  difficulty: DifficultyId
  events: number
  resultKey: number
  inputFrames: number[]
  bossSpawned: number
  bossTeleLeft: number
  bossPulseCd: number
  bossPulseTele: number
  bossSlot: number
  bossPurgeCd: number
  bossPurged: number
  prevBits: number
  eggFlags: number
  pruneStreak: number
  konamiStep: number
  exploitStacks: number
  exploitTimer: number
  exploitEmpower: number
  recentPlant: number
  recentDash: number
  recentPrune: number
  colonyXpCd: number
  hitstop: number
  killStreak: number
  killStreakTimer: number
  shakeLeft: number
  shakeMag: number
  zoomPunch: number
  flashLeft: number
  calloutId: number
  calloutLife: number
  plantFlashX: number
  plantFlashY: number
  plantFlashLife: number
  pruneFlashX: number
  pruneFlashY: number
  pruneFlashLife: number
  linkSparkLife: number
  linkSparkX0: number
  linkSparkY0: number
  linkSparkX1: number
  linkSparkY1: number
  exploitPipFlash: number
  levelSnap: number
  linkCount: number
  deathPopX: number
  deathPopY: number
  deathPopLife: number
  aimX: number
  aimY: number
  injectCd: number
  waveBeat: number
  layoutLeft: number
  prevWaveBeat: number
  partKind: Uint8Array
  floatAlive: Uint8Array
  floatX: Float32Array
  floatY: Float32Array
  floatVy: Float32Array
  floatVal: Float32Array
  floatLife: Int16Array
  floatBig: Uint8Array
  trailX: Float32Array
  trailY: Float32Array
  trailLife: Int16Array
}

export const ResultKey = {
  None: 0,
  Wiped: 1,
  Survived: 2,
} as const

export function createWorld(seed: number, difficulty: DifficultyId = Difficulty.Normal): World {
  const upgrades = createUpgrades()
  const diff = difficultyDef(difficulty)
  const world: World = {
    seed,
    rng: createRng(seed),
    phase: Phase.Menu,
    tick: 0,
    playerX: W * 0.5,
    playerY: H * 0.5,
    playerHp: BASE_HP,
    playerMaxHp: BASE_HP,
    dashLeft: 0,
    dashCd: 0,
    plantKind: FlowerKind.Packet,
    upgrades,
    xp: 0,
    level: 1,
    xpToNext: 12,
    killCount: 0,
    survived: false,
    levelChoices: [-1, -1, -1],
    flowerCount: 0,
    flowerX: new Float32Array(MAX_FLOWERS),
    flowerY: new Float32Array(MAX_FLOWERS),
    flowerKind: new Int8Array(MAX_FLOWERS),
    flowerCd: new Int16Array(MAX_FLOWERS),
    flowerAlive: new Uint8Array(MAX_FLOWERS),
    flowerHeat: new Float32Array(MAX_FLOWERS),
    flowerHp: new Float32Array(MAX_FLOWERS),
    flowerMark: new Int16Array(MAX_FLOWERS),
    flowerSilence: new Int16Array(MAX_FLOWERS),
    flowerFlags: new Uint8Array(MAX_FLOWERS),
    flowerLinkA: new Int8Array(MAX_FLOWERS),
    flowerLinkB: new Int8Array(MAX_FLOWERS),
    enemyCount: MAX_ENEMIES,
    enemyLive: 0,
    enemyX: new Float32Array(MAX_ENEMIES),
    enemyY: new Float32Array(MAX_ENEMIES),
    enemyHp: new Float32Array(MAX_ENEMIES),
    enemyKind: new Int8Array(MAX_ENEMIES),
    enemyAlive: new Uint8Array(MAX_ENEMIES),
    enemySlow: new Int16Array(MAX_ENEMIES),
    enemyTimer: new Int16Array(MAX_ENEMIES),
    enemyPhase: new Float32Array(MAX_ENEMIES),
    enemyFree: new Int16Array(MAX_ENEMIES),
    enemyFreeTop: 0,
    projCount: MAX_PROJECTILES,
    projLive: 0,
    projX: new Float32Array(MAX_PROJECTILES),
    projY: new Float32Array(MAX_PROJECTILES),
    projVx: new Float32Array(MAX_PROJECTILES),
    projVy: new Float32Array(MAX_PROJECTILES),
    projDmg: new Float32Array(MAX_PROJECTILES),
    projAlive: new Uint8Array(MAX_PROJECTILES),
    projBounce: new Int8Array(MAX_PROJECTILES),
    projFlags: new Uint8Array(MAX_PROJECTILES),
    projFree: new Int16Array(MAX_PROJECTILES),
    projFreeTop: 0,
    partCount: MAX_PARTICLES,
    partLive: 0,
    partX: new Float32Array(MAX_PARTICLES),
    partY: new Float32Array(MAX_PARTICLES),
    partVx: new Float32Array(MAX_PARTICLES),
    partVy: new Float32Array(MAX_PARTICLES),
    partLife: new Int16Array(MAX_PARTICLES),
    partAlive: new Uint8Array(MAX_PARTICLES),
    partFree: new Int16Array(MAX_PARTICLES),
    partFreeTop: 0,
    patchAlive: new Uint8Array(MAX_PATCHES),
    patchX: new Float32Array(MAX_PATCHES),
    patchY: new Float32Array(MAX_PATCHES),
    patchLife: new Int16Array(MAX_PATCHES),
    gridMap: new Int16Array(GRID_CELLS),
    adjVisited: new Uint8Array(MAX_FLOWERS),
    adjStack: new Int8Array(MAX_FLOWERS),
    spawnTimer: diff.initialSpawnDelay,
    wave: 0,
    cmdLog: [],
    tipSeen: false,
    storyDone: false,
    storyStep: 0,
    difficulty,
    events: 0,
    resultKey: ResultKey.None,
    inputFrames: [],
    bossSpawned: 0,
    bossTeleLeft: 0,
    bossPulseCd: 0,
    bossPulseTele: 0,
    bossSlot: -1,
    bossPurgeCd: 0,
    bossPurged: 0,
    prevBits: 0,
    eggFlags: 0,
    pruneStreak: 0,
    konamiStep: 0,
    exploitStacks: 0,
    exploitTimer: 0,
    exploitEmpower: 0,
    recentPlant: 0,
    recentDash: 0,
    recentPrune: 0,
    colonyXpCd: 0,
    hitstop: 0,
    killStreak: 0,
    killStreakTimer: 0,
    shakeLeft: 0,
    shakeMag: 0,
    zoomPunch: 0,
    flashLeft: 0,
    calloutId: 0,
    calloutLife: 0,
    plantFlashX: 0,
    plantFlashY: 0,
    plantFlashLife: 0,
    pruneFlashX: 0,
    pruneFlashY: 0,
    pruneFlashLife: 0,
    linkSparkLife: 0,
    linkSparkX0: 0,
    linkSparkY0: 0,
    linkSparkX1: 0,
    linkSparkY1: 0,
    exploitPipFlash: 0,
    levelSnap: 0,
    linkCount: 0,
    deathPopX: 0,
    deathPopY: 0,
    deathPopLife: 0,
    aimX: 0,
    aimY: -1,
    injectCd: 0,
    waveBeat: 0,
    layoutLeft: 0,
    prevWaveBeat: -1,
    partKind: new Uint8Array(MAX_PARTICLES),
    floatAlive: new Uint8Array(MAX_FLOATS),
    floatX: new Float32Array(MAX_FLOATS),
    floatY: new Float32Array(MAX_FLOATS),
    floatVy: new Float32Array(MAX_FLOATS),
    floatVal: new Float32Array(MAX_FLOATS),
    floatLife: new Int16Array(MAX_FLOATS),
    floatBig: new Uint8Array(MAX_FLOATS),
    trailX: new Float32Array(MAX_TRAIL),
    trailY: new Float32Array(MAX_TRAIL),
    trailLife: new Int16Array(MAX_TRAIL),
  }
  resetAllPools(world)
  return world
}

export function resetRun(world: World, seed: number): void {
  const diff = difficultyDef(world.difficulty)
  world.seed = seed
  world.rng = createRng(seed)
  world.phase = Phase.Run
  world.tick = 0
  world.playerX = W * 0.5
  world.playerY = H * 0.5
  world.upgrades = createUpgrades()
  world.playerMaxHp = BASE_HP + world.upgrades.maxHpBonus
  world.playerHp = world.playerMaxHp
  world.dashLeft = 0
  world.dashCd = 0
  world.plantKind = FlowerKind.Packet
  world.xp = 0
  world.level = 1
  world.xpToNext = 12
  world.killCount = 0
  world.survived = false
  world.levelChoices[0] = -1
  world.levelChoices[1] = -1
  world.levelChoices[2] = -1
  world.flowerCount = 0
  world.flowerAlive.fill(0)
  world.flowerHeat.fill(0)
  world.flowerHp.fill(0)
  world.flowerMark.fill(0)
  world.flowerSilence.fill(0)
  world.flowerFlags.fill(0)
  world.flowerLinkA.fill(-1)
  world.flowerLinkB.fill(-1)
  resetAllPools(world)
  world.patchAlive.fill(0)
  world.spawnTimer = diff.initialSpawnDelay
  world.wave = 0
  world.cmdLog = []
  world.events = 0
  world.resultKey = ResultKey.None
  world.storyStep = 0
  world.inputFrames = []
  world.enemySlow.fill(0)
  world.enemyTimer.fill(0)
  world.enemyPhase.fill(0)
  world.projBounce.fill(0)
  world.projFlags.fill(0)
  world.bossSpawned = 0
  world.bossTeleLeft = 0
  world.bossPulseCd = 0
  world.bossPulseTele = 0
  world.bossSlot = -1
  world.bossPurgeCd = 0
  world.bossPurged = 0
  world.prevBits = 0
  world.eggFlags = 0
  world.pruneStreak = 0
  world.konamiStep = 0
  world.exploitStacks = 0
  world.exploitTimer = 0
  world.exploitEmpower = 0
  world.recentPlant = 0
  world.recentDash = 0
  world.recentPrune = 0
  world.colonyXpCd = 0
  world.hitstop = 0
  world.killStreak = 0
  world.killStreakTimer = 0
  world.shakeLeft = 0
  world.shakeMag = 0
  world.zoomPunch = 0
  world.flashLeft = 0
  world.calloutId = 0
  world.calloutLife = 0
  world.plantFlashLife = 0
  world.pruneFlashLife = 0
  world.linkSparkLife = 0
  world.exploitPipFlash = 0
  world.levelSnap = 0
  world.linkCount = 0
  world.deathPopLife = 0
  world.aimX = 0
  world.aimY = -1
  world.injectCd = 0
  world.waveBeat = 0
  world.layoutLeft = 0
  world.prevWaveBeat = -1
  world.partKind.fill(0)
  world.floatAlive.fill(0)
  world.trailLife.fill(0)
}

export function countAliveEnemies(world: World): number {
  return world.enemyLive
}
