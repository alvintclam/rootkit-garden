import { FlowerKind, FLOWER_COUNT, type FlowerKindId } from './flowers'
import type { Rng } from './rng'
import { pickIndex } from './rng'

export const UpgradeId = {
  UnlockWormvine: 0,
  UnlockPayload: 1,
  FireRate: 2,
  Damage: 3,
  Range: 4,
  MaxFlowers: 5,
  DashCooldown: 6,
  PruneHeal: 7,
  MoveSpeed: 8,
  Hp: 9,
  UnlockSlowfield: 10,
  UnlockBuckshot: 11,
  SynergyAmp: 12,
  HeatSink: 13,
  ExploitWindow: 14,
  ColonyStrength: 15,
  CoolantDash: 16,
} as const

export type UpgradeIdValue = (typeof UpgradeId)[keyof typeof UpgradeId]

export const UPGRADE_IDS: readonly UpgradeIdValue[] = [
  UpgradeId.UnlockWormvine,
  UpgradeId.UnlockPayload,
  UpgradeId.UnlockSlowfield,
  UpgradeId.UnlockBuckshot,
  UpgradeId.FireRate,
  UpgradeId.Damage,
  UpgradeId.Range,
  UpgradeId.MaxFlowers,
  UpgradeId.DashCooldown,
  UpgradeId.PruneHeal,
  UpgradeId.MoveSpeed,
  UpgradeId.Hp,
  UpgradeId.SynergyAmp,
  UpgradeId.HeatSink,
  UpgradeId.ExploitWindow,
  UpgradeId.ColonyStrength,
  UpgradeId.CoolantDash,
]

export type PlayerUpgrades = {
  unlocked: boolean[]
  fireRateMul: number
  damageMul: number
  rangeMul: number
  maxFlowers: number
  dashCooldownMul: number
  pruneHeal: number
  moveMul: number
  maxHpBonus: number
  synergyAmp: number
  heatMul: number
  pruneDumpMul: number
  exploitWindowMul: number
  colonyMul: number
  dashVentMul: number
}

export function createUpgrades(): PlayerUpgrades {
  const unlocked = Array.from({ length: FLOWER_COUNT }, (_, i) => i === FlowerKind.Packet)
  return {
    unlocked,
    fireRateMul: 1,
    damageMul: 1,
    rangeMul: 1,
    maxFlowers: 6,
    dashCooldownMul: 1,
    pruneHeal: 0,
    moveMul: 1,
    maxHpBonus: 0,
    synergyAmp: 1,
    heatMul: 1,
    pruneDumpMul: 1,
    exploitWindowMul: 1,
    colonyMul: 1,
    dashVentMul: 1,
  }
}

export function applyUpgrade(u: PlayerUpgrades, id: UpgradeIdValue): void {
  if (id === UpgradeId.UnlockWormvine) u.unlocked[FlowerKind.Wormvine] = true
  else if (id === UpgradeId.UnlockPayload) u.unlocked[FlowerKind.Payload] = true
  else if (id === UpgradeId.UnlockSlowfield) u.unlocked[FlowerKind.Slowfield] = true
  else if (id === UpgradeId.UnlockBuckshot) u.unlocked[FlowerKind.Buckshot] = true
  else if (id === UpgradeId.FireRate) u.fireRateMul *= 1.2
  else if (id === UpgradeId.Damage) u.damageMul *= 1.25
  else if (id === UpgradeId.Range) u.rangeMul *= 1.15
  else if (id === UpgradeId.MaxFlowers) u.maxFlowers += 2
  else if (id === UpgradeId.DashCooldown) u.dashCooldownMul *= 0.75
  else if (id === UpgradeId.PruneHeal) u.pruneHeal += 8
  else if (id === UpgradeId.MoveSpeed) u.moveMul *= 1.12
  else if (id === UpgradeId.Hp) u.maxHpBonus += 25
  else if (id === UpgradeId.SynergyAmp) u.synergyAmp *= 1.35
  else if (id === UpgradeId.HeatSink) {
    u.heatMul *= 0.72
    u.pruneDumpMul *= 1.4
  } else if (id === UpgradeId.ExploitWindow) u.exploitWindowMul *= 1.45
  else if (id === UpgradeId.ColonyStrength) u.colonyMul *= 1.5
  else if (id === UpgradeId.CoolantDash) u.dashVentMul *= 1.6
}

export function rollUpgradeChoices(rng: Rng, u: PlayerUpgrades, out: number[]): void {
  const pool: number[] = []
  for (let i = 0; i < UPGRADE_IDS.length; i++) {
    const id = UPGRADE_IDS[i]
    if (id === UpgradeId.UnlockWormvine && u.unlocked[FlowerKind.Wormvine]) continue
    if (id === UpgradeId.UnlockPayload && u.unlocked[FlowerKind.Payload]) continue
    if (id === UpgradeId.UnlockSlowfield && u.unlocked[FlowerKind.Slowfield]) continue
    if (id === UpgradeId.UnlockBuckshot && u.unlocked[FlowerKind.Buckshot]) continue
    pool.push(id)
  }
  out[0] = -1
  out[1] = -1
  out[2] = -1
  let n = 0
  while (n < 3 && pool.length > 0) {
    const idx = pickIndex(rng, pool.length)
    out[n] = pool[idx]
    pool[idx] = pool[pool.length - 1]
    pool.pop()
    n++
  }
}

export function cyclePlantKind(u: PlayerUpgrades, current: FlowerKindId): FlowerKindId {
  const order: FlowerKindId[] = [
    FlowerKind.Packet,
    FlowerKind.Wormvine,
    FlowerKind.Payload,
    FlowerKind.Slowfield,
    FlowerKind.Buckshot,
  ]
  let i = order.indexOf(current)
  if (i < 0) i = 0
  for (let step = 0; step < order.length; step++) {
    i = (i + 1) % order.length
    if (u.unlocked[order[i]]) return order[i]
  }
  return FlowerKind.Packet
}
