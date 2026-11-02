import { FLOWER_DEFS } from '../sim/flowers'
import { BOSS_PULSE_RANGE, BOSS_TELE_TICKS, ENEMY_DEFS } from '../sim/enemies'
import { H, MAX_ENEMIES, MAX_FLOWERS, MAX_PARTICLES, MAX_PROJECTILES, SURVIVE_TICKS, W } from '../sim/constants'
import { Phase } from '../sim/state'
import type { World } from '../sim/world'
import { ResultKey } from '../sim/world'
import { Difficulty } from '../sim/difficulty'
import { drawEnemy, drawFlower, drawPlayer, drawProjectile } from './sprites'
import { biomeLabel, flowerName, getLocale, t, upgradeBlurb, upgradeTitle } from '../i18n/strings'

function pressureTier(world: World): number {
  if (world.bossTeleLeft > 0 || (world.bossSpawned && world.bossSlot >= 0)) return 3
  if (world.enemyLive >= 28 || world.wave >= 5) return 2
  if (world.enemyLive >= 12 || world.wave >= 2) return 1
  return 0
}

function fillBg(ctx: CanvasRenderingContext2D, world: World): void {
  const tier = pressureTier(world)
  const bg = tier === 3 ? '#140818' : tier === 2 ? '#100818' : tier === 1 ? '#0a1420' : '#071018'
  const grid = tier === 3 ? '#3a1840' : tier === 2 ? '#2a1830' : tier === 1 ? '#1a2838' : '#13281c'
  const bed = tier === 3 ? '#a44dff' : tier === 2 ? '#6b3a1f' : '#1f6b3a'
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = grid
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 28) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y < H; y += 28) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }
  ctx.strokeStyle = bed
  ctx.strokeRect(W * 0.5 - 60, H * 0.5 - 40, 120, 80)
  if (world.eggFlags & 1) {
    ctx.strokeStyle = '#7CFFB2'
    ctx.strokeRect(W * 0.5 - 62, H * 0.5 - 42, 124, 84)
  }
}

function countFlowers(world: World): number {
  let n = 0
  for (let i = 0; i < MAX_FLOWERS; i++) if (world.flowerAlive[i]) n++
  return n
}

function diffLabel(world: World): string {
  if (world.difficulty === Difficulty.Easy) return t('diff.easy')
  if (world.difficulty === Difficulty.Hard) return t('diff.hard')
  if (world.difficulty === Difficulty.Nightmare) return t('diff.nightmare')
  return t('diff.normal')
}

function hud(ctx: CanvasRenderingContext2D, world: World): void {
  const remain = Math.max(0, SURVIVE_TICKS - world.tick)
  const sec = Math.ceil(remain / 60)
  const tier = pressureTier(world)
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(8, 8, 300, 88)
  ctx.fillStyle = '#c8facc'
  ctx.font = '14px ui-monospace, monospace'
  ctx.fillText(`HP ${Math.ceil(world.playerHp)}/${world.playerMaxHp}`, 16, 28)
  ctx.fillText(`LV ${world.level}  XP ${world.xp}/${world.xpToNext}`, 16, 46)
  ctx.fillText(`Wave ${world.wave}  t-${sec}s  seed ${world.seed}`, 16, 64)
  ctx.fillStyle = tier >= 2 ? '#ffb347' : '#9ad5a8'
  ctx.fillText(biomeLabel(tier), 16, 82)
  const def = FLOWER_DEFS[world.plantKind]
  ctx.fillStyle = def.color
  ctx.fillText(
    `${flowerName(world.plantKind)} [R]  ${countFlowers(world)}/${world.upgrades.maxFlowers}`,
    320,
    28,
  )
  ctx.fillStyle = '#9ad5a8'
  ctx.fillText(t('hud.controls'), 320, 46)
  ctx.fillText(`${t('menu.diff')}: ${diffLabel(world)}`, 320, 64)
  if (world.eggFlags & 2) {
    ctx.fillStyle = '#ff6ad5'
    ctx.fillText(t('egg.konami'), 320, 82)
  }
}

function overlay(ctx: CanvasRenderingContext2D, title: string, lines: string[]): void {
  ctx.fillStyle = 'rgba(4,12,10,0.78)'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#7CFFB2'
  ctx.font = 'bold 36px ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.fillText(title, W / 2, H * 0.28)
  ctx.font = '16px ui-monospace, monospace'
  ctx.fillStyle = '#c8facc'
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], W / 2, H * 0.38 + i * 26)
  }
  ctx.textAlign = 'left'
}

function storyLine(world: World): string {
  if (world.storyStep === 0) return t('story.1')
  if (world.storyStep === 1) return t('story.2')
  return t('story.3')
}

