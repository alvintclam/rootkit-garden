import {
  BASE_HP,
  MAX_ENEMIES,
  MAX_FLOWERS,
  MAX_PARTICLES,
  MAX_PROJECTILES,
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
  enemyCount: number
  enemyLive: number
  enemyX: Float32Array
  enemyY: Float32Array
  enemyHp: Float32Array
  enemyKind: Int8Array
  enemyAlive: Uint8Array
  enemySlow: Int16Array
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
  prevBits: number
  eggFlags: number
  pruneStreak: number
  konamiStep: number
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
    enemyCount: MAX_ENEMIES,
    enemyLive: 0,
    enemyX: new Float32Array(MAX_ENEMIES),
    enemyY: new Float32Array(MAX_ENEMIES),
    enemyHp: new Float32Array(MAX_ENEMIES),
    enemyKind: new Int8Array(MAX_ENEMIES),
    enemyAlive: new Uint8Array(MAX_ENEMIES),
    enemySlow: new Int16Array(MAX_ENEMIES),
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
    prevBits: 0,
    eggFlags: 0,
    pruneStreak: 0,
    konamiStep: 0,
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
  resetAllPools(world)
  world.spawnTimer = diff.initialSpawnDelay
  world.wave = 0
  world.cmdLog = []
  world.events = 0
  world.resultKey = ResultKey.None
  world.storyStep = 0
  world.inputFrames = []
  world.enemySlow.fill(0)
  world.bossSpawned = 0
  world.bossTeleLeft = 0
  world.bossPulseCd = 0
  world.bossPulseTele = 0
  world.bossSlot = -1
  world.prevBits = 0
  world.eggFlags = 0
  world.pruneStreak = 0
  world.konamiStep = 0
}


export function countAliveEnemies(world: World): number {
  return world.enemyLive
}
