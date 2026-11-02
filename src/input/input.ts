import { CmdBit } from '../sim/inputCmd'
import { H, W } from '../sim/constants'

const down = new Set<string>()
const pressed = new Set<string>()
const released = new Set<string>()
let plantClick = false

/** Touch → cmd state (no alloc in pollBits). */
let touchUi = false
let joyActive = false
let joyDx = 0
let joyDy = 0
let joyOriginX = 0
let joyOriginY = 0
let joyTouchId = -1
let stickX = 0
let stickY = 0

let tapPlant = false
let tapPrune = false
let tapDash = false
let tapCycle = false
let tapPause = false
let tapConfirm = false
let tapLang = false
let tapDiff = false
let tapPick1 = false
let tapPick2 = false
let tapPick3 = false
let tapInject = false

const BTN_W = 108
const BTN_H = 64
const JOY_DEAD = 18
const JOY_MAX = 56

type BtnId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

function keyOf(e: KeyboardEvent): string {
  return e.code
}

function canvasXY(target: HTMLElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = target.getBoundingClientRect()
  const rw = rect.width || 1
  const rh = rect.height || 1
  return {
    x: ((clientX - rect.left) * W) / rw,
    y: ((clientY - rect.top) * H) / rh,
  }
}

/** Right-side action pad geometry (portrait). */
export function touchBtnRect(id: BtnId): { x: number; y: number; w: number; h: number } {
  const padR = 14
  const x = W - BTN_W - padR
  if (id === 0) return { x, y: H - 4 * (BTN_H + 10) - 24, w: BTN_W, h: BTN_H } // plant
  if (id === 1) return { x, y: H - 3 * (BTN_H + 10) - 24, w: BTN_W, h: BTN_H } // prune
  if (id === 2) return { x, y: H - 2 * (BTN_H + 10) - 24, w: BTN_W, h: BTN_H } // dash
  if (id === 3) return { x, y: H - 1 * (BTN_H + 10) - 24, w: BTN_W, h: BTN_H } // cycle
  if (id === 11) return { x: x - BTN_W - 8, y: H - 2 * (BTN_H + 10) - 24, w: BTN_W, h: BTN_H } // inject
  if (id === 4) return { x: W - 72, y: 108, w: 58, h: 44 } // pause
  // menu / result / level-up hit zones
  if (id === 5) return { x: W * 0.5 - 120, y: H * 0.72, w: 240, h: 56 } // confirm
  if (id === 6) return { x: 24, y: H * 0.82, w: 150, h: 48 } // lang
  if (id === 7) return { x: W - 174, y: H * 0.82, w: 150, h: 48 } // diff
  if (id === 8) return { x: W * 0.5 - 110, y: 168, w: 220, h: 150 } // pick1
  if (id === 9) return { x: W * 0.5 - 110, y: 338, w: 220, h: 150 } // pick2
  return { x: W * 0.5 - 110, y: 508, w: 220, h: 150 } // pick3
}

export function joyOrigin(): { x: number; y: number; active: boolean; sx: number; sy: number } {
  return { x: joyOriginX, y: joyOriginY, active: joyActive, sx: stickX, sy: stickY }
}

export function isTouchUi(): boolean {
  return touchUi
}

function hit(x: number, y: number, id: BtnId): boolean {
  const r = touchBtnRect(id)
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
}

function fireBtnAt(x: number, y: number): boolean {
  if (hit(x, y, 0)) {
    tapPlant = true
    return true
  }
  if (hit(x, y, 1)) {
    tapPrune = true
    return true
  }
  if (hit(x, y, 2)) {
    tapDash = true
    return true
  }
  if (hit(x, y, 11)) {
    tapInject = true
    return true
  }
  if (hit(x, y, 3)) {
    tapCycle = true
    return true
  }
  if (hit(x, y, 4)) {
    tapPause = true
    return true
  }
  if (hit(x, y, 8)) {
    tapPick1 = true
    return true
  }
  if (hit(x, y, 9)) {
    tapPick2 = true
    return true
  }
  if (hit(x, y, 10)) {
    tapPick3 = true
    return true
  }
  if (hit(x, y, 5)) {
    tapConfirm = true
    return true
  }
  if (hit(x, y, 6)) {
    tapLang = true
    return true
  }
  if (hit(x, y, 7)) {
    tapDiff = true
    return true
  }
  return false
}

function updateJoy(x: number, y: number): void {
  joyDx = x - joyOriginX
  joyDy = y - joyOriginY
  const len = Math.sqrt(joyDx * joyDx + joyDy * joyDy)
  const scale = len > JOY_MAX && len > 0 ? JOY_MAX / len : 1
  stickX = joyDx * scale
  stickY = joyDy * scale
}

