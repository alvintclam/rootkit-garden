import { cmdAt, type InputCmd } from './inputCmd'
import { type DifficultyId } from './difficulty'
import { simTick } from './sim.hot'
import { Phase } from './state'
import { createWorld, resetRun, type World } from './world'

export type ClaimedStats = {
  tick: number
  kills: number
  level: number
  survived: boolean
  hp: number
}

export type ReplayLog = {
  seed: number
  difficulty: DifficultyId
  cmds?: InputCmd[]
  inputs?: number[]
  claimedStats: ClaimedStats
}

export type VerifyResult = {
  ok: boolean
  actual: ClaimedStats
  claimed: ClaimedStats
  mismatches: string[]
}

function snapshot(world: World): ClaimedStats {
  return {
    tick: world.tick,
    kills: world.killCount,
    level: world.level,
    survived: world.survived,
    hp: Math.round(world.playerHp * 1000) / 1000,
  }
}

export function replayLog(log: ReplayLog): World {
  const world = createWorld(log.seed, log.difficulty)
  world.storyDone = true
  resetRun(world, log.seed)
  if (log.inputs && log.inputs.length > 0) {
    for (let i = 0; i < log.inputs.length; i++) {
      if (world.phase === Phase.Result) break
      simTick(world, log.inputs[i])
    }
    return world
  }
  const cmds = log.cmds || []
  let guard = 0
  const maxGuard = Math.max(log.claimedStats.tick + 600, 3600)
  while (world.phase !== Phase.Result && world.tick < maxGuard && guard < maxGuard * 2) {
    const bits = cmdAt(cmds, world.tick)
    simTick(world, bits)
    guard++
    if (world.phase === Phase.LevelUp) {
      simTick(world, 1 << 10)
    }
  }
  return world
}

export function verifyReplay(log: ReplayLog): VerifyResult {
  const world = replayLog(log)
  const actual = snapshot(world)
  const claimed = {
    ...log.claimedStats,
    hp: Math.round(log.claimedStats.hp * 1000) / 1000,
  }
  const mismatches: string[] = []
  if (actual.tick !== claimed.tick) mismatches.push(`tick ${actual.tick}!=${claimed.tick}`)
  if (actual.kills !== claimed.kills) mismatches.push(`kills ${actual.kills}!=${claimed.kills}`)
  if (actual.level !== claimed.level) mismatches.push(`level ${actual.level}!=${claimed.level}`)
  if (actual.survived !== claimed.survived)
    mismatches.push(`survived ${actual.survived}!=${claimed.survived}`)
  if (actual.hp !== claimed.hp) mismatches.push(`hp ${actual.hp}!=${claimed.hp}`)
  return { ok: mismatches.length === 0, actual, claimed, mismatches }
}

export function recordRun(
  seed: number,
  difficulty: DifficultyId,
  policy: (tick: number, phase: number) => number,
  maxTicks: number,
): ReplayLog {
  const world = createWorld(seed, difficulty)
  world.storyDone = true
  resetRun(world, seed)
  const inputs: number[] = []
  while (world.phase !== Phase.Result && world.tick < maxTicks) {
    const bits = policy(world.tick, world.phase)
    inputs.push(bits)
    simTick(world, bits)
  }
  return {
    seed,
    difficulty,
    inputs,
    claimedStats: snapshot(world),
  }
}
