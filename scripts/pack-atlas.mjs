import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '../src/render/atlas.gen.ts')

const PALETTE = [
  '#00000000',
  '#7CFFB2',
  '#102218',
  '#3dff9a',
  '#e8ffe8',
  '#2a5a34',
  '#5dff8a',
  '#9bff3a',
  '#ff6ad5',
  '#6ecbff',
  '#ffd166',
  '#ff6b6b',
  '#ffffff',
  '#031018',
  '#d7ffe0',
  '#103010',
  '#66e0ff',
  '#ffb347',
  '#c44dff',
  '#2a1040',
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

const sprites = {
  player: (() => {
    const g = solid(12, 16, 0)
    for (let y = 0; y < 16; y++) for (let x = 2; x < 10; x++) g[y][x] = 1
    g[4][3] = 2
    g[4][7] = 2
    for (let x = 0; x < 12; x++) g[14][x] = 3
    return g
  })(),
  playerDash: (() => {
    const g = solid(12, 16, 0)
    for (let y = 0; y < 16; y++) for (let x = 2; x < 10; x++) g[y][x] = 4
    g[4][3] = 2
    g[4][7] = 2
    for (let x = 0; x < 12; x++) g[14][x] = 3
    return g
  })(),
  flower0: (() => {
    const g = solid(16, 18, 0)
    for (let y = 8; y < 18; y++) {
      g[y][7] = 5
      g[y][8] = 5
    }
    for (let y = 0; y < 10; y++) for (let x = 2; x < 14; x++) {
      const dx = x - 8
      const dy = y - 4
      if (dx * dx + dy * dy <= 20) g[y][x] = 6
    }
    g[3][7] = 15
    g[3][8] = 15
    g[4][7] = 15
    g[4][8] = 15
    return g
  })(),
  flower1: (() => {
    const g = solid(16, 18, 0)
    for (let y = 8; y < 18; y++) {
      g[y][7] = 5
      g[y][8] = 5
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      const cx = 8 + Math.round(Math.cos(a) * 5)
      const cy = 4 + Math.round(Math.sin(a) * 5)
      for (let yy = cy; yy < cy + 3; yy++) for (let xx = cx; xx < cx + 3; xx++) {
        if (yy >= 0 && yy < 18 && xx >= 0 && xx < 16) g[yy][xx] = 7
      }
    }
    return g
  })(),
  flower2: (() => {
    const g = solid(16, 18, 0)
    for (let y = 8; y < 18; y++) {
      g[y][7] = 5
      g[y][8] = 5
    }
    for (let y = 0; y < 8; y++) for (let x = 1; x < 15; x++) g[y][x] = 8
    for (let y = 2; y < 6; y++) for (let x = 5; x < 11; x++) g[y][x] = 12
    return g
  })(),
  enemy0: (() => {
    const g = solid(16, 16, 0)
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const dx = x - 7.5
      const dy = y - 7.5
      if (dx * dx + dy * dy <= 36) g[y][x] = 9
    }
    for (let x = 5; x < 11; x++) g[7][x] = 13
    return g
  })(),
  enemy1: (() => {
    const g = solid(16, 16, 0)
    for (let y = 0; y < 16; y++) {
      const half = Math.floor((y / 15) * 8)
      for (let x = 8 - half; x <= 8 + half; x++) if (x >= 0 && x < 16) g[y][x] = 10
    }
    return g
  })(),
  enemy2: (() => {
    const g = solid(20, 20, 0)
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) g[y][x] = 11
    for (let y = 2; y < 18; y++) for (let x = 2; x < 18; x++) {
      if (y === 2 || y === 17 || x === 2 || x === 17) g[y][x] = 12
    }
    return g
  })(),
  flower3: (() => {
    const g = solid(16, 18, 0)
    for (let y = 8; y < 18; y++) {
      g[y][7] = 5
      g[y][8] = 5
    }
    for (let y = 0; y < 12; y++) for (let x = 0; x < 16; x++) {
      const dx = x - 8
      const dy = y - 5
      if (dx * dx + dy * dy <= 28 && dx * dx + dy * dy >= 10) g[y][x] = 16
    }
    g[5][7] = 12
    g[5][8] = 12
    return g
  })(),
  flower4: (() => {
    const g = solid(16, 18, 0)
    for (let y = 8; y < 18; y++) {
      g[y][7] = 5
      g[y][8] = 5
    }
    for (let i = -1; i <= 1; i++) {
      for (let y = 1; y < 7; y++) for (let x = 6 + i * 4; x < 10 + i * 4; x++) {
        if (x >= 0 && x < 16) g[y][x] = 17
      }
    }
    return g
  })(),
  enemy3: (() => {
    const g = solid(28, 28, 0)
    for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++) {
      const dx = x - 13.5
      const dy = y - 13.5
      if (dx * dx + dy * dy <= 140) g[y][x] = 18
    }
    for (let y = 4; y < 24; y++) for (let x = 4; x < 24; x++) {
      if (y === 4 || y === 23 || x === 4 || x === 23) g[y][x] = 12
    }
    for (let y = 10; y < 14; y++) for (let x = 8; x < 20; x++) g[y][x] = 19
    return g
  })(),
  projectile: (() => {
    const g = solid(4, 4, 14)
    return g
  })(),
}

const order = Object.keys(sprites)
const pad = 1
let cursorX = 0
let cursorY = 0
let rowH = 0
const sheetW = 96
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
