# Rootkit Garden · 惡意程式花園

Playful hacker-garden arena: plant malware flowers that auto-attack antivirus drones, prune, dash, and draft upgrade cards between waves.

## Run

```bash
npm install
npm run dev
```

Click the canvas for keyboard focus.

```bash
npm run build
npm run check:size
npm run check:hot
npm test
npm run bot
npm run tune
npm run perf
npm run verify-replay -- fixtures/sample-replay.json
npm run verify-server
npm run atlas
npm run tla:fetch
npm run tla:check
```

## Script matrix

| Script | Purpose |
| --- | --- |
| `dev` / `build` / `preview` | Vite app |
| `check:size` | gzip ≤ 150 KB first download |
| `check:hot` | no `new` / object literals in `*.hot.*` |
| `test` | RNG, replay, state/TLA edges, verify-replay |
| `bot` / `tune` | headless dumb policy survival stats |
| `perf` | Node stress: 400 enemies, ms/tick p50/p95 |
| `verify-replay` | CLI re-sim of JSON run log |
| `verify-server` | local POST `/verify` on `:8787` |
| `atlas` / `prebuild` | pack code sprites → `atlas.gen.ts` |
| `tla:fetch` / `tla:check` | download jar + TLC (bundled JRE under `tools/jre`) |

## Controls

| Input | Action |
| --- | --- |
| WASD / arrows | Move |
| Space | Dash |
| E / left click | Plant |
| Q | Prune |
| R / Tab | Cycle seed |
| 1 / 2 / 3 | Level-up pick |
| Esc / P | Pause / skip story |
| Enter | Start / next / restart |
| L | Language `en` ↔ `zh-Hant` |
| `[` / `-` | Difficulty Easy → Normal → Hard → Nightmare |
| F | Toggle FPS / live counts |
| C | Result: download share PNG |
| V | Result: POST replay to `http://127.0.0.1:8787/verify` |

## Perf (mobile 60fps proxy)

Pure Node sim stress (no browser):

```bash
npm run perf -- --enemies 400 --seconds 3 --flowers 12
npm run perf -- --enemies 500 --seconds 2
```

Target: **p95 ms/tick ≪ 16.67ms** (full-frame 60fps budget). This measures sim only; render/audio add cost on device.

Pools: enemies / projectiles / particles use preallocated SoA + free-list stacks (`src/sim/pools.ts`), caps 512 / 512 / 384.

## Verify server (offline anti-cheat stand-in)

```bash
npm run verify-server
# other terminal:
curl -s -X POST http://127.0.0.1:8787/verify -H 'content-type: application/json' --data @fixtures/sample-replay.json
```

In-game Result: press **V** when the server is up (`src/net/verifyClient.ts`).

## TLA+

```bash
npm run tla:fetch
npm run tla:check   # uses tools/jre/bin/java + tools/tla2tools.jar
```

Spec `spec/garden_phases.tla` matches `PHASE_EDGE_NAMES`; Node tests enforce 1:1 parity even without TLC.


## Content (polish)

- Flowers: Packet, Wormvine, Payload, **Slowfield** (aura slow), **Buckshot Bud** (3-pellet)
- Mid-run **Rootkit Sentinel** boss at t=60s (telegraph + pulse ring)
- Eggs: seed `1337` title tease; konami-lite `↑↑↓↓`; prune streak ×7 ritual heal
- Biome labels/colors by pressure (render-only)

## Constraints

- Deterministic sim + input frame log + verify
- Hot path `sim.hot.ts`; no WebAudio in sim
- gzip ≤ 150 KB; no binary audio/image assets
- Chip synth procedural; atlas packed at build
- Phases: Menu → Story → Run → Pause → LevelUp → Result
- Difficulties: Easy / Normal / Hard / Nightmare

## Measured size

**First-download gzip (content polish): ~15.06 KB** (budget 150 KB).

| Asset | gzip |
| --- | --- |
| `dist/index.html` | ~639 B |
| entry JS | ~14418 B |
| **total** | **~15057 B** |


Re-run `npm run build && npm run check:size` after changes.

## Perf sample (box)

`npm run perf -- --enemies 400 --seconds 3` → p95 ≈ **0.51ms**/tick (budget 16.67ms).  
`npm run perf -- --enemies 500 --seconds 2` → p95 ≈ **0.52ms**/tick.

## Remaining vs public tibo-class site

Hosted verify CDN · real device mobile 60fps capture · account/leaderboard · richer wave music + mixer UI · CDN OG images · production deploy/CI TLC gate.