export function bindInput(target: HTMLElement): void {
  target.addEventListener('keydown', (e) => {
    const k = keyOf(e)
    if (!down.has(k)) pressed.add(k)
    down.add(k)
    if (
      k === 'Space' ||
      k === 'KeyE' ||
      k === 'KeyQ' ||
      k === 'KeyF' ||
      k === 'ShiftLeft' ||
      k === 'ShiftRight' ||
      k === 'KeyR' ||
      k === 'KeyL' ||
      k === 'KeyD' ||
      k === 'Enter' ||
      k === 'Escape' ||
      k === 'Digit1' ||
      k === 'Digit2' ||
      k === 'Digit3' ||
      k === 'Tab' ||
      k === 'BracketLeft' ||
      k === 'Minus'
    ) {
      e.preventDefault()
    }
  })
  target.addEventListener('keyup', (e) => {
    const k = keyOf(e)
    down.delete(k)
    released.add(k)
  })
  target.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      const p = canvasXY(target, e.clientX, e.clientY)
      if (!fireBtnAt(p.x, p.y)) plantClick = true
    }
  })

  const onTouchStart = (e: TouchEvent) => {
    touchUi = true
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      const p = canvasXY(target, t.clientX, t.clientY)
      if (fireBtnAt(p.x, p.y)) continue
      // left half (below HUD) → joystick; also allow left-of-buttons
      if (!joyActive && p.x < W * 0.55 && p.y > 140) {
        joyActive = true
        joyTouchId = t.identifier
        joyOriginX = p.x
        joyOriginY = p.y
        stickX = 0
        stickY = 0
        joyDx = 0
        joyDy = 0
        continue
      }
      // elsewhere: treat as confirm / plant depending on region
      if (p.y > H * 0.55) tapConfirm = true
      else plantClick = true
    }
  }
  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    if (!joyActive) return
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      if (t.identifier !== joyTouchId) continue
      const p = canvasXY(target, t.clientX, t.clientY)
      updateJoy(p.x, p.y)
    }
  }
  const onTouchEnd = (e: TouchEvent) => {
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      if (t.identifier === joyTouchId) {
        joyActive = false
        joyTouchId = -1
        joyDx = 0
        joyDy = 0
        stickX = 0
        stickY = 0
      }
    }
  }

  target.addEventListener('touchstart', onTouchStart, { passive: false })
  target.addEventListener('touchmove', onTouchMove, { passive: false })
  target.addEventListener('touchend', onTouchEnd, { passive: false })
  target.addEventListener('touchcancel', onTouchEnd, { passive: false })

  window.addEventListener('blur', () => {
    down.clear()
    joyActive = false
    joyTouchId = -1
    joyDx = 0
    joyDy = 0
    stickX = 0
    stickY = 0
  })
}

export function pollBits(): number {
  let bits = 0
  if (down.has('KeyW') || down.has('ArrowUp')) bits |= CmdBit.Up
  if (down.has('KeyS') || down.has('ArrowDown')) bits |= CmdBit.Down
  if (down.has('KeyA') || down.has('ArrowLeft')) bits |= CmdBit.Left
  if (down.has('KeyD') || down.has('ArrowRight')) bits |= CmdBit.Right

  if (joyActive) {
    if (joyDy < -JOY_DEAD) bits |= CmdBit.Up
    if (joyDy > JOY_DEAD) bits |= CmdBit.Down
    if (joyDx < -JOY_DEAD) bits |= CmdBit.Left
    if (joyDx > JOY_DEAD) bits |= CmdBit.Right
  }

  if (pressed.has('Space') || tapDash) bits |= CmdBit.Dash
  if (pressed.has('ShiftLeft') || pressed.has('ShiftRight') || pressed.has('KeyF') || tapInject) bits |= CmdBit.Inject
  if (pressed.has('KeyE') || plantClick || tapPlant) bits |= CmdBit.Plant
  if (pressed.has('KeyQ') || pressed.has('KeyX') || tapPrune) bits |= CmdBit.Prune
  if (pressed.has('KeyR') || pressed.has('Tab') || tapCycle) bits |= CmdBit.Cycle
  if (pressed.has('Escape') || pressed.has('KeyP') || tapPause) bits |= CmdBit.Pause
  if (pressed.has('Enter') || tapConfirm) bits |= CmdBit.Confirm | CmdBit.Restart
  if (pressed.has('Digit1') || tapPick1) bits |= CmdBit.Pick1
  if (pressed.has('Digit2') || tapPick2) bits |= CmdBit.Pick2
  if (pressed.has('Digit3') || tapPick3) bits |= CmdBit.Pick3
  if (pressed.has('KeyL') || tapLang) bits |= CmdBit.Lang
  if (pressed.has('BracketLeft') || pressed.has('Minus') || tapDiff) bits |= CmdBit.Diff

  pressed.clear()
  released.clear()
  plantClick = false
  tapPlant = false
  tapPrune = false
  tapDash = false
  tapCycle = false
  tapPause = false
  tapConfirm = false
  tapLang = false
  tapDiff = false
  tapPick1 = false
  tapPick2 = false
  tapPick3 = false
  tapInject = false
  return bits
}
