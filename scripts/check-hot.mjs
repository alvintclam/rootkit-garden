import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const SRC = new URL('../src/', import.meta.url).pathname
const BAD_NEW = /\bnew\s+/
const BAD_OBJ = /(?<![\w$])\{(?![^\n]*=>)/

async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) await walk(p, out)
    else if (/\.hot\.(t|j)s$/.test(e.name)) out.push(p)
  }
  return out
}

async function main() {
  const files = await walk(SRC)
  if (files.length === 0) {
    console.error('check:hot fail — no *.hot.ts/js files found under src/')
    process.exit(1)
  }
  let failed = false
  for (const file of files) {
    const text = await readFile(file, 'utf8')
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('import ') || trimmed.startsWith('export type') || trimmed.startsWith('export {')) continue
      if (trimmed.startsWith('type ') || trimmed.startsWith('interface ')) continue
      if (BAD_NEW.test(line)) {
        console.error(`${file}:${i + 1}: forbidden 'new ' in hot path`)
        console.error('  ' + trimmed)
        failed = true
      }
      if (/[=,]\s*\{/.test(line) || /return\s*\{/.test(line) || /\(\s*\{/.test(line)) {
        if (!/import\s*\{/.test(line) && !/export\s*\{/.test(line) && !/from\s*\{/.test(line)) {
          console.error(`${file}:${i + 1}: forbidden object literal in hot path`)
          console.error('  ' + trimmed)
          failed = true
        }
      }
    }
  }
  if (failed) {
    console.error('check:hot FAIL')
    process.exit(1)
  }
  console.log(`check:hot OK (${files.length} file(s))`)
}

main()
