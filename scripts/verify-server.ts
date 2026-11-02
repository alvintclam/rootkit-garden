import { createServer } from 'node:http'
import { verifyReplay, type ReplayLog } from '../src/sim/replayVerify'
import { parseDifficulty } from '../src/sim/difficulty'

const PORT = Number(process.env.PORT || 8787)

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, service: 'rootkit-garden-verify', port: PORT }))
    return
  }
  if (req.method === 'POST' && (req.url === '/verify' || req.url?.startsWith('/verify?'))) {
    const chunks: Buffer[] = []
    for await (const c of req) chunks.push(c as Buffer)
    try {
      const raw = JSON.parse(Buffer.concat(chunks).toString('utf8')) as ReplayLog & {
        difficulty?: number | string
      }
      if (typeof raw.difficulty === 'string') raw.difficulty = parseDifficulty(raw.difficulty)
      const result = verifyReplay(raw)
      res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          ok: result.ok,
          reason: result.ok ? 'match' : result.mismatches.join('; '),
          actual: result.actual,
          claimed: result.claimed,
        }),
      )
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, reason: e instanceof Error ? e.message : 'bad_json' }))
    }
    return
  }
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: false, reason: 'not_found' }))
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`verify-server listening on http://127.0.0.1:${PORT}/verify`)
})
