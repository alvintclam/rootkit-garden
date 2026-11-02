import { MAX_FLOWERS } from '../sim/constants'
import type { World } from '../sim/world'
import { diffName, flowerName, getLocale, t } from '../i18n/strings'

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
    difficulty: diffName(world.difficulty),
    flowers: parts.length ? parts.join(' · ') : t('share.empty'),
  }
}

/** Portrait share / OG card (9:16). */
export function drawShareCard(stats: ShareStats): HTMLCanvasElement {
  const c = document.createElement('canvas')
  const CW = 720
  const CH = 1280
  c.width = CW
  c.height = CH
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#071018'
  ctx.fillRect(0, 0, CW, CH)
  ctx.strokeStyle = '#1f6b3a'
  ctx.lineWidth = 6
  ctx.strokeRect(24, 24, CW - 48, CH - 48)
  const zh = getLocale() === 'zh-Hant'
  ctx.fillStyle = '#7CFFB2'
  ctx.font = 'bold 48px ui-monospace, monospace'
  ctx.fillText(zh ? t('title') : 'Rootkit Garden', 56, 120)
  ctx.fillStyle = '#9ad5a8'
  ctx.font = '24px ui-monospace, monospace'
  ctx.fillText(zh ? `Rootkit Garden · ${t('share.tag')}` : `惡意程式花園 · ${t('share.tag')}`, 56, 170)
  ctx.fillStyle = '#9ad5a8'
  ctx.font = '28px ui-monospace, monospace'
  ctx.fillText(stats.survived ? t('result.win') : t('result.lose'), 56, 260)
  ctx.fillStyle = '#c8facc'
  ctx.font = '28px ui-monospace, monospace'
  const lines = [
    `${t('hud.seed')} ${stats.seed}`,
    `${stats.seconds}s · ${t('hud.kills')} ${stats.kills} · lv ${stats.level}`,
    `${t('menu.diff')} ${stats.difficulty}`,
    t('share.loadout'),
    stats.flowers,
  ]
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], 56, 360 + i * 56)
  ctx.fillStyle = '#3dff9a'
  ctx.font = '22px ui-monospace, monospace'
  ctx.fillText(t('share.footer'), 56, CH - 80)
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
        `${t('title')} | ${t('hud.seed')} ${stats.seed} | ${stats.seconds}s | ${t('hud.kills')} ${stats.kills} | ${stats.difficulty}`,
      )
    } catch {
      /* ignore */
    }
  }
}

export function applyOgMeta(stats: ShareStats): void {
  const title = `${t('title')} — ${t('hud.seed')} ${stats.seed} · ${stats.seconds}s · ${stats.kills} ${t('hud.kills')}`
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
