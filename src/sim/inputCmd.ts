export const CmdBit = {
  Up: 1 << 0,
  Down: 1 << 1,
  Left: 1 << 2,
  Right: 1 << 3,
  Dash: 1 << 4,
  Plant: 1 << 5,
  Prune: 1 << 6,
  Cycle: 1 << 7,
  Pause: 1 << 8,
  Confirm: 1 << 9,
  Pick1: 1 << 10,
  Pick2: 1 << 11,
  Pick3: 1 << 12,
  Restart: 1 << 13,
  Lang: 1 << 14,
  Diff: 1 << 15,
} as const

export type InputCmd = {
  bits: number
  tick: number
}

export function createCmdLog(): InputCmd[] {
  return []
}

export function pushCmd(log: InputCmd[], tick: number, bits: number): void {
  if (bits === 0) return
  const last = log.length > 0 ? log[log.length - 1] : null
  if (last && last.tick === tick) {
    last.bits |= bits
    return
  }
  log.push({ tick, bits })
}

export function cmdAt(log: readonly InputCmd[], tick: number): number {
  let bits = 0
  for (let i = 0; i < log.length; i++) {
    if (log[i].tick === tick) bits |= log[i].bits
    else if (log[i].tick > tick) break
  }
  return bits
}
