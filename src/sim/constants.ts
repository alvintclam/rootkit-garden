export const W = 540
export const H = 960
export const TICK_HZ = 60
export const DT = 1 / TICK_HZ
export const MAX_FLOWERS = 32
export const MAX_ENEMIES = 512
export const MAX_PROJECTILES = 512
export const MAX_PARTICLES = 384
export const MAX_PATCHES = 8
export const PLAYER_RADIUS = 12
export const FLOWER_RADIUS = 14
export const PLANT_GRID = 28
export const GRID_COLS = 20
export const GRID_ROWS = 35
export const GRID_CELLS = GRID_COLS * GRID_ROWS
export const BASE_HP = 100
export const BASE_SPEED = 2.4
export const DASH_SPEED = 7.2
export const DASH_FRAMES = 10
export const DASH_COOLDOWN = 55
export const SURVIVE_TICKS = TICK_HZ * 180
export const XP_BASE = 12
export const XP_GROWTH = 1.35
export const PERF_TICK_BUDGET_MS = 16.67
export const EGG_SEED = 1337
export const EGG_PRUNE_STREAK = 7

/** Heat / overclock */
export const FLOWER_MAX_HP = 14
export const HEAT_PER_FIRE = 7
export const HEAT_NEIGHBOR = 2.5
export const HEAT_MAX = 100
export const HEAT_MISS = 62
export const HEAT_SILENCE = 82
export const HEAT_DECAY = 0.18
export const HEAT_PRUNE_DUMP = 38
export const HEAT_DASH_VENT = 22
export const HEAT_SINK_MUL = 0.72

/** Exploit combo */
export const EXPLOIT_CAP = 5
export const EXPLOIT_WINDOW = 96
export const EXPLOIT_EMPOWER = 180

/** Enemy agency */
export const SCAN_CD = 110
export const SCAN_RANGE = 170
export const SCAN_HALF_ANGLE = 0.55
export const SCAN_MARK = 70
export const SCAN_SILENCE = 36
export const PATCH_LIFE = 160
export const PATCH_RADIUS = 40
export const COLONY_DOT = 0.35
export const COLONY_XP_EVERY = 100
export const BOSS_PURGE_CD = 240

/** Flower flag bits */
export const FF_CHAIN = 1
export const FF_SWARM = 2
export const FF_SLOWBUFF = 4
export const FF_SHELLSPIKE = 8
export const FF_COLONY = 16
export const FF_EMPOWER = 32

/** Projectile flag bits */
export const PF_SPIKE = 1
export const PF_SPIKE_USED = 2
