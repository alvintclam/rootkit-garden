import { TICK_HZ } from '../src/sim/constants'
import { CmdBit } from '../src/sim/inputCmd'
import { Difficulty, difficultyName, parseDifficulty, type DifficultyId } from '../src/sim/difficulty'
import { createRng, nextFloat, nextInt } from '../src/sim/rng'
import { simTick } from '../src/sim/sim.hot'
import { Phase } from '../src/sim/state'
import { createWorld, resetRun } from '../src/sim/world'

type Args = {
  seconds: number
  runs: number
  seed: number
  difficulty: DifficultyId
}

function parseArgs(argv: string[]): Args {
  let seconds = 60
  let runs = 5
  let seed = 42
  let difficulty: DifficultyId = Difficulty.Normal
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--seconds' && argv[i + 1]) seconds = Number(argv[++i])
    else if (a === '--runs' && argv[i + 1]) runs = Number(argv[++i])
    else if (a === '--seed' && argv[i + 1]) seed = Number(argv[++i]) >>> 0
    else if (a === '--difficulty' && argv[i + 1]) difficulty = parseDifficulty(argv[++i])
  }
  return { seconds, runs, seed: seed || 1, difficulty }
}

function policyBits(tick: number, rng: { s: number }, phase: number): number {
  if (phase === Phase.Menu || phase === Phase.Story) return CmdBit.Confirm
  if (phase === Phase.LevelUp) return CmdBit.Pick1
  if (phase === Phase.Result) return 0
  if (phase === Phase.Pause) return CmdBit.Pause
  let bits = 0
  const roll = nextFloat(rng)
  if (roll < 0.28) bits |= CmdBit.Left
  else if (roll < 0.56) bits |= CmdBit.Right
  else if (roll < 0.72) bits |= CmdBit.Up
  else if (roll < 0.88) bits |= CmdBit.Down
  if (tick % 45 === 0) bits |= CmdBit.Plant
  if (tick % 180 === 0) bits |= CmdBit.Prune
  if (tick % 90 === 0) bits |= CmdBit.Dash
  if (nextInt(rng, 0, 200) === 0) bits |= CmdBit.Cycle
  return bits
}

function runOne(seed: number, difficulty: DifficultyId, maxTicks: number) {
  const world = createWorld(seed, difficulty)
  world.storyDone = true
  resetRun(world, seed)
  const rng = createRng(seed ^ 0xbadc0de)
  while (world.phase !== Phase.Result && world.tick < maxTicks) {
    if (world.phase === Phase.Menu || world.phase === Phase.Story) {
      simTick(world, CmdBit.Confirm)
      continue
    }
    const bits = policyBits(world.tick, rng, world.phase)
    simTick(world, bits)
  }
  return {
    seed,
    cleared: world.survived,
    alive: world.playerHp > 0,
    tick: world.tick,
    seconds: +(world.tick / TICK_HZ).toFixed(2),
    kills: world.killCount,
    level: world.level,
    hp: +world.playerHp.toFixed(1),
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const maxTicks = Math.floor(args.seconds * TICK_HZ)
  const rows = []
  for (let i = 0; i < args.runs; i++) {
    const seed = (args.seed + i * 9973) >>> 0 || 1
    rows.push(runOne(seed, args.difficulty, maxTicks))
  }
  const alive = rows.filter((r) => r.alive).length
  const cleared = rows.filter((r) => r.cleared).length
  const avgSec = rows.reduce((a, r) => a + r.seconds, 0) / rows.length
  const avgKills = rows.reduce((a, r) => a + r.kills, 0) / rows.length
  console.log(
    JSON.stringify(
      {
        difficulty: difficultyName(args.difficulty),
        secondsCap: args.seconds,
        runs: args.runs,
        aliveRate: alive / rows.length,
        clearRate: cleared / rows.length,
        avgSeconds: +avgSec.toFixed(2),
        avgKills: +avgKills.toFixed(2),
        runsDetail: rows,
      },
      null,
      2,
    ),
  )
}

main()
