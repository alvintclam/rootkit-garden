import { FLOWER_DEFS } from '../sim/flowers'
import { BOSS_PULSE_RANGE, BOSS_TELE_TICKS, ENEMY_DEFS, EnemyKind } from '../sim/enemies'
import {
  H,
  MAX_ENEMIES,
  MAX_FLOWERS,
  MAX_PARTICLES,
  MAX_PATCHES,
  MAX_PROJECTILES,
  PATCH_RADIUS,
  SURVIVE_TICKS,
  W,
  HEAT_MISS,
  HEAT_SILENCE,
  EXPLOIT_CAP,
  FF_COLONY,
  SCAN_RANGE,
  SCAN_HALF_ANGLE,
  MAX_FLOATS,
  MAX_TRAIL,
  PART_BLOOM,
  PART_DEATH,
  PART_DEBRIS,
  PART_SPARK,
  PART_VENT,
  CALL_TRIPLE,
  CALL_PENTA,
  CALL_LINK,
  CALL_EXPLOIT,
  CALL_INJECT,
  WaveBeat,
  PF_INJECT,
  INJECT_CD,
} from '../sim/constants'
import { Phase } from '../sim/state'
import type { World } from '../sim/world'
import { ResultKey } from '../sim/world'
import { Difficulty } from '../sim/difficulty'
import { drawEnemy, drawFlower, drawPlayer, drawProjectile, drawTitleMark } from './sprites'
import { biomeLabel, flowerName, getLocale, t, tf, upgradeBlurb, upgradeTitle } from '../i18n/strings'
import { isTouchUi, joyOrigin, touchBtnRect } from '../input/input'

function pressureTier(world: World): number {
  if (world.bossTeleLeft > 0 || (world.bossSpawned && world.bossSlot >= 0)) return 3
  if (world.enemyLive >= 28 || world.wave >= 5) return 2
  if (world.enemyLive >= 12 || world.wave >= 2) return 1
  return 0
}

