import assert from 'node:assert/strict'
import test from 'node:test'
import { CmdBit, cmdAt, pushCmd, createCmdLog } from './inputCmd'
import { Phase } from './state'
import { simTick } from './sim.hot'
import { createWorld, resetRun } from './world'
import { Difficulty } from './difficulty'

test('same seed + same cmds => same outcome', () => {
  const seed = 1337
  const log = createCmdLog()
  for (let t = 0; t < 180; t++) {
    let bits = CmdBit.Right
    if (t % 20 === 0) bits |= CmdBit.Plant
    pushCmd(log, t, bits)
  }
  const run = () => {
    const w = createWorld(seed, Difficulty.Normal)
    w.storyDone = true
    resetRun(w, seed)
    for (let t = 0; t < 180; t++) {
      simTick(w, cmdAt(log, t))
    }
    return {
      x: w.playerX,
      y: w.playerY,
      tick: w.tick,
      hp: w.playerHp,
      flowers: w.flowerAlive.reduce((a, b) => a + b, 0),
      rng: w.rng.s,
      phase: w.phase,
    }
  }
  assert.deepEqual(run(), run())
  assert.equal(run().phase, Phase.Run)
})
