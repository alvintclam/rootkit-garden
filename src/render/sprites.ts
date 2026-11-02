import {
  ATLAS_FRAMES,
  ATLAS_INDEX,
  ATLAS_PALETTE,
  ATLAS_PIXELS,
  ATLAS_W,
} from './atlas.gen'

function drawFrame(ctx: CanvasRenderingContext2D, frameId: number, x: number, y: number): void {
  const frame = ATLAS_FRAMES[frameId]
  const ox = Math.round(x - frame.w / 2)
  const oy = Math.round(y - frame.h / 2)
  for (let py = 0; py < frame.h; py++) {
    for (let px = 0; px < frame.w; px++) {
      const idx = ATLAS_PIXELS[(frame.y + py) * ATLAS_W + (frame.x + px)]
      if (!idx) continue
      ctx.fillStyle = ATLAS_PALETTE[idx]
      ctx.fillRect(ox + px, oy + py, 1, 1)
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

export function drawProjectile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  drawFrame(ctx, ATLAS_INDEX.projectile, x, y)
}
