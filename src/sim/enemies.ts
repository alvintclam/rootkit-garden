export const EnemyKind = {
  Scanner: 0,
  Drone: 1,
  Heavyscan: 2,
  Boss: 3,
} as const

export type EnemyKindId = (typeof EnemyKind)[keyof typeof EnemyKind]

export type EnemyDef = {
  kind: EnemyKindId
  name: string
  hp: number
  speed: number
  radius: number
  xp: number
  color: string
}

export const ENEMY_DEFS: readonly EnemyDef[] = [
  {
    kind: EnemyKind.Scanner,
    name: 'Scanner',
    hp: 18,
    speed: 0.85,
    radius: 10,
    xp: 4,
    color: '#6ecbff',
  },
  {
    kind: EnemyKind.Drone,
    name: 'AV Drone',
    hp: 28,
    speed: 1.15,
    radius: 11,
    xp: 6,
    color: '#ffd166',
  },
  {
    kind: EnemyKind.Heavyscan,
    name: 'Heavyscan',
    hp: 70,
    speed: 0.55,
    radius: 16,
    xp: 14,
    color: '#ff6b6b',
  },
  {
    kind: EnemyKind.Boss,
    name: 'Rootkit Sentinel',
    hp: 520,
    speed: 0.42,
    radius: 26,
    xp: 80,
    color: '#c44dff',
  },
]

export const BOSS_SPAWN_TICK = 60 * 60
export const BOSS_TELE_TICKS = 90
export const BOSS_PULSE_RANGE = 170
export const BOSS_PULSE_DAMAGE = 14
export const BOSS_PULSE_CD = 120
export const BOSS_PULSE_TELE = 36
