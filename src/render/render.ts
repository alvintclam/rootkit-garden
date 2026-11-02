import { FLOWER_DEFS } from '../sim/flowers'
import { BOSS_PULSE_RANGE, BOSS_TELE_TICKS, ENEMY_DEFS } from '../sim/enemies'
import { H, MAX_ENEMIES, MAX_FLOWERS, MAX_PARTICLES, MAX_PROJECTILES, SURVIVE_TICKS, W } from '../sim/constants'
import { Phase } from '../sim/state'
import type { World } from '../sim/world'
import { ResultKey } from '../sim/world'
import { Difficulty } from '../sim/difficulty'
import { drawEnemy, drawFlower, drawPlayer, drawProjectile } from './sprites'
import { biomeLabel, flowerName, getLocale, t, upgradeBlurb, upgradeTitle } from '../i18n/strings'
import { isTouchUi, joyOrigin, touchBtnRect } from '../input/input'

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
  // taller central bed for portrait playable area
  ctx.strokeStyle = bed
  ctx.strokeRect(W * 0.5 - 70, H * 0.5 - 110, 140, 220)
  if (world.eggFlags & 1) {
    ctx.strokeStyle = '#7CFFB2'
    ctx.strokeRect(W * 0.5 - 72, H * 0.5 - 112, 144, 224)
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
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(8, 8, W - 16, 96)
  ctx.fillStyle = '#c8facc'
  ctx.font = '13px ui-monospace, monospace'
  ctx.fillText(`HP ${Math.ceil(world.playerHp)}/${world.playerMaxHp}`, 16, 28)
  ctx.fillText(`LV ${world.level}  XP ${world.xp}/${world.xpToNext}`, 16, 46)
  ctx.fillText(`Wave ${world.wave}  t-${sec}s`, 16, 64)
  ctx.fillStyle = tier >= 2 ? '#ffb347' : '#9ad5a8'
  ctx.fillText(biomeLabel(tier), 16, 82)
  const def = FLOWER_DEFS[world.plantKind]
  ctx.fillStyle = def.color
  ctx.textAlign = 'right'
  ctx.fillText(`${flowerName(world.plantKind)}  ${countFlowers(world)}/${world.upgrades.maxFlowers}`, W - 16, 28)
  ctx.fillStyle = '#9ad5a8'
  ctx.fillText(`seed ${world.seed}`, W - 16, 46)
  ctx.fillText(`${t('menu.diff')}: ${diffLabel(world)}`, W - 16, 64)
  if (world.eggFlags & 2) {
    ctx.fillStyle = '#ff6ad5'
    ctx.fillText(t('egg.konami'), W - 16, 82)
  }
  ctx.textAlign = 'left'
}

function overlay(ctx: CanvasRenderingContext2D, title: string, lines: string[]): void {
  ctx.fillStyle = 'rgba(4,12,10,0.78)'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#7CFFB2'
  ctx.font = 'bold 32px ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.fillText(title, W / 2, H * 0.18)
  ctx.font = '15px ui-monospace, monospace'
  ctx.fillStyle = '#c8facc'
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], W / 2, H * 0.26 + i * 28)
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
    ctx.arc(W * 0.5, 120, 40 + BOSS_TELE_VIS(world), 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#c44dff'
    ctx.font = 'bold 18px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(biomeLabel(3), W * 0.5, 108)
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

function drawRoundBtn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  fill: string,
): void {
  ctx.fillStyle = fill
  ctx.strokeStyle = '#3dff9a'
  ctx.lineWidth = 2
  ctx.beginPath()
  const r = 12
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#c8facc'
  ctx.font = 'bold 14px ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + w * 0.5, y + h * 0.5)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

function drawTouchChrome(ctx: CanvasRenderingContext2D, world: World): void {
  const showPads =
    world.phase === Phase.Run || world.phase === Phase.Pause || world.phase === Phase.LevelUp
  if (showPads) {
    const labels = [t('touch.plant'), t('touch.prune'), t('touch.dash'), t('touch.cycle')]
    const fills = [
      'rgba(16,48,32,0.55)',
      'rgba(48,32,16,0.55)',
      'rgba(16,32,48,0.55)',
      'rgba(32,16,48,0.55)',
    ]
    for (let i = 0; i < 4; i++) {
      const r = touchBtnRect(i as 0 | 1 | 2 | 3)
      drawRoundBtn(ctx, r.x, r.y, r.w, r.h, labels[i], fills[i])
    }
    const p = touchBtnRect(4)
    drawRoundBtn(ctx, p.x, p.y, p.w, p.h, t('touch.pause'), 'rgba(0,0,0,0.45)')
  }

  const joy = joyOrigin()
  if (joy.active) {
    ctx.strokeStyle = 'rgba(124,255,178,0.35)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(joy.x, joy.y, 56, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = 'rgba(124,255,178,0.55)'
    ctx.beginPath()
    ctx.arc(joy.x + joy.sx, joy.y + joy.sy, 18, 0, Math.PI * 2)
    ctx.fill()
  } else if (showPads && isTouchUi()) {
    ctx.fillStyle = 'rgba(124,255,178,0.12)'
    ctx.beginPath()
    ctx.arc(110, H - 140, 48, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(154,213,168,0.5)'
    ctx.font = '12px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(t('touch.move'), 110, H - 136)
    ctx.textAlign = 'left'
  }

  if (world.phase === Phase.Menu || world.phase === Phase.Story || world.phase === Phase.Result) {
    const c = touchBtnRect(5)
    drawRoundBtn(ctx, c.x, c.y, c.w, c.h, t('touch.confirm'), 'rgba(16,48,32,0.7)')
    const l = touchBtnRect(6)
    drawRoundBtn(ctx, l.x, l.y, l.w, l.h, t('touch.lang'), 'rgba(0,0,0,0.45)')
    const d = touchBtnRect(7)
    drawRoundBtn(ctx, d.x, d.y, d.w, d.h, t('touch.diff'), 'rgba(0,0,0,0.45)')
  }
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
      ctx.fillText(`FPS ${fps.toFixed(0)}  e ${world.enemyLive}  p ${world.projLive}`, 16, H - 12)
    }
  }
  if (world.phase === Phase.Menu) {
    const lines = [
      t('subtitle'),
      t('menu.tip'),
      '',
      t('menu.start'),
      t('menu.controls'),
      t('menu.touch'),
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
    ctx.font = 'bold 24px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(t('levelup'), W / 2, 140)
    for (let i = 0; i < 3; i++) {
      const id = world.levelChoices[i]
      if (id < 0) continue
      const r = touchBtnRect((8 + i) as 8 | 9 | 10)
      ctx.fillStyle = '#102818'
      ctx.fillRect(r.x, r.y, r.w, r.h)
      ctx.strokeStyle = '#3dff9a'
      ctx.strokeRect(r.x, r.y, r.w, r.h)
      ctx.fillStyle = '#c8facc'
      ctx.font = 'bold 16px ui-monospace, monospace'
      ctx.fillText(`[${i + 1}] ${upgradeTitle(id)}`, r.x + r.w * 0.5, r.y + 40)
      ctx.font = '13px ui-monospace, monospace'
      ctx.fillStyle = '#9ad5a8'
      wrapText(ctx, upgradeBlurb(id), r.x + r.w * 0.5, r.y + 72, r.w - 24, 18)
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
  drawTouchChrome(ctx, world)
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
