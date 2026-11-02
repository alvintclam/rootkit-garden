export const FlowerKind = {
  Packet: 0,
  Wormvine: 1,
  Payload: 2,
  Slowfield: 3,
  Buckshot: 4,
} as const

export type FlowerKindId = (typeof FlowerKind)[keyof typeof FlowerKind]

export const FlowerStyle = {
  Shot: 0,
  Aura: 1,
  Spread: 2,
} as const

export type FlowerDef = {
  kind: FlowerKindId
  name: string
  range: number
  cooldown: number
  damage: number
  projectileSpeed: number
  color: string
  cost: number
  style: number
}

export const FLOWER_DEFS: readonly FlowerDef[] = [
  {
    kind: FlowerKind.Packet,
    name: 'Packet Bloom',
    range: 140,
    cooldown: 28,
    damage: 8,
    projectileSpeed: 6.5,
    color: '#5dff8a',
    cost: 0,
    style: FlowerStyle.Shot,
  },
  {
    kind: FlowerKind.Wormvine,
    name: 'Wormvine',
    range: 110,
    cooldown: 18,
    damage: 5,
    projectileSpeed: 5.2,
    color: '#9bff3a',
    cost: 0,
    style: FlowerStyle.Shot,
  },
  {
    kind: FlowerKind.Payload,
    name: 'Payload Bloom',
    range: 180,
    cooldown: 42,
    damage: 16,
    projectileSpeed: 8,
    color: '#ff6ad5',
    cost: 0,
    style: FlowerStyle.Shot,
  },
  {
    kind: FlowerKind.Slowfield,
    name: 'Slowfield',
    range: 100,
    cooldown: 20,
    damage: 2,
    projectileSpeed: 0,
    color: '#66e0ff',
    cost: 0,
    style: FlowerStyle.Aura,
  },
  {
    kind: FlowerKind.Buckshot,
    name: 'Buckshot Bud',
    range: 120,
    cooldown: 34,
    damage: 5,
    projectileSpeed: 7.2,
    color: '#ffb347',
    cost: 0,
    style: FlowerStyle.Spread,
  },
]

export const FLOWER_COUNT = FLOWER_DEFS.length