function drawBossFx(ctx: CanvasRenderingContext2D, world: World): void {
  if (world.bossTeleLeft > 0) {
    const pulse = 0.35 + 0.25 * Math.sin(world.bossTeleLeft * 0.35)
    ctx.strokeStyle = `rgba(196,77,255,${pulse})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(W * 0.5, 40, 40 + (BOSS_TELE_VIS(world)), 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#c44dff'
    ctx.font = 'bold 18px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(biomeLabel(3), W * 0.5, 28)
    ctx.textAlign = 'left'
  }
  if (world.bossSlot >= 0 && world.enemyAlive[world.bossSlot] && world.bossPulseTele > 0) {
    const x = world.enemyX[world.bossSlot]
    const y = world.enemyY[world.bossSlot]
    ctx.strokeStyle = 'rgba(255,100,255,0.55)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, BOSS_PULSE_RANGE, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function BOSS_TELE_VIS(world: World): number {
  return (BOSS_TELE_TICKS - world.bossTeleLeft) * 0.4
}

export function renderFrame(ctx: CanvasRenderingContext2D, world: World, fps = 0, showFps = false): void {
  fillBg(ctx, world)
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    const def = FLOWER_DEFS[world.flowerKind[i]]
    drawFlower(ctx, world.flowerX[i], world.flowerY[i], def.color, world.flowerKind[i])
    if (world.flowerKind[i] === 3) {
      ctx.strokeStyle = 'rgba(102,224,255,0.25)'
      ctx.beginPath()
      ctx.arc(world.flowerX[i], world.flowerY[i], def.range * world.upgrades.rangeMul * 0.35, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    if (!world.projAlive[i]) continue
    drawProjectile(ctx, world.projX[i], world.projY[i])
  }
  for (let i = 0; i < MAX_PARTICLES; i++) {
    if (!world.partAlive[i]) continue
    ctx.fillStyle = '#9bff3a'
    ctx.fillRect(world.partX[i] - 1, world.partY[i] - 1, 2, 2)
  }
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (!world.enemyAlive[i]) continue
    const def = ENEMY_DEFS[world.enemyKind[i]]
    drawEnemy(ctx, world.enemyX[i], world.enemyY[i], def.color, world.enemyKind[i], def.radius)
  }
  drawBossFx(ctx, world)
  if (world.phase !== Phase.Menu && world.phase !== Phase.Story) {
    drawPlayer(ctx, world.playerX, world.playerY, world.dashLeft > 0)
  }
  if (world.phase === Phase.Run || world.phase === Phase.Pause || world.phase === Phase.LevelUp) {
    hud(ctx, world)
    if (showFps) {
      ctx.fillStyle = '#7CFFB2'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(`FPS ${fps.toFixed(0)}  enemies ${world.enemyLive}  proj ${world.projLive}`, W - 260, 24)
    }
  }
  if (world.phase === Phase.Menu) {
    const lines = [
      t('subtitle'),
      t('menu.tip'),
      '',
      t('menu.start'),
      t('menu.controls'),
      `${t('menu.lang')}: ${getLocale()}   ${t('menu.diff')}: ${diffLabel(world)}`,
    ]
    if (world.eggFlags & 1) lines.splice(2, 0, t('egg.seed'))
    overlay(ctx, t('title'), lines)
  } else if (world.phase === Phase.Story) {
    overlay(ctx, t('title'), [storyLine(world), '', t('story.next'), t('story.skip')])
  } else if (world.phase === Phase.Pause) {
    overlay(ctx, t('pause'), [t('pause.resume')])
  } else if (world.phase === Phase.LevelUp) {
    ctx.fillStyle = 'rgba(4,12,10,0.72)'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#7CFFB2'
    ctx.font = 'bold 28px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(t('levelup'), W / 2, 120)
    for (let i = 0; i < 3; i++) {
      const id = world.levelChoices[i]
      if (id < 0) continue
      const x = W / 2 - 320 + i * 220
      const y = 180
      ctx.fillStyle = '#102818'
      ctx.fillRect(x, y, 200, 160)
      ctx.strokeStyle = '#3dff9a'
      ctx.strokeRect(x, y, 200, 160)
      ctx.fillStyle = '#c8facc'
      ctx.font = 'bold 16px ui-monospace, monospace'
      ctx.fillText(`[${i + 1}] ${upgradeTitle(id)}`, x + 100, y + 48)
      ctx.font = '13px ui-monospace, monospace'
      ctx.fillStyle = '#9ad5a8'
      wrapText(ctx, upgradeBlurb(id), x + 100, y + 84, 170, 18)
    }
    ctx.textAlign = 'left'
  } else if (world.phase === Phase.Result) {
    const reason =
      world.resultKey === ResultKey.Survived ? t('result.survived') : t('result.wiped')
    overlay(ctx, world.survived ? t('result.win') : t('result.lose'), [
      reason,
      `seed ${world.seed}`,
      `time ${(world.tick / 60).toFixed(1)}s · kills ${world.killCount} · lv ${world.level}`,
      `${t('menu.diff')}: ${diffLabel(world)}`,
      '',
      t('result.share'),
      t('result.verify'),
      t('result.restart'),
    ])
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(' ')
  let line = ''
  let yy = y
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' '
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      ctx.fillText(line, x, yy)
      line = words[n] + ' '
      yy += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, yy)
}

