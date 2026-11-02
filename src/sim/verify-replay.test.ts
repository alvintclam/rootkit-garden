import assert from 'node:assert/strict'
import test from 'node:test'
import { writeFileSync, mkdirSync } from 'node:fs'
import { CmdBit } from './inputCmd'
import { Difficulty } from './difficulty'
import { Phase } from './state'
import { createRng, nextFloat } from './rng'
import { recordRun, verifyReplay } from './replayVerify'

test('record then verifyReplay matches claimedStats', () => {
  const rng = createRng(99)
  const log = recordRun(
    4242,
    Difficulty.Normal,
    (tick, phase) => {
      if (phase === Phase.LevelUp) return CmdBit.Pick1
      if (phase === Phase.Pause) return CmdBit.Pause
      let bits = CmdBit.Right
      if (tick % 30 === 0) bits |= CmdBit.Plant
      if (tick % 70 === 0) bits |= CmdBit.Dash
      if (nextFloat(rng) > 0.7) bits |= CmdBit.Up
      return bits
    },
    240,
  )
  const result = verifyReplay(log)
  assert.equal(result.ok, true, result.mismatches.join('; '))
  mkdirSync('/workspace/rootkit-garden/fixtures', { recursive: true })
  writeFileSync(
    '/workspace/rootkit-garden/fixtures/sample-replay.json',
    JSON.stringify(log),
  )
})

test('tampered claimedStats fails verify', () => {
  const log = recordRun(7, Difficulty.Easy, (tick, phase) => {
    if (phase === Phase.LevelUp) return CmdBit.Pick1
    return CmdBit.Left | (tick % 40 === 0 ? CmdBit.Plant : 0)
  }, 120)
  log.claimedStats.kills += 99
  const result = verifyReplay(log)
  assert.equal(result.ok, false)
})
