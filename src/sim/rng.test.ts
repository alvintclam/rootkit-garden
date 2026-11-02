import assert from 'node:assert/strict'
import test from 'node:test'
import { createRng, nextU32, nextFloat } from './rng'

test('seeded rng is deterministic', () => {
  const a = createRng(42)
  const b = createRng(42)
  for (let i = 0; i < 32; i++) {
    assert.equal(nextU32(a), nextU32(b))
  }
})

test('different seeds diverge', () => {
  const a = createRng(1)
  const b = createRng(2)
  assert.notEqual(nextFloat(a), nextFloat(b))
})
