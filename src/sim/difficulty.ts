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
    spawnIntervalMul: 1.5,
    batchMul: 0.65,
    contactDmgMul: 0.7,
    initialSpawnDelay: 120,
    speedMul: 0.9,
  },
  {
    id: Difficulty.Normal,
    spawnIntervalMul: 1,
    batchMul: 1,
    contactDmgMul: 1,
    initialSpawnDelay: 90,
    speedMul: 1,
  },
  {
    id: Difficulty.Hard,
    spawnIntervalMul: 0.5,
    batchMul: 1.7,
    contactDmgMul: 1.65,
    initialSpawnDelay: 36,
    speedMul: 1.32,
  },
  {
    id: Difficulty.Nightmare,
    spawnIntervalMul: 0.38,
    batchMul: 2.1,
    contactDmgMul: 2.0,
    initialSpawnDelay: 24,
    speedMul: 1.45,
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
