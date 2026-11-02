export const Phase = {
  Menu: 0,
  Story: 1,
  Run: 2,
  Pause: 3,
  LevelUp: 4,
  Result: 5,
} as const

export type PhaseId = (typeof Phase)[keyof typeof Phase]

export const PHASE_NAMES = ['Menu', 'Story', 'Run', 'Pause', 'LevelUp', 'Result'] as const

export type PhaseName = (typeof PHASE_NAMES)[number]

export const PHASE_EDGES: readonly (readonly [PhaseId, PhaseId])[] = [
  [Phase.Menu, Phase.Story],
  [Phase.Menu, Phase.Run],
  [Phase.Story, Phase.Run],
  [Phase.Story, Phase.Menu],
  [Phase.Run, Phase.Pause],
  [Phase.Run, Phase.LevelUp],
  [Phase.Run, Phase.Result],
  [Phase.Pause, Phase.Run],
  [Phase.Pause, Phase.Menu],
  [Phase.LevelUp, Phase.Run],
  [Phase.LevelUp, Phase.Result],
  [Phase.Result, Phase.Menu],
  [Phase.Result, Phase.Run],
  [Phase.Result, Phase.Story],
]

export const PHASE_EDGE_NAMES: readonly (readonly [PhaseName, PhaseName])[] = PHASE_EDGES.map(
  ([a, b]) => [PHASE_NAMES[a], PHASE_NAMES[b]] as const,
)

export function canEnter(from: PhaseId, to: PhaseId): boolean {
  if (from === to) return false
  for (let i = 0; i < PHASE_EDGES.length; i++) {
    if (PHASE_EDGES[i][0] === from && PHASE_EDGES[i][1] === to) return true
  }
  return false
}

export function tryEnter(from: PhaseId, to: PhaseId): PhaseId | null {
  return canEnter(from, to) ? to : null
}

export function mustEnter(from: PhaseId, to: PhaseId): PhaseId {
  const next = tryEnter(from, to)
  if (next === null) throw new Error('illegal_phase')
  return next
}
