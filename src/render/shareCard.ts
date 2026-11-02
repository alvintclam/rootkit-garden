import { difficultyName } from '../sim/difficulty'
import { MAX_FLOWERS } from '../sim/constants'
import type { World } from '../sim/world'
import { flowerName } from '../i18n/strings'

export type ShareStats = {
  seed: number
  seconds: number
  kills: number
  level: number
  survived: boolean
  difficulty: string
  flowers: string
}

export function collectShareStats(world: World): ShareStats {
  const counts = [0, 0, 0, 0, 0]
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    const k = world.flowerKind[i]
    if (k >= 0 && k < 5) counts[k]++
  }
  const parts: string[] = []
  for (let k = 0; k < 5; k++) {
    if (counts[k] > 0) parts.push(`${flowerName(k)}×${counts[k]}`)
  }
  return {
    seed: world.seed,
    seconds: Math.round((world.tick / 60) * 10) / 10,
    kills: world.killCount,
    level: world.level,
    survived: world.survived,
    difficulty: difficultyName(world.difficulty),
    flowers: parts.length ? parts.join(' · ') : 'empty bed',
  }
}

export function drawShareCard(stats: ShareStats): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 640
  c.height = 360
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#071018'
  ctx.fillRect(0, 0, 640, 360)
  ctx.strokeStyle = '#1f6b3a'
  ctx.lineWidth = 4
  ctx.strokeRect(12, 12, 616, 336)
  ctx.fillStyle = '#7CFFB2'
  ctx.font = 'bold 36px ui-monospace, monospace'
  ctx.fillText('Rootkit Garden', 36, 64)
  ctx.fillStyle = '#9ad5a8'
  ctx.font = '18px ui-monospace, monospace'
  ctx.fillText(stats.survived ? 'Garden Holds' : 'Scan Complete', 36, 100)
  ctx.fillStyle = '#c8facc'
  ctx.font = '20px ui-monospace, monospace'
  const lines = [
    `seed ${stats.seed}`,
    `${stats.seconds}s · kills ${stats.kills} · lv ${stats.level}`,
    `difficulty ${stats.difficulty}`,
    `loadout ${stats.flowers}`,
  ]
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], 36, 160 + i * 36)
  ctx.fillStyle = '#3dff9a'
  ctx.font = '14px ui-monospace, monospace'
  ctx.fillText('惡意程式花園 · share card', 36, 330)
  return c
}

export function shareCardDataUrl(stats: ShareStats): string {
  return drawShareCard(stats).toDataURL('image/png')
}

export async function downloadShareCard(stats: ShareStats): Promise<void> {
  const url = shareCardDataUrl(stats)
  const a = document.createElement('a')
  a.href = url
  a.download = `rootkit-garden-${stats.seed}.png`
  a.click()
  try {
    const blob = await (await fetch(url)).blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
  } catch {
    try {
      await navigator.clipboard.writeText(
        `Rootkit Garden | seed ${stats.seed} | ${stats.seconds}s | kills ${stats.kills} | ${stats.difficulty}`,
      )
    } catch {
      /* ignore */
    }
  }
}

export function applyOgMeta(stats: ShareStats): void {
  const title = `Rootkit Garden — seed ${stats.seed} · ${stats.seconds}s · ${stats.kills} kills`
  document.title = title
  let og = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null
  if (!og) {
    og = document.createElement('meta')
    og.setAttribute('property', 'og:title')
    document.head.appendChild(og)
  }
  og.content = title
  let desc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null
  if (!desc) {
    desc = document.createElement('meta')
    desc.setAttribute('property', 'og:description')
    document.head.appendChild(desc)
  }
  desc.content = `${stats.difficulty} · lv ${stats.level} · ${stats.flowers}`
}
