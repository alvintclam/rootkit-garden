import { SimEvent } from '../sim/events'

type SfxKind = 'plant' | 'prune' | 'dash' | 'hit' | 'level' | 'die' | 'ui' | 'story' | 'fire' | 'synergy' | 'overheat' | 'exploit'

let ac: AudioContext | null = null
let master: GainNode | null = null
let gardenBus: GainNode | null = null
let invadeBus: GainNode | null = null
let muted = false
let musicOn = false
let step = 0
let timer: number | null = null
let pressure = 0
let pulseGarden: OscillatorNode | null = null
let pulseInvade: OscillatorNode | null = null
let pulseGarden2: OscillatorNode | null = null
let pulseInvade2: OscillatorNode | null = null
let bassGarden: OscillatorNode | null = null
let bassInvade: OscillatorNode | null = null
let noiseSrc: AudioBufferSourceNode | null = null
let noiseGain: GainNode | null = null

const GARDEN_LEAD = [
  60, 64, 67, 72, 67, 64, 62, 67, 60, 65, 69, 72, 69, 65, 64, 67, 62, 66, 69, 74, 69, 66, 64, 60, 59, 62, 67,
  71, 67, 62, 60, 64,
]
const GARDEN_BASS = [
  36, 36, 43, 43, 38, 38, 45, 45, 36, 36, 41, 41, 38, 38, 43, 43, 34, 34, 41, 41, 36, 36, 43, 43, 35, 35, 42,
  42, 36, 36, 43, 43,
]
const INVADE_LEAD = [
  57, 60, 63, 68, 63, 60, 56, 63, 58, 61, 64, 69, 64, 61, 57, 64, 55, 58, 62, 67, 62, 58, 55, 58, 56, 59, 63,
  68, 63, 59, 56, 60,
]
const INVADE_BASS = [
  33, 33, 40, 40, 34, 34, 41, 41, 32, 32, 39, 39, 33, 33, 40, 40, 31, 31, 38, 38, 33, 33, 40, 40, 32, 32, 39,
  39, 33, 33, 40, 33,
]

function ensure(): AudioContext | null {
  if (muted) return null
  if (typeof window === 'undefined') return null
  if (!ac) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ac = new AC()
    master = ac.createGain()
    master.gain.value = 0.11
    master.connect(ac.destination)
    gardenBus = ac.createGain()
    invadeBus = ac.createGain()
    gardenBus.gain.value = 1
    invadeBus.gain.value = 0
    gardenBus.connect(master)
    invadeBus.connect(master)
  }
  if (ac.state === 'suspended') void ac.resume()
  return ac
}

function midiToHz(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12)
}

function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const len = ctx.sampleRate * 0.5
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let s = 0xcafe
  for (let i = 0; i < len; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    data[i] = ((s >> 16) & 1) * 2 - 1
  }
  return buf
}

function startVoices(): void {
  const ctx = ensure()
  if (!ctx || !gardenBus || !invadeBus || musicOn) return

  pulseGarden = ctx.createOscillator()
  pulseGarden.type = 'square'
  const g1 = ctx.createGain()
  g1.gain.value = 0.04
  pulseGarden.connect(g1)
  g1.connect(gardenBus)
  pulseGarden.start()

  pulseGarden2 = ctx.createOscillator()
  pulseGarden2.type = 'square'
  const g2 = ctx.createGain()
  g2.gain.value = 0.022
  pulseGarden2.connect(g2)
  g2.connect(gardenBus)
  pulseGarden2.start()

  bassGarden = ctx.createOscillator()
  bassGarden.type = 'triangle'
  const gb = ctx.createGain()
  gb.gain.value = 0.035
  bassGarden.connect(gb)
  gb.connect(gardenBus)
  bassGarden.start()

  pulseInvade = ctx.createOscillator()
  pulseInvade.type = 'square'
  const i1 = ctx.createGain()
  i1.gain.value = 0.045
  pulseInvade.connect(i1)
  i1.connect(invadeBus)
  pulseInvade.start()

  pulseInvade2 = ctx.createOscillator()
  pulseInvade2.type = 'sawtooth'
  const i2 = ctx.createGain()
  i2.gain.value = 0.02
  pulseInvade2.connect(i2)
  i2.connect(invadeBus)
  pulseInvade2.start()

  bassInvade = ctx.createOscillator()
  bassInvade.type = 'square'
  const ib = ctx.createGain()
  ib.gain.value = 0.04
  bassInvade.connect(ib)
  ib.connect(invadeBus)
  bassInvade.start()

  noiseGain = ctx.createGain()
  noiseGain.gain.value = 0
  noiseGain.connect(invadeBus)
  noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = makeNoiseBuffer(ctx)
  noiseSrc.loop = true
  noiseSrc.connect(noiseGain)
  noiseSrc.start()

  musicOn = true
  step = 0
  const tickMs = 160
  timer = window.setInterval(() => {
    if (!pulseGarden || !pulseInvade || !pulseGarden2 || !pulseInvade2 || !bassGarden || !bassInvade) return
    const gi = step % GARDEN_LEAD.length
    const ii = step % INVADE_LEAD.length
    const t = ctx.currentTime
    pulseGarden.frequency.setValueAtTime(midiToHz(GARDEN_LEAD[gi]), t)
    pulseGarden2.frequency.setValueAtTime(midiToHz(GARDEN_LEAD[gi] + (step % 4 === 0 ? 12 : 7)), t)
    bassGarden.frequency.setValueAtTime(midiToHz(GARDEN_BASS[gi]), t)
    pulseInvade.frequency.setValueAtTime(midiToHz(INVADE_LEAD[ii]), t)
    pulseInvade2.frequency.setValueAtTime(midiToHz(INVADE_LEAD[ii] + 3), t)
    bassInvade.frequency.setValueAtTime(midiToHz(INVADE_BASS[ii]), t)
    if (noiseGain) {
      const hat = step % 4 === 0 ? 0.03 + pressure * 0.05 : 0.004
      const snare = pressure > 0.55 && step % 8 === 4 ? 0.06 * pressure : 0
      noiseGain.gain.setTargetAtTime(hat + snare, t, 0.015)
    }
    step++
  }, tickMs) as unknown as number
}

