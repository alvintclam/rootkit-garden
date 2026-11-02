import { SimEvent } from '../sim/events'

type SfxKind =
  | 'plant'
  | 'prune'
  | 'dash'
  | 'hit'
  | 'kill'
  | 'multi'
  | 'level'
  | 'die'
  | 'ui'
  | 'win'
  | 'story'
  | 'fire'
  | 'synergy'
  | 'synergyForm'
  | 'overheat'
  | 'exploit'
  | 'stack'
  | 'warn'

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
let multiPitch = 0

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
    master.gain.value = 0.12
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
  if (master) master.gain.value = v ? 0 : 0.12
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

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  peak: number,
  slide?: number,
): void {
  const ctx = ensure()
  if (!ctx || !master) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.connect(g)
  g.connect(master)
  const t = ctx.currentTime
  o.frequency.setValueAtTime(freq, t)
  if (slide !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur)
  g.gain.setValueAtTime(peak, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.start(t)
  o.stop(t + dur + 0.01)
}

function noiseBurst(dur: number, peak: number): void {
  const ctx = ensure()
  if (!ctx || !master) return
  const src = ctx.createBufferSource()
  src.buffer = makeNoiseBuffer(ctx)
  const g = ctx.createGain()
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 1200
  f.Q.value = 0.7
  src.connect(f)
  f.connect(g)
  g.connect(master)
  const t = ctx.currentTime
  g.gain.setValueAtTime(peak, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.start(t)
  src.stop(t + dur + 0.02)
}

export function beep(kind: SfxKind): void {
  const ctx = ensure()
  if (!ctx || !master) return
  startVoices()
  if (kind === 'plant') {
    tone(180, 0.05, 'triangle', 0.07, 90)
    tone(720, 0.07, 'square', 0.05, 1100)
  } else if (kind === 'prune') {
    tone(220, 0.06, 'sawtooth', 0.06, 90)
    noiseBurst(0.05, 0.04)
    tone(480, 0.04, 'triangle', 0.04)
  } else if (kind === 'dash') {
    tone(140, 0.11, 'sawtooth', 0.07, 420)
    noiseBurst(0.06, 0.03)
  } else if (kind === 'hit') {
    tone(980, 0.025, 'square', 0.045)
  } else if (kind === 'kill') {
    tone(520, 0.04, 'square', 0.06, 180)
    tone(880, 0.05, 'triangle', 0.05)
    noiseBurst(0.04, 0.035)
  } else if (kind === 'multi') {
    multiPitch = Math.min(multiPitch + 1, 6)
    const base = 440 + multiPitch * 70
    tone(base, 0.08, 'square', 0.07, base * 1.5)
    tone(base * 1.25, 0.1, 'triangle', 0.05)
    noiseBurst(0.05, 0.04)
  } else if (kind === 'level') {
    tone(523, 0.08, 'square', 0.06)
    tone(659, 0.1, 'square', 0.055)
    tone(784, 0.14, 'triangle', 0.06)
    tone(1046, 0.12, 'triangle', 0.04)
  } else if (kind === 'die') {
    tone(110, 0.32, 'sawtooth', 0.09, 35)
    noiseBurst(0.2, 0.05)
  } else if (kind === 'win') {
    tone(523, 0.1, 'square', 0.07)
    tone(659, 0.12, 'square', 0.06)
    tone(784, 0.14, 'triangle', 0.07)
    tone(1046, 0.18, 'triangle', 0.06)
    tone(1318, 0.2, 'square', 0.04)
  } else if (kind === 'story') {
    tone(392, 0.09, 'triangle', 0.05)
  } else if (kind === 'fire') {
    tone(880, 0.018, 'square', 0.025)
  } else if (kind === 'synergy') {
    tone(640, 0.045, 'triangle', 0.04)
  } else if (kind === 'synergyForm') {
    tone(520, 0.05, 'triangle', 0.05, 900)
    tone(780, 0.07, 'square', 0.04)
  } else if (kind === 'overheat') {
    tone(130, 0.12, 'sawtooth', 0.07, 60)
    tone(90, 0.08, 'square', 0.04)
    noiseBurst(0.08, 0.04)
  } else if (kind === 'warn') {
    tone(300, 0.05, 'square', 0.05, 200)
  } else if (kind === 'exploit') {
    tone(220, 0.08, 'sawtooth', 0.08, 110)
    tone(440, 0.12, 'square', 0.07, 880)
    tone(660, 0.14, 'triangle', 0.06, 1320)
    noiseBurst(0.1, 0.055)
  } else if (kind === 'stack') {
    tone(500 + multiPitch * 40, 0.04, 'triangle', 0.045, 700)
  } else {
    tone(480, 0.045, 'square', 0.05)
  }
}

export function consumeSimEvents(events: number): void {
  if (events & SimEvent.Plant) beep('plant')
  if (events & SimEvent.Prune) beep('prune')
  if (events & SimEvent.Dash) beep('dash')
  if (events & SimEvent.Kill) {
    beep('kill')
    multiPitch = Math.max(0, multiPitch)
  }
  if (events & SimEvent.MultiKill) beep('multi')
  if (events & SimEvent.LevelUp) {
    multiPitch = 0
    beep('level')
  }
  if (events & SimEvent.Die) {
    multiPitch = 0
    beep('die')
  }
  if (events & SimEvent.Win) {
    multiPitch = 0
    beep('win')
  }
  if (events & SimEvent.StoryAdvance) beep('story')
  if (events & SimEvent.SynergyForm) beep('synergyForm')
  else if (events & SimEvent.Synergy) beep('synergy')
  if (events & SimEvent.Overheat) beep('overheat')
  if (events & SimEvent.Exploit) {
    multiPitch = 0
    beep('exploit')
  }
  if (events & SimEvent.ExploitStack) beep('stack')
}