function fillBg(ctx: CanvasRenderingContext2D, world: World): void {
  const tier = pressureTier(world)
  const bg = tier === 3 ? '#12061a' : tier === 2 ? '#0c101c' : tier === 1 ? '#07141a' : '#05140f'
  const grid = tier === 3 ? '#3a1850' : tier === 2 ? '#243048' : tier === 1 ? '#1a3840' : '#143828'
  const bed = tier === 3 ? '#c44dff' : tier === 2 ? '#ff9a3c' : '#3dff9a'
  const soil = tier === 3 ? '#1a0a22' : '#0a1c14'
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  // circuit soil fill
  ctx.fillStyle = soil
  ctx.fillRect(W * 0.5 - 90, H * 0.5 - 140, 180, 280)
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
  // circuit traces on bed
  ctx.strokeStyle = tier >= 2 ? 'rgba(196,77,255,0.25)' : 'rgba(61,255,154,0.22)'
  ctx.lineWidth = 2
  const bx = W * 0.5
  const by = H * 0.5
  ctx.strokeRect(bx - 78, by - 128, 156, 256)
  ctx.beginPath()
  ctx.moveTo(bx - 78, by - 40)
  ctx.lineTo(bx - 40, by - 40)
  ctx.lineTo(bx - 40, by + 20)
  ctx.lineTo(bx + 40, by + 20)
  ctx.lineTo(bx + 40, by - 60)
  ctx.lineTo(bx + 78, by - 60)
  ctx.stroke()
  // glyph petals corners
  ctx.fillStyle = tier >= 2 ? 'rgba(255,106,213,0.2)' : 'rgba(155,255,58,0.18)'
  for (const [px, py] of [[bx - 70, by - 120], [bx + 70, by - 120], [bx - 70, by + 120], [bx + 70, by + 120]]) {
    ctx.beginPath()
    ctx.arc(px, py, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = bed
  ctx.lineWidth = 2
  ctx.strokeRect(bx - 70, by - 110, 140, 220)
  if (world.eggFlags & 1) {
    ctx.strokeStyle = '#7CFFB2'
    ctx.strokeRect(bx - 72, by - 112, 144, 224)
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
  ctx.fillRect(8, 8, W - 16, 112)
  ctx.fillStyle = '#c8facc'
  ctx.font = '13px ui-monospace, monospace'
  ctx.fillText(`HP ${Math.ceil(world.playerHp)}/${world.playerMaxHp}`, 16, 28)
  ctx.fillText(`LV ${world.level}  XP ${world.xp}/${world.xpToNext}`, 16, 46)
  ctx.fillText(`${t('hud.wave')} ${world.wave} · ${waveBeatLabel(world)}  t-${sec}s`, 16, 64)
  ctx.fillStyle = tier >= 2 ? '#ffb347' : '#9ad5a8'
  ctx.fillText(biomeLabel(tier), 16, 82)
  // Exploit pips
  ctx.fillStyle = '#9ad5a8'
  ctx.fillText(t('hud.exploit'), 16, 102)
  for (let p = 0; p < EXPLOIT_CAP; p++) {
    const on = p < world.exploitStacks
    const pop = on && world.exploitPipFlash > 0 && p === world.exploitStacks - 1
    const s = pop ? 14 : 10
    const ox = pop ? -2 : 0
    const oy = pop ? -2 : 0
    ctx.fillStyle = on ? (pop ? '#fff0ff' : '#ff6ad5') : 'rgba(255,106,213,0.2)'
    ctx.fillRect(90 + p * 14 + ox, 92 + oy, s, s)
    if (on) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.strokeRect(90 + p * 14 + ox, 92 + oy, s, s)
    }
  }
  if (world.tick < 60 * 12) {
    ctx.fillStyle = 'rgba(124,255,178,0.75)'
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillText(world.tick < 60 * 8 ? t('tip.inject') : t('tip.synergy'), 170, 102)
  }
  const def = FLOWER_DEFS[world.plantKind]
  ctx.fillStyle = def.color
  ctx.textAlign = 'right'
  ctx.fillText(`${flowerName(world.plantKind)}  ${countFlowers(world)}/${world.upgrades.maxFlowers}`, W - 16, 28)
  ctx.fillStyle = '#9ad5a8'
  ctx.fillText(`${t('hud.seed')} ${world.seed}`, W - 16, 46)
  ctx.fillText(`${t('menu.diff')}: ${diffLabel(world)}`, W - 16, 64)
  if (world.eggFlags & 2) {
    ctx.fillStyle = '#ff6ad5'
    ctx.fillText(t('egg.konami'), W - 16, 82)
  }
  if (world.exploitEmpower > 0) {
    ctx.fillStyle = '#ff6ad5'
    ctx.fillText('EMPOWER', W - 16, 102)
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
  if (world.storyStep === 2) return t('story.3')
  if (world.storyStep === 3) return t('story.4')
  return t('story.5')
}

function waveBeatLabel(world: World): string {
  if (world.waveBeat === WaveBeat.Surge) return t('wave.surge')
  if (world.waveBeat === WaveBeat.Layout) return t('wave.layout')
  if (world.waveBeat === WaveBeat.Escalate) return t('wave.escalate')
  return t('wave.calm')
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
    const inj = touchBtnRect(11)
    const injFill = world.exploitStacks >= 1 || world.injectCd <= 0
      ? 'rgba(64,16,48,0.75)'
      : 'rgba(32,24,40,0.45)'
    drawRoundBtn(ctx, inj.x, inj.y, inj.w, inj.h, t('touch.inject'), injFill)
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


function drawSynergyLinks(ctx: CanvasRenderingContext2D, world: World): void {
  ctx.lineWidth = 2
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    const a = world.flowerLinkA[i]
    if (a >= 0 && world.flowerAlive[a] && a > i) {
      const colony = (world.flowerFlags[i] & FF_COLONY) !== 0
      ctx.strokeStyle = colony ? 'rgba(255,106,213,0.65)' : 'rgba(124,255,178,0.5)'
      ctx.beginPath()
      ctx.moveTo(world.flowerX[i], world.flowerY[i])
      ctx.lineTo(world.flowerX[a], world.flowerY[a])
      ctx.stroke()
      const mx = (world.flowerX[i] + world.flowerX[a]) * 0.5
      const my = (world.flowerY[i] + world.flowerY[a]) * 0.5
      ctx.fillStyle = colony ? '#ff6ad5' : '#7CFFB2'
      ctx.beginPath()
      ctx.moveTo(mx, my - 4)
      ctx.lineTo(mx + 4, my)
      ctx.lineTo(mx, my + 4)
      ctx.lineTo(mx - 4, my)
      ctx.closePath()
      ctx.fill()
    }
    const b = world.flowerLinkB[i]
    if (b >= 0 && world.flowerAlive[b] && b > i) {
      ctx.strokeStyle = 'rgba(102,224,255,0.45)'
      ctx.beginPath()
      ctx.moveTo(world.flowerX[i], world.flowerY[i])
      ctx.lineTo(world.flowerX[b], world.flowerY[b])
      ctx.stroke()
    }
  }
}

function drawPatches(ctx: CanvasRenderingContext2D, world: World): void {
  for (let i = 0; i < MAX_PATCHES; i++) {
    if (!world.patchAlive[i]) continue
    const alpha = 0.2 + 0.15 * (world.patchLife[i] / 160)
    ctx.fillStyle = `rgba(255,80,80,${alpha})`
    ctx.beginPath()
    ctx.arc(world.patchX[i], world.patchY[i], PATCH_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,120,120,0.5)'
    ctx.stroke()
  }
}

function drawScanCones(ctx: CanvasRenderingContext2D, world: World): void {
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (!world.enemyAlive[i]) continue
    if (world.enemyKind[i] !== EnemyKind.Scanner) continue
    if (world.enemyTimer[i] > 18) continue
    const ang = world.enemyPhase[i]
    ctx.fillStyle = 'rgba(110,203,255,0.12)'
    ctx.beginPath()
    ctx.moveTo(world.enemyX[i], world.enemyY[i])
    ctx.arc(world.enemyX[i], world.enemyY[i], SCAN_RANGE, ang - SCAN_HALF_ANGLE, ang + SCAN_HALF_ANGLE)
    ctx.closePath()
    ctx.fill()
  }
}


function drawDashTrail(ctx: CanvasRenderingContext2D, world: World): void {
  for (let i = 0; i < MAX_TRAIL; i++) {
    if (world.trailLife[i] <= 0) continue
    const a = world.trailLife[i] / 12
    ctx.fillStyle = `rgba(124,255,178,${0.15 + a * 0.35})`
    ctx.beginPath()
    ctx.arc(world.trailX[i], world.trailY[i], 6 + (1 - a) * 4, 0, Math.PI * 2)
    ctx.fill()
    // speed line
    ctx.strokeStyle = `rgba(200,255,220,${a * 0.5})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(world.trailX[i] - 10, world.trailY[i])
    ctx.lineTo(world.trailX[i] + 10, world.trailY[i])
    ctx.stroke()
  }
}

function drawActionFlashes(ctx: CanvasRenderingContext2D, world: World): void {
  if (world.plantFlashLife > 0) {
    const u = world.plantFlashLife / 16
    ctx.strokeStyle = `rgba(124,255,178,${u})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(world.plantFlashX, world.plantFlashY, 8 + (1 - u) * 28, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = `rgba(124,255,178,${u * 0.25})`
    ctx.beginPath()
    ctx.arc(world.plantFlashX, world.plantFlashY, 6 + (1 - u) * 12, 0, Math.PI * 2)
    ctx.fill()
  }
  if (world.pruneFlashLife > 0) {
    const u = world.pruneFlashLife / 14
    ctx.strokeStyle = `rgba(255,179,71,${u})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(world.pruneFlashX, world.pruneFlashY, 6 + (1 - u) * 22, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function drawLinkSpark(ctx: CanvasRenderingContext2D, world: World): void {
  if (world.linkSparkLife <= 0) return
  const u = 1 - world.linkSparkLife / 22
  const x = world.linkSparkX0 + (world.linkSparkX1 - world.linkSparkX0) * u
  const y = world.linkSparkY0 + (world.linkSparkY1 - world.linkSparkY0) * u
  ctx.strokeStyle = 'rgba(124,255,178,0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(world.linkSparkX0, world.linkSparkY0)
  ctx.lineTo(world.linkSparkX1, world.linkSparkY1)
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(x, y, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(124,255,178,0.8)'
  ctx.beginPath()
  ctx.arc(x, y, 8, 0, Math.PI * 2)
  ctx.fill()
}

function drawDeathPop(ctx: CanvasRenderingContext2D, world: World): void {
  if (world.deathPopLife <= 0) return
  const u = world.deathPopLife / 14
  ctx.strokeStyle = `rgba(255,238,102,${u})`
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(world.deathPopX, world.deathPopY, 6 + (1 - u) * 26, 0, Math.PI * 2)
  ctx.stroke()
}

function drawFloats(ctx: CanvasRenderingContext2D, world: World): void {
  ctx.textAlign = 'center'
  for (let i = 0; i < MAX_FLOATS; i++) {
    if (!world.floatAlive[i]) continue
    const big = world.floatBig[i]
    const a = Math.min(1, world.floatLife[i] / 10)
    ctx.globalAlpha = a
    ctx.fillStyle = big ? '#ffee66' : '#c8facc'
    ctx.font = big ? 'bold 18px ui-monospace, monospace' : 'bold 13px ui-monospace, monospace'
    ctx.fillText(String(Math.round(world.floatVal[i])), world.floatX[i], world.floatY[i])
  }
  ctx.globalAlpha = 1
  ctx.textAlign = 'left'
}

function calloutText(world: World): string {
  if (world.calloutId === CALL_TRIPLE) return t('call.triple')
  if (world.calloutId === CALL_PENTA) return t('call.penta')
  if (world.calloutId === CALL_LINK) return t('call.link')
  if (world.calloutId === CALL_EXPLOIT) return t('call.exploit')
  if (world.calloutId === CALL_INJECT) return t('call.inject')
  return ''
}

function drawCallout(ctx: CanvasRenderingContext2D, world: World): void {
  if (world.calloutLife <= 0 || !world.calloutId) return
  const msg = calloutText(world)
  if (!msg) return
  const u = Math.min(1, world.calloutLife / 12)
  const scale = 1 + (1 - Math.min(1, (55 - world.calloutLife) / 8)) * 0.25
  ctx.save()
  ctx.translate(W * 0.5, H * 0.28)
  ctx.scale(scale, scale)
  ctx.globalAlpha = u
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(-140, -28, 280, 48)
  ctx.fillStyle = world.calloutId === CALL_EXPLOIT || world.calloutId === CALL_PENTA ? '#ff6ad5' : '#7CFFB2'
  ctx.font = 'bold 26px ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.fillText(msg, 0, 8)
  ctx.restore()
  ctx.textAlign = 'left'
  ctx.globalAlpha = 1
}

export function renderFrame(ctx: CanvasRenderingContext2D, world: World, fps = 0, showFps = false): void {
  ctx.save()
  // camera juice: shake + zoom punch (clamped)
  let sx = 0
  let sy = 0
  if (world.shakeLeft > 0 && world.shakeMag > 0) {
    const m = Math.min(6, world.shakeMag)
    const seed = world.tick * 1103515245
    sx = (((seed >>> 16) & 31) / 31 - 0.5) * 2 * m
    sy = (((seed >>> 8) & 31) / 31 - 0.5) * 2 * m
  }
  const z = world.zoomPunch > 0 ? 1 + Math.min(0.06, world.zoomPunch * 0.005) : 1
  if (z !== 1) {
    ctx.translate(W * 0.5, H * 0.5)
    ctx.scale(z, z)
    ctx.translate(-W * 0.5 + sx, -H * 0.5 + sy)
  } else {
    ctx.translate(sx, sy)
  }
  fillBg(ctx, world)
  drawPatches(ctx, world)
  drawSynergyLinks(ctx, world)
  for (let i = 0; i < MAX_FLOWERS; i++) {
    if (!world.flowerAlive[i]) continue
    const def = FLOWER_DEFS[world.flowerKind[i]]
    drawFlower(ctx, world.flowerX[i], world.flowerY[i], def.color, world.flowerKind[i])
    // heat tint ring
    const heat = world.flowerHeat[i]
    if (heat > 20) {
      const hAlpha = Math.min(0.65, heat / 100)
      ctx.strokeStyle = heat >= HEAT_SILENCE ? `rgba(255,60,60,${hAlpha})` : heat >= HEAT_MISS ? `rgba(255,160,60,${hAlpha})` : `rgba(255,220,100,${hAlpha * 0.5})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(world.flowerX[i], world.flowerY[i], 12, 0, Math.PI * 2)
      ctx.stroke()
    }
    if (world.flowerMark[i] > 0) {
      ctx.strokeStyle = 'rgba(110,203,255,0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(world.flowerX[i], world.flowerY[i], 16, 0, Math.PI * 2)
      ctx.stroke()
    }
    if (world.flowerSilence[i] > 0) {
      ctx.fillStyle = 'rgba(40,40,50,0.35)'
      ctx.beginPath()
      ctx.arc(world.flowerX[i], world.flowerY[i], 10, 0, Math.PI * 2)
      ctx.fill()
    }
    if ((world.flowerFlags[i] & FF_COLONY) !== 0) {
      const pulse = 22 + Math.sin(world.tick * 0.25) * 4
      ctx.strokeStyle = 'rgba(255,106,213,0.55)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(world.flowerX[i], world.flowerY[i], pulse, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(255,180,230,0.25)'
      ctx.beginPath()
      ctx.arc(world.flowerX[i], world.flowerY[i], pulse + 8, 0, Math.PI * 2)
      ctx.stroke()
    }
    if (world.flowerKind[i] === 3) {
      ctx.strokeStyle = 'rgba(102,224,255,0.25)'
      ctx.beginPath()
      ctx.arc(world.flowerX[i], world.flowerY[i], def.range * world.upgrades.rangeMul * 0.35, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    if (!world.projAlive[i]) continue
    drawProjectile(ctx, world.projX[i], world.projY[i], (world.projFlags[i] & PF_INJECT) !== 0)
  }
  for (let i = 0; i < MAX_PARTICLES; i++) {
    if (!world.partAlive[i]) continue
    const k = world.partKind[i]
    if (k === PART_BLOOM) ctx.fillStyle = '#7CFFB2'
    else if (k === PART_VENT) ctx.fillStyle = '#ffb347'
    else if (k === PART_SPARK) ctx.fillStyle = '#ff6ad5'
    else if (k === PART_DEATH) ctx.fillStyle = '#ffee66'
    else ctx.fillStyle = '#9bff3a'
    const sz = k === PART_DEATH || k === PART_SPARK ? 3 : 2
    ctx.fillRect(world.partX[i] - sz * 0.5, world.partY[i] - sz * 0.5, sz, sz)
  }
  drawDashTrail(ctx, world)
  drawActionFlashes(ctx, world)
  drawLinkSpark(ctx, world)
  drawDeathPop(ctx, world)
  drawFloats(ctx, world)
  drawScanCones(ctx, world)
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (!world.enemyAlive[i]) continue
    const def = ENEMY_DEFS[world.enemyKind[i]]
    drawEnemy(ctx, world.enemyX[i], world.enemyY[i], def.color, world.enemyKind[i], def.radius)
  }
  drawBossFx(ctx, world)
  if (world.phase !== Phase.Menu && world.phase !== Phase.Story) {
    drawPlayer(ctx, world.playerX, world.playerY, world.dashLeft > 0)
    // aim reticle for Inject
    if (world.phase === Phase.Run) {
      const ready = world.exploitStacks >= 1 || world.injectCd <= 0
      const ax = world.playerX + world.aimX * 36
      const ay = world.playerY + world.aimY * 36
      ctx.strokeStyle = ready ? 'rgba(255,106,213,0.85)' : 'rgba(120,120,140,0.4)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(world.playerX, world.playerY)
      ctx.lineTo(ax, ay)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(ax, ay, 5, 0, Math.PI * 2)
      ctx.stroke()
      if (world.injectCd > 0 && world.exploitStacks < 1) {
        ctx.fillStyle = 'rgba(180,180,200,0.5)'
        ctx.font = '10px ui-monospace, monospace'
        ctx.fillText(String(Math.ceil(world.injectCd / 60)), ax + 8, ay)
      }
    }
  }
  if (world.phase === Phase.Run || world.phase === Phase.Pause || world.phase === Phase.LevelUp) {
    hud(ctx, world)
    if (world.layoutLeft > 0 || world.waveBeat === WaveBeat.Layout) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(W * 0.5 - 160, 120, 320, 36)
      ctx.fillStyle = '#ffb347'
      ctx.font = 'bold 15px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(t('hud.layout'), W * 0.5, 144)
      ctx.textAlign = 'left'
    }
    if (showFps) {
      ctx.fillStyle = '#7CFFB2'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(`FPS ${fps.toFixed(0)}  e ${world.enemyLive}  p ${world.projLive}`, 16, H - 12)
    }
  }
  if (world.phase === Phase.Menu) {
    drawTitleMark(ctx, W * 0.5, H * 0.11, 2)
    const lines = [
      t('subtitle'),
      t('menu.tip'),
      t('tip.inject'),
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
    const snap = world.levelSnap > 0 ? Math.min(1, world.levelSnap / 8) : 1
    const pop = 0.85 + snap * 0.15
    ctx.fillStyle = '#7CFFB2'
    ctx.font = 'bold 24px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.save()
    ctx.translate(W / 2, 140)
    ctx.scale(pop, pop)
    ctx.fillText(t('levelup'), 0, 0)
    ctx.restore()
    for (let i = 0; i < 3; i++) {
      const id = world.levelChoices[i]
      if (id < 0) continue
      const r = touchBtnRect((8 + i) as 8 | 9 | 10)
      const cardPop = 0.7 + Math.min(1, Math.max(0, (world.levelSnap - i * 3) / 8)) * 0.3
      ctx.save()
      ctx.translate(r.x + r.w * 0.5, r.y + r.h * 0.5)
      ctx.scale(cardPop, cardPop)
      ctx.translate(-(r.x + r.w * 0.5), -(r.y + r.h * 0.5))
      ctx.fillStyle = '#102818'
      ctx.fillRect(r.x, r.y, r.w, r.h)
      ctx.strokeStyle = '#3dff9a'
      ctx.lineWidth = 2 + (1 - cardPop) * 4
      ctx.strokeRect(r.x, r.y, r.w, r.h)
      ctx.fillStyle = '#c8facc'
      ctx.font = 'bold 16px ui-monospace, monospace'
      ctx.fillText(`[${i + 1}] ${upgradeTitle(id)}`, r.x + r.w * 0.5, r.y + 40)
      ctx.font = '13px ui-monospace, monospace'
      ctx.fillStyle = '#9ad5a8'
      wrapText(ctx, upgradeBlurb(id), r.x + r.w * 0.5, r.y + 72, r.w - 24, 18)
      ctx.restore()
    }
    ctx.textAlign = 'left'
  } else if (world.phase === Phase.Result) {
    const reason =
      world.resultKey === ResultKey.Survived ? t('result.survived') : t('result.wiped')
    if (world.survived) {
      ctx.fillStyle = `rgba(124,255,178,${0.08 + 0.06 * Math.sin(world.tick * 0.2)})`
      ctx.fillRect(0, 0, W, H)
    }
    overlay(ctx, world.survived ? t('result.win') : t('result.lose'), [
      reason,
      `${t('hud.seed')} ${world.seed}`,
      tf('result.stats', {
        s: (world.tick / 60).toFixed(1),
        k: world.killCount,
        l: world.level,
      }),
      `${t('menu.diff')}: ${diffLabel(world)}`,
      '',
      t('result.share'),
      t('result.verify'),
      t('result.restart'),
    ])
  }
  drawCallout(ctx, world)
  if (world.flashLeft > 0) {
    const a = Math.min(0.55, world.flashLeft * 0.06)
    ctx.fillStyle = world.survived && world.phase === Phase.Result
      ? `rgba(124,255,178,${a})`
      : `rgba(255,255,255,${a})`
    ctx.fillRect(0, 0, W, H)
  }
  ctx.restore()
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
  // Space-split for Latin; character-split for CJK (no spaces).
  const units = /[\u3400-\u9fff\uf900-\ufaff]/.test(text) ? Array.from(text) : text.split(' ')
  const joiner = units.length && units[0].length === 1 && !text.includes(' ') ? '' : ' '
  let line = ''
  let yy = y
  for (let n = 0; n < units.length; n++) {
    const test = line ? line + joiner + units[n] : units[n]
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy)
      line = units[n]
      yy += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, yy)
}
