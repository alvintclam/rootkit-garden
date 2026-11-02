import { hrtime } from 'node:process'
import { PERF_TICK_BUDGET_MS, TICK_HZ } from '../src/sim/constants'
import { CmdBit } from '../src/sim/inputCmd'
import { Difficulty } from '../src/sim/difficulty'
import { stressFillEnemies } from '../src/sim/pools'
import { simTick } from '../src/sim/sim.hot'
import { createWorld, resetRun } from '../src/sim/world'
import { MAX_FLOWERS } from '../src/sim/constants'

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[idx]
}

function parseArgs(argv: string[]) {
  let enemies = 400
  let seconds = 3
  let flowers = 12
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--enemies' && argv[i + 1]) enemies = Number(argv[++i])
    else if (argv[i] === '--seconds' && argv[i + 1]) seconds = Number(argv[++i])
    else if (argv[i] === '--flowers' && argv[i + 1]) flowers = Number(argv[++i])
  }
  return { enemies, seconds, flowers }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const world = createWorld(1, Difficulty.Hard)
  world.storyDone = true
  resetRun(world, 1)
  world.upgrades.maxFlowers = Math.min(MAX_FLOWERS, Math.max(args.flowers, 6))
  for (let i = 0; i < args.flowers; i++) {
    world.playerX = 200 + (i % 6) * 56
    world.playerY = 160 + Math.floor(i / 6) * 56
    simTick(world, CmdBit.Plant)
  }
  stressFillEnemies(world, args.enemies)
  const ticks = Math.floor(args.seconds * TICK_HZ)
  const samples: number[] = []
  for (let i = 0; i < ticks; i++) {
    const t0 = hrtime.bigint()
    simTick(world, CmdBit.Right | (i % 20 === 0 ? CmdBit.Plant : 0))
    const t1 = hrtime.bigint()
    samples.push(Number(t1 - t0) / 1e6)
  }
  samples.sort((a, b) => a - b)
  const sum = samples.reduce((a, b) => a + b, 0)
  const report = {
    enemiesTarget: args.enemies,
    enemiesLive: world.enemyLive,
    flowers: args.flowers,
    ticks,
    seconds: args.seconds,
    msPerTick: {
      avg: +(sum / samples.length).toFixed(4),
      p50: +percentile(samples, 50).toFixed(4),
      p95: +percentile(samples, 95).toFixed(4),
      p99: +percentile(samples, 99).toFixed(4),
      max: +samples[samples.length - 1].toFixed(4),
    },
    budgetMs60fps: PERF_TICK_BUDGET_MS,
    passP95UnderBudget: percentile(samples, 95) < PERF_TICK_BUDGET_MS,
    note: 'sim-only Node stress; full frame also includes render/audio. Target: p95 << 16.67ms.',
  }
  console.log(JSON.stringify(report, null, 2))
  if (!report.passP95UnderBudget) process.exitCode = 1
}

main()
