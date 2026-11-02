import assert from 'node:assert/strict'
import test from 'node:test'
import { CmdBit } from './inputCmd'
import { Difficulty } from './difficulty'
import { createWorld, resetRun } from './world'
import { simTick } from './sim.hot'
import { SimEvent } from './events'
import { WaveBeat } from './constants'

test('Inject fires aimed volley and sets event', () => {
  const w = createWorld(11, Difficulty.Easy)
  w.storyDone = true
  resetRun(w, 11)
  w.aimX = 1
  w.aimY = 0
  w.exploitStacks = 2
  simTick(w, CmdBit.Inject)
  assert.ok(w.events & SimEvent.Inject)
  assert.equal(w.exploitStacks, 1)
  assert.ok(w.projLive >= 5)
  assert.ok(w.hitstop >= 4)
})

test('wave beat advances into layout window', () => {
  const w = createWorld(22, Difficulty.Easy)
  w.storyDone = true
  resetRun(w, 22)
  // Jump near layout pct (~0.52 of WAVE_BEAT_LEN)
  w.tick = Math.floor(60 * 18 * 0.53)
  for (let i = 0; i < 5; i++) simTick(w, 0)
  assert.ok(w.waveBeat === WaveBeat.Layout || w.layoutLeft > 0 || w.waveBeat === WaveBeat.Escalate || w.waveBeat === WaveBeat.Surge)
})
