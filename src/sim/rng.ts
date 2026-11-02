export type Rng = { s: number }

export function createRng(seed: number): Rng {
  let s = seed >>> 0
  if (s === 0) s = 0x9e3779b9
  return { s }
}

export function nextU32(rng: Rng): number {
  let t = (rng.s += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return (t ^ (t >>> 14)) >>> 0
}

export function nextFloat(rng: Rng): number {
  return nextU32(rng) / 4294967296
}

export function nextRange(rng: Rng, min: number, max: number): number {
  return min + nextFloat(rng) * (max - min)
}

export function nextInt(rng: Rng, minInclusive: number, maxExclusive: number): number {
  const span = maxExclusive - minInclusive
  return minInclusive + (nextU32(rng) % span)
}

export function pickIndex(rng: Rng, len: number): number {
  return nextInt(rng, 0, len)
}
