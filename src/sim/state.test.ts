import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  Phase,
  PHASE_EDGE_NAMES,
  PHASE_EDGES,
  PHASE_NAMES,
  canEnter,
  tryEnter,
  mustEnter,
} from './state'

test('legal happy path Menu→Story→Run→Pause→Run→LevelUp→Run→Result', () => {
  assert.equal(canEnter(Phase.Menu, Phase.Story), true)
  assert.equal(canEnter(Phase.Story, Phase.Run), true)
  assert.equal(canEnter(Phase.Run, Phase.Pause), true)
  assert.equal(canEnter(Phase.Pause, Phase.Run), true)
  assert.equal(canEnter(Phase.Run, Phase.LevelUp), true)
  assert.equal(canEnter(Phase.LevelUp, Phase.Run), true)
  assert.equal(canEnter(Phase.Run, Phase.Result), true)
})

test('legal Menu→Run and Result restarts', () => {
  assert.equal(canEnter(Phase.Menu, Phase.Run), true)
  assert.equal(canEnter(Phase.Result, Phase.Run), true)
  assert.equal(canEnter(Phase.Result, Phase.Menu), true)
  assert.equal(canEnter(Phase.Result, Phase.Story), true)
  assert.equal(canEnter(Phase.Pause, Phase.Menu), true)
  assert.equal(canEnter(Phase.LevelUp, Phase.Result), true)
  assert.equal(canEnter(Phase.Story, Phase.Menu), true)
})

test('rejects illegal transitions', () => {
  assert.equal(canEnter(Phase.Menu, Phase.Pause), false)
  assert.equal(canEnter(Phase.Menu, Phase.LevelUp), false)
  assert.equal(canEnter(Phase.Menu, Phase.Result), false)
  assert.equal(canEnter(Phase.Story, Phase.LevelUp), false)
  assert.equal(canEnter(Phase.Pause, Phase.LevelUp), false)
  assert.equal(canEnter(Phase.Pause, Phase.Result), false)
  assert.equal(canEnter(Phase.LevelUp, Phase.Menu), false)
  assert.equal(canEnter(Phase.LevelUp, Phase.Pause), false)
  assert.equal(canEnter(Phase.Result, Phase.Pause), false)
  assert.equal(canEnter(Phase.Run, Phase.Story), false)
  assert.equal(canEnter(Phase.Run, Phase.Menu), false)
  assert.equal(canEnter(Phase.Run, Phase.Run), false)
})

test('tryEnter and mustEnter', () => {
  assert.equal(tryEnter(Phase.Menu, Phase.Story), Phase.Story)
  assert.equal(tryEnter(Phase.Menu, Phase.Pause), null)
  assert.equal(mustEnter(Phase.Run, Phase.Result), Phase.Result)
  assert.throws(() => mustEnter(Phase.Menu, Phase.Result))
})

test('PHASE_EDGE_NAMES matches canEnter matrix 1:1', () => {
  for (let from = 0; from < PHASE_NAMES.length; from++) {
    for (let to = 0; to < PHASE_NAMES.length; to++) {
      const named = PHASE_EDGE_NAMES.some(([a, b]) => a === PHASE_NAMES[from] && b === PHASE_NAMES[to])
      assert.equal(named, canEnter(from, to), `${PHASE_NAMES[from]}->${PHASE_NAMES[to]}`)
    }
  }
  assert.equal(PHASE_EDGES.length, PHASE_EDGE_NAMES.length)
})

test('TLA Edges set matches PHASE_EDGE_NAMES', () => {
  const tla = readFileSync(new URL('../../spec/garden_phases.tla', import.meta.url), 'utf8')
  const block = tla.slice(tla.indexOf('Edges =='), tla.indexOf('CanEnter'))
  for (const [a, b] of PHASE_EDGE_NAMES) {
    const token = `<<"${a}", "${b}">>`
    assert.ok(block.includes(token), `missing in TLA: ${token}`)
  }
  const tlaCount = (block.match(/<<"/g) || []).length
  assert.equal(tlaCount, PHASE_EDGE_NAMES.length)
})
