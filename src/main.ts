import { consumeSimEvents, setPressure, startMusic } from './audio/chip'
import { bindInput, pollBits } from './input/input'
import { cycleLocale, detectLocale, setLocale } from './i18n/strings'
import { postReplayVerify } from './net/verifyClient'
import { applyOgMeta, collectShareStats, downloadShareCard } from './render/shareCard'
import { renderFrame } from './render/render'
import { MAX_ENEMIES, TICK_HZ } from './sim/constants'
import { CmdBit, pushCmd } from './sim/inputCmd'
import { simTick } from './sim/sim.hot'
import { Phase } from './sim/state'
import { countAliveEnemies, createWorld } from './sim/world'

const canvas = document.getElementById('game') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
if (!ctx) throw new Error('canvas')

canvas.focus()
bindInput(canvas)
canvas.addEventListener('contextmenu', (e) => e.preventDefault())
setLocale(detectLocale())

const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0 || 1
const world = createWorld(seed)
let acc = 0
let last = performance.now()
const stepMs = 1000 / TICK_HZ
let audioStarted = false
let lastResultSeed = -1
let showFps = false
let fps = 60
let frames = 0
let fpsWindow = performance.now()
const uiKeys = new Set<string>()

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyC') uiKeys.add('C')
  if (e.code === 'KeyV') uiKeys.add('V')
  if (e.code === 'KeyF') {
    showFps = !showFps
    e.preventDefault()
  }
})

function frame(now: number): void {
  frames++
  if (now - fpsWindow >= 500) {
    fps = (frames * 1000) / (now - fpsWindow)
    frames = 0
    fpsWindow = now
  }
  const dt = Math.min(100, now - last)
  last = now
  acc += dt
  while (acc >= stepMs) {
    const bits = pollBits()
    if (bits & CmdBit.Lang) cycleLocale()
    if (!audioStarted && bits !== 0) {
      startMusic()
      audioStarted = true
    }
    if (
      world.phase === Phase.Run ||
      world.phase === Phase.LevelUp ||
      world.phase === Phase.Pause
    ) {
      world.inputFrames.push(bits)
      if (world.phase === Phase.Run) pushCmd(world.cmdLog, world.tick, bits)
    }
    simTick(world, bits)
    consumeSimEvents(world.events)
    if (world.phase === Phase.Result) {
      if (lastResultSeed !== world.seed) {
        lastResultSeed = world.seed
        applyOgMeta(collectShareStats(world))
      }
      if (uiKeys.has('C')) {
        uiKeys.delete('C')
        void downloadShareCard(collectShareStats(world))
      }
      if (uiKeys.has('V')) {
        uiKeys.delete('V')
        void postReplayVerify({
          seed: world.seed,
          difficulty: world.difficulty,
          inputs: world.inputFrames.slice(),
          claimedStats: {
            tick: world.tick,
            kills: world.killCount,
            level: world.level,
            survived: world.survived,
            hp: world.playerHp,
          },
        }).then((r) => {
          console.log('[verify]', r.ok, r.reason)
        })
      }
    } else {
      lastResultSeed = -1
      uiKeys.clear()
    }
    const enemies = countAliveEnemies(world)
    const pressure =
      world.phase === Phase.Run || world.phase === Phase.LevelUp
        ? Math.min(1, enemies / Math.max(8, MAX_ENEMIES * 0.25))
        : world.phase === Phase.Result && !world.survived
          ? 1
          : 0.05
    setPressure(pressure)
    acc -= stepMs
  }
  renderFrame(ctx!, world, fps, showFps)
  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
