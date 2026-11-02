export const SimEvent = {
  Plant: 1 << 0,
  Prune: 1 << 1,
  Dash: 1 << 2,
  Kill: 1 << 3,
  LevelUp: 1 << 4,
  Die: 1 << 5,
  Win: 1 << 6,
  StoryAdvance: 1 << 7,
} as const
