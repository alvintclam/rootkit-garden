import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST = new URL('../dist/', import.meta.url)
const BUDGET = 150 * 1024

async function main() {
  const root = DIST.pathname
  let html = ''
  try {
    html = await readFile(join(root, 'index.html'), 'utf8')
  } catch {
    console.error('check:size fail — run build first (dist/index.html missing)')
    process.exit(1)
  }
  const jsMatch = html.match(/src="([^"]+\.js)"/)
  const cssMatch = html.match(/href="([^"]+\.css)"/)
  if (!jsMatch) {
    console.error('check:size fail — no entry script in index.html')
    process.exit(1)
  }
  const entryJs = join(root, jsMatch[1].replace(/^\//, ''))
  const parts = [join(root, 'index.html'), entryJs]
  if (cssMatch) parts.push(join(root, cssMatch[1].replace(/^\//, '')))

  let total = 0
  for (const p of parts) {
    const buf = await readFile(p)
    const gz = gzipSync(buf, { level: 9 })
    total += gz.length
    console.log(`${p.replace(root, 'dist/')}  raw=${buf.length}  gzip=${gz.length}`)
  }
  console.log(`first-download gzip total=${total}  budget=${BUDGET}`)
  if (total > BUDGET) {
    console.error('check:size FAIL')
    process.exit(1)
  }
  console.log('check:size OK')
}

main()
