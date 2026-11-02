import { readFileSync } from 'node:fs'
import { verifyReplay, type ReplayLog } from '../src/sim/replayVerify'
import { parseDifficulty } from '../src/sim/difficulty'

function usage(): never {
  console.error('Usage: npm run verify-replay -- <file.json>')
  console.error('JSON: { seed, difficulty, inputs?: number[], cmds?: {tick,bits}[], claimedStats }')
  process.exit(2)
}

function main() {
  const file = process.argv[2]
  if (!file) usage()
  const raw = JSON.parse(readFileSync(file, 'utf8')) as ReplayLog & { difficulty?: number | string }
  if (typeof raw.difficulty === 'string') {
    raw.difficulty = parseDifficulty(raw.difficulty)
  }
  const result = verifyReplay(raw)
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) {
    console.error('VERIFY FAIL', result.mismatches.join('; '))
    process.exit(1)
  }
  console.error('VERIFY OK')
}

main()
