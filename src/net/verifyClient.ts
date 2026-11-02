import type { ReplayLog } from '../sim/replayVerify'

const DEFAULT_URL = 'http://127.0.0.1:8787/verify'

export async function postReplayVerify(
  log: ReplayLog,
  url = DEFAULT_URL,
): Promise<{ ok: boolean; reason: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    })
    const data = (await res.json()) as { ok: boolean; reason?: string }
    return { ok: !!data.ok, reason: data.reason || (data.ok ? 'match' : 'fail') }
  } catch {
    return { ok: false, reason: 'server_unreachable' }
  }
}
