import { CmdBit } from '../sim/inputCmd'

const down = new Set<string>()
const pressed = new Set<string>()
const released = new Set<string>()
let plantClick = false

function keyOf(e: KeyboardEvent): string {
  return e.code
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
    if (e.button === 0) plantClick = true
  })
  window.addEventListener('blur', () => {
    down.clear()
  })
}

export function pollBits(): number {
  let bits = 0
  if (down.has('KeyW') || down.has('ArrowUp')) bits |= CmdBit.Up
  if (down.has('KeyS') || down.has('ArrowDown')) bits |= CmdBit.Down
  if (down.has('KeyA') || down.has('ArrowLeft')) bits |= CmdBit.Left
  if (down.has('KeyD') || down.has('ArrowRight')) bits |= CmdBit.Right
  if (pressed.has('Space')) bits |= CmdBit.Dash
  if (pressed.has('KeyE') || plantClick) bits |= CmdBit.Plant
  if (pressed.has('KeyQ') || pressed.has('KeyX')) bits |= CmdBit.Prune
  if (pressed.has('KeyR') || pressed.has('Tab')) bits |= CmdBit.Cycle
  if (pressed.has('Escape') || pressed.has('KeyP')) bits |= CmdBit.Pause
  if (pressed.has('Enter')) bits |= CmdBit.Confirm | CmdBit.Restart
  if (pressed.has('Digit1')) bits |= CmdBit.Pick1
  if (pressed.has('Digit2')) bits |= CmdBit.Pick2
  if (pressed.has('Digit3')) bits |= CmdBit.Pick3
  if (pressed.has('KeyL')) bits |= CmdBit.Lang
  if (pressed.has('BracketLeft') || pressed.has('Minus')) bits |= CmdBit.Diff
  pressed.clear()
  released.clear()
  plantClick = false
  return bits
}
