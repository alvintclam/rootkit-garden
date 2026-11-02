import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '../src/render/atlas.gen.ts')

const PALETTE = [
  '#00000000', // 0
  '#7CFFB2', // 1 player
  '#0a1f14', // 2 dark
  '#3dff9a', // 3 accent
  '#e8ffe8', // 4 dash white
  '#1a3d28', // 5 stem
  '#5dff8a', // 6 packet green
  '#b8ff2a', // 7 wormvine lime
  '#ff4ec8', // 8 payload hot pink
  '#4eb8ff', // 9 scanner
  '#ffc94a', // 10 drone
  '#ff5a5a', // 11 heavy
  '#ffffff', // 12 white
  '#031018', // 13 void
  '#d7ffe0', // 14 soft
  '#0d2818', // 15 deep soil
  '#66e0ff', // 16 slow cyan
  '#ff9a3c', // 17 buckshot orange
  '#c44dff', // 18 boss purple
  '#2a1040', // 19 boss dark
  '#9bff3a', // 20 glyph lime
  '#ff6ad5', // 21 magenta
  '#203820', // 22 circuit
  '#86ffc8', // 23 soft mint
]

function solid(w, h, c) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => c))
}

function stamp(dst, src, ox, oy) {
  for (let y = 0; y < src.length; y++) {
    for (let x = 0; x < src[0].length; x++) {
      const v = src[y][x]
      if (v) dst[oy + y][ox + x] = v
    }
  }
}

function disk(g, cx, cy, r, c) {
  const rr = r * r
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[0].length; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= rr) g[y][x] = c
    }
}

function ring(g, cx, cy, r0, r1, c) {
  const a = r0 * r0
  const b = r1 * r1
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[0].length; x++) {
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy)
      if (d <= b && d >= a) g[y][x] = c
    }
}

