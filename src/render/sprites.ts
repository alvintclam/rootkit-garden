import {
  ATLAS_FRAMES,
  ATLAS_INDEX,
  ATLAS_PALETTE,
  ATLAS_PIXELS,
  ATLAS_W,
} from './atlas.gen'

function drawFrame(ctx: CanvasRenderingContext2D, frameId: number, x: number, y: number, scale = 1): void {
  const frame = ATLAS_FRAMES[frameId]
  const ox = Math.round(x - (frame.w * scale) / 2)
  const oy = Math.round(y - (frame.h * scale) / 2)
  for (let py = 0; py < frame.h; py++) {
    for (let px = 0; px < frame.w; px++) {
      const idx = ATLAS_PIXELS[(frame.y + py) * ATLAS_W + (frame.x + px)]
      if (!idx) continue
      ctx.fillStyle = ATLAS_PALETTE[idx]
      if (scale === 1) ctx.fillRect(ox + px, oy + py, 1, 1)
      else ctx.fillRect(ox + px * scale, oy + py * scale, scale, scale)
    }
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, dashing: boolean): void {
  drawFrame(ctx, ATLAS_INDEX[dashing ? 'playerDash' : 'player'], x, y)
}

export function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _color: string,
  kind: number,
): void {
  const name =
    kind === 1
      ? 'flower1'
      : kind === 2
        ? 'flower2'
        : kind === 3
          ? 'flower3'
          : kind === 4
            ? 'flower4'
            : 'flower0'
  drawFrame(ctx, ATLAS_INDEX[name], x, y)
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _color: string,
  kind: number,
  _r: number,
): void {
  const name =
    kind === 1 ? 'enemy1' : kind === 2 ? 'enemy2' : kind === 3 ? 'enemy3' : 'enemy0'
  drawFrame(ctx, ATLAS_INDEX[name], x, y)
}

export function drawProjectile(ctx: CanvasRenderingContext2D, x: number, y: number, inject = false): void {
  drawFrame(ctx, ATLAS_INDEX[inject ? 'injectShot' : 'projectile'], x, y)
}

export function drawTitleMark(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 2): void {
  drawFrame(ctx, ATLAS_INDEX.titleMark, x, y, scale)
}
