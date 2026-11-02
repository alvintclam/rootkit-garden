export const Difficulty = {
  Easy: 0,
  Normal: 1,
  Hard: 2,
  Nightmare: 3,
} as const

export type DifficultyId = (typeof Difficulty)[keyof typeof Difficulty]

export type DifficultyDef = {
  id: DifficultyId
  spawnIntervalMul: number
  batchMul: number
  contactDmgMul: number
  initialSpawnDelay: number
  speedMul: number
}

export const DIFFICULTY_DEFS: readonly DifficultyDef[] = [
  {
    id: Difficulty.Easy,
    spawnIntervalMul: 1.45,
    batchMul: 0.7,
    contactDmgMul: 0.7,
    initialSpawnDelay: 90,
    speedMul: 0.9,
  },
  {
    id: Difficulty.Normal,
    spawnIntervalMul: 0.92,
    batchMul: 1.05,
    contactDmgMul: 1,
    initialSpawnDelay: 55,
    speedMul: 1.02,
  },
  {
    id: Difficulty.Hard,
    spawnIntervalMul: 0.48,
    batchMul: 1.75,
    contactDmgMul: 1.65,
    initialSpawnDelay: 30,
    speedMul: 1.34,
  },
  {
    id: Difficulty.Nightmare,
    spawnIntervalMul: 0.36,
    batchMul: 2.15,
    contactDmgMul: 2.05,
    initialSpawnDelay: 18,
    speedMul: 1.48,
  },
]

export function difficultyDef(id: DifficultyId): DifficultyDef {
  return DIFFICULTY_DEFS[id] ?? DIFFICULTY_DEFS[Difficulty.Normal]
}

export function cycleDifficulty(id: DifficultyId): DifficultyId {
  return ((id + 1) % DIFFICULTY_DEFS.length) as DifficultyId
}

export function difficultyName(id: DifficultyId): string {
  if (id === Difficulty.Easy) return 'easy'
  if (id === Difficulty.Hard) return 'hard'
  if (id === Difficulty.Nightmare) return 'nightmare'
  return 'normal'
}

export function parseDifficulty(v: string): DifficultyId {
  const s = v.toLowerCase()
  if (s === 'easy') return Difficulty.Easy
  if (s === 'hard') return Difficulty.Hard
  if (s === 'nightmare' || s === 'nm') return Difficulty.Nightmare
  return Difficulty.Normal
}