const sprites = {
  player: (() => {
    const g = solid(14, 18, 0)
    // hooded gardener silhouette
    for (let y = 2; y < 14; y++) for (let x = 3; x < 11; x++) g[y][x] = 1
    disk(g, 7, 4, 4, 1)
    g[5][5] = 2
    g[5][9] = 2
    for (let x = 1; x < 13; x++) g[15][x] = 3
    g[16][4] = 3
    g[16][9] = 3
    // glyph badge
    g[9][7] = 21
    g[10][6] = 20
    g[10][8] = 20
    return g
  })(),
  playerDash: (() => {
    const g = solid(14, 18, 0)
    for (let y = 2; y < 14; y++) for (let x = 3; x < 11; x++) g[y][x] = 4
    disk(g, 7, 4, 4, 4)
    g[5][5] = 2
    g[5][9] = 2
    for (let x = 0; x < 14; x++) g[15][x] = 3
    g[9][7] = 21
    return g
  })(),
  // Packet: hexagonal packet bloom
  flower0: (() => {
    const g = solid(18, 20, 0)
    for (let y = 10; y < 20; y++) {
      g[y][8] = 5
      g[y][9] = 5
    }
    // hex head
    const hex = [
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    ]
    for (let y = 0; y < hex.length; y++)
      for (let x = 0; x < hex[0].length; x++) if (hex[y][x]) g[y + 1][x + 4] = 6
    g[4][8] = 12
    g[4][9] = 12
    g[5][7] = 20
    g[5][10] = 20
    return g
  })(),
  // Wormvine: zigzag vine tendrils
  flower1: (() => {
    const g = solid(18, 20, 0)
    for (let y = 10; y < 20; y++) {
      g[y][8] = 5
      g[y][9] = 5
    }
    // snake arms
    const path = [
      [8, 2], [7, 3], [6, 4], [5, 5], [4, 6], [5, 7], [6, 8],
      [9, 2], [10, 3], [11, 4], [12, 5], [13, 6], [12, 7], [11, 8],
      [8, 1], [9, 1], [8, 4], [9, 4], [8, 6], [9, 6],
    ]
    for (const [x, y] of path) {
      g[y][x] = 7
      if (x + 1 < 18) g[y][x + 1] = 7
    }
    g[3][8] = 12
    g[3][9] = 12
    return g
  })(),
  // Payload: diamond rocket
  flower2: (() => {
    const g = solid(18, 20, 0)
    for (let y = 11; y < 20; y++) {
      g[y][8] = 5
      g[y][9] = 5
    }
    for (let y = 0; y < 11; y++) {
      const half = Math.floor(((y < 6 ? y : 10 - y) / 5) * 7)
      for (let x = 9 - half; x <= 9 + half; x++) if (x >= 0 && x < 18) g[y][x] = 8
    }
    for (let y = 3; y < 7; y++) for (let x = 7; x < 11; x++) g[y][x] = 12
    g[1][9] = 21
    return g
  })(),
  // Slowfield: concentric rings
  flower3: (() => {
    const g = solid(18, 20, 0)
    for (let y = 11; y < 20; y++) {
      g[y][8] = 5
      g[y][9] = 5
    }
    ring(g, 9, 6, 2, 4, 16)
    ring(g, 9, 6, 5, 7, 16)
    disk(g, 9, 6, 2, 12)
    g[6][9] = 21
    return g
  })(),
  // Buckshot: three pellet buds
  flower4: (() => {
    const g = solid(18, 20, 0)
    for (let y = 11; y < 20; y++) {
      g[y][8] = 5
      g[y][9] = 5
    }
    disk(g, 4, 5, 3, 17)
    disk(g, 9, 3, 3, 17)
    disk(g, 14, 5, 3, 17)
    g[5][4] = 12
    g[3][9] = 12
    g[5][14] = 12
    return g
  })(),
  enemy0: (() => {
    const g = solid(16, 16, 0)
    disk(g, 7.5, 7.5, 6, 9)
    // scan eye
    for (let x = 4; x < 12; x++) g[7][x] = 13
    g[7][8] = 12
    g[5][8] = 16
    return g
  })(),
  enemy1: (() => {
    const g = solid(16, 16, 0)
    // chevron drone
    for (let y = 0; y < 16; y++) {
      const half = Math.floor((y / 15) * 7)
      for (let x = 8 - half; x <= 8 + half; x++) if (x >= 0 && x < 16) g[y][x] = 10
    }
    g[4][8] = 12
    g[10][8] = 2
    return g
  })(),
  enemy2: (() => {
    const g = solid(20, 20, 0)
    for (let y = 1; y < 19; y++) for (let x = 1; x < 19; x++) g[y][x] = 11
    for (let y = 3; y < 17; y++) for (let x = 3; x < 17; x++) {
      if (y === 3 || y === 16 || x === 3 || x === 16) g[y][x] = 12
    }
    // patch glyph
    g[9][9] = 13
    g[10][8] = 13
    g[10][10] = 13
    return g
  })(),
  enemy3: (() => {
    const g = solid(28, 28, 0)
    disk(g, 13.5, 13.5, 12, 18)
    for (let y = 5; y < 23; y++) for (let x = 5; x < 23; x++) {
      if (y === 5 || y === 22 || x === 5 || x === 22) g[y][x] = 12
    }
    for (let y = 11; y < 15; y++) for (let x = 9; x < 19; x++) g[y][x] = 19
    g[12][13] = 21
    g[13][14] = 20
    return g
  })(),
  projectile: (() => {
    const g = solid(5, 5, 0)
    disk(g, 2, 2, 2, 14)
    g[2][2] = 12
    return g
  })(),
  injectShot: (() => {
    const g = solid(7, 7, 0)
    disk(g, 3, 3, 3, 21)
    disk(g, 3, 3, 1, 12)
    return g
  })(),
  // Memorable title mark: rooted malware bloom
  titleMark: (() => {
    const g = solid(32, 32, 0)
    // roots
    for (let y = 18; y < 32; y++) {
      g[y][15] = 5
      g[y][16] = 5
    }
    for (let i = 0; i < 8; i++) {
      g[20 + i][15 - i] = 22
      g[20 + i][16 + i] = 22
    }
    // bloom hex
    disk(g, 16, 12, 10, 6)
    disk(g, 16, 12, 6, 3)
    disk(g, 16, 12, 3, 21)
    g[12][16] = 12
    // glyph petals
    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * Math.PI * 2
      const cx = 16 + Math.round(Math.cos(ang) * 8)
      const cy = 12 + Math.round(Math.sin(ang) * 8)
      disk(g, cx, cy, 2, 20)
    }
    return g
  })(),
}

const order = Object.keys(sprites)
const pad = 1
let cursorX = 0
let cursorY = 0
let rowH = 0
const sheetW = 128
const frames = []
const rows = []
let row = solid(sheetW, 1, 0)

function ensureRowHeight(h) {
  while (row.length < h) row.push(Array.from({ length: sheetW }, () => 0))
}

for (const name of order) {
  const spr = sprites[name]
  const w = spr[0].length
  const h = spr.length
  if (cursorX + w + pad > sheetW) {
    rows.push(...row)
    row = solid(sheetW, 1, 0)
    cursorX = 0
    cursorY = rows.length
    rowH = 0
  }
  ensureRowHeight(Math.max(rowH, h))
  stamp(row, spr, cursorX, 0)
  frames.push({ id: frames.length, name, x: cursorX, y: cursorY, w, h })
  cursorX += w + pad
  rowH = Math.max(rowH, h)
}
rows.push(...row)
const sheetH = rows.length
const pixels = rows.flat()

const src = `export const ATLAS_PALETTE = ${JSON.stringify(PALETTE)} as const

export type AtlasFrame = {
  id: number
  name: string
  x: number
  y: number
  w: number
  h: number
}

export const ATLAS_W = ${sheetW}
export const ATLAS_H = ${sheetH}

export const ATLAS_FRAMES: readonly AtlasFrame[] = ${JSON.stringify(frames, null, 2)}

export const ATLAS_INDEX: Record<string, number> = {
${frames.map((f) => `  ${JSON.stringify(f.name)}: ${f.id},`).join('\n')}
}

export const ATLAS_PIXELS: readonly number[] = ${JSON.stringify(pixels)}
`

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, src)
console.log(`packed ${frames.length} frames -> ${outPath} (${sheetW}x${sheetH})`)