export function setMuted(v: boolean): void {
  muted = v
  if (master) master.gain.value = v ? 0 : 0.11
}

export function startMusic(): void {
  ensure()
  startVoices()
}

export function setPressure(p: number): void {
  pressure = Math.max(0, Math.min(1, p))
  const ctx = ac
  if (!ctx || !gardenBus || !invadeBus) return
  const t = ctx.currentTime
  gardenBus.gain.setTargetAtTime(1 - pressure * 0.88, t, 0.22)
  invadeBus.gain.setTargetAtTime(pressure, t, 0.22)
}

export function beep(kind: SfxKind): void {
  const ctx = ensure()
  if (!ctx || !master) return
  startVoices()
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.connect(g)
  g.connect(master)
  const t = ctx.currentTime
  let freq = 440
  let dur = 0.06
  let type: OscillatorType = 'square'
  let peak = 0.07
  if (kind === 'plant') {
    freq = 700
    dur = 0.055
    type = 'triangle'
  } else if (kind === 'prune') {
    freq = 240
    type = 'triangle'
    dur = 0.08
  } else if (kind === 'dash') {
    freq = 160
    type = 'sawtooth'
    dur = 0.1
  } else if (kind === 'hit') {
    freq = 1040
    dur = 0.028
    peak = 0.05
  } else if (kind === 'fire') {
    freq = 880
    dur = 0.02
    peak = 0.03
  } else if (kind === 'level') {
    freq = 523
    dur = 0.16
  } else if (kind === 'die') {
    freq = 90
    type = 'sawtooth'
    dur = 0.28
  } else if (kind === 'story') {
    freq = 392
    dur = 0.09
    type = 'triangle'
  } else if (kind === 'synergy') {
    freq = 620
    dur = 0.05
    type = 'triangle'
    peak = 0.045
  } else if (kind === 'overheat') {
    freq = 140
    type = 'sawtooth'
    dur = 0.12
    peak = 0.06
  } else if (kind === 'exploit') {
    freq = 440
    dur = 0.18
    type = 'square'
    peak = 0.08
  } else {
    freq = 480
    dur = 0.045
  }
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (kind === 'level') {
    o.frequency.linearRampToValueAtTime(659, t + dur * 0.45)
    o.frequency.linearRampToValueAtTime(784, t + dur)
  }
  if (kind === 'dash') o.frequency.exponentialRampToValueAtTime(360, t + dur)
  if (kind === 'die') o.frequency.exponentialRampToValueAtTime(40, t + dur)
  if (kind === 'plant') o.frequency.linearRampToValueAtTime(880, t + dur)
  if (kind === 'exploit') {
    o.frequency.linearRampToValueAtTime(660, t + dur * 0.4)
    o.frequency.linearRampToValueAtTime(990, t + dur)
  }
  g.gain.setValueAtTime(peak, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.start(t)
  o.stop(t + dur)
}

export function consumeSimEvents(events: number): void {
  if (events & SimEvent.Plant) beep('plant')
  if (events & SimEvent.Prune) beep('prune')
  if (events & SimEvent.Dash) beep('dash')
  if (events & SimEvent.Kill) beep('hit')
  if (events & SimEvent.LevelUp) beep('level')
  if (events & SimEvent.Die) beep('die')
  if (events & SimEvent.Win) beep('ui')
  if (events & SimEvent.StoryAdvance) beep('story')
  if (events & SimEvent.Synergy) beep('synergy')
  if (events & SimEvent.Overheat) beep('overheat')
  if (events & SimEvent.Exploit) beep('exploit')
}

