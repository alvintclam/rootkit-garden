import { createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { join } from 'node:path'

const outDir = new URL('../tools/', import.meta.url).pathname
const jar = join(outDir, 'tla2tools.jar')
const url = 'https://github.com/tlaplus/tlaplus/releases/download/v1.8.0/tla2tools.jar'

async function main() {
  mkdirSync(outDir, { recursive: true })
  if (existsSync(jar)) {
    console.log('tla2tools.jar already present')
    return
  }
  console.log('fetching', url)
  const res = await fetch(url)
  if (!res.ok || !res.body) {
    console.error('fetch failed', res.status)
    process.exit(1)
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(jar))
  console.log('wrote', jar)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
