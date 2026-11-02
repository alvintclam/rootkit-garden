export type LocaleId = 'en' | 'zh-Hant'

export type StringKey =
  | 'title'
  | 'subtitle'
  | 'menu.tip'
  | 'menu.start'
  | 'menu.controls'
  | 'menu.lang'
  | 'menu.diff'
  | 'diff.easy'
  | 'diff.normal'
  | 'diff.hard'
  | 'diff.nightmare'
  | 'story.1'
  | 'story.2'
  | 'story.3'
  | 'story.next'
  | 'story.skip'
  | 'pause'
  | 'pause.resume'
  | 'levelup'
  | 'result.win'
  | 'result.lose'
  | 'result.wiped'
  | 'result.survived'
  | 'result.restart'
  | 'result.share'
  | 'result.verify'
  | 'result.stats'
  | 'hud.controls'
  | 'hud.wave'
  | 'hud.seed'
  | 'hud.kills'
  | 'hud.time'
  | 'menu.touch'
  | 'touch.plant'
  | 'touch.prune'
  | 'touch.dash'
  | 'touch.inject'
  | 'touch.cycle'
  | 'touch.pause'
  | 'touch.move'
  | 'touch.confirm'
  | 'touch.lang'
  | 'touch.diff'
  | 'flower.packet'
  | 'flower.wormvine'
  | 'flower.payload'
  | 'flower.slowfield'
  | 'flower.buckshot'
  | 'biome.calm'
  | 'biome.stir'
  | 'biome.siege'
  | 'biome.sentinel'
  | 'egg.seed'
  | 'egg.konami'
  | 'share.empty'
  | 'share.loadout'
  | 'share.tag'
  | 'share.footer'
  | 'og.desc'
  | 'up.0.t'
  | 'up.0.b'
  | 'up.1.t'
  | 'up.1.b'
  | 'up.2.t'
  | 'up.2.b'
  | 'up.3.t'
  | 'up.3.b'
  | 'up.4.t'
  | 'up.4.b'
  | 'up.5.t'
  | 'up.5.b'
  | 'up.6.t'
  | 'up.6.b'
  | 'up.7.t'
  | 'up.7.b'
  | 'up.8.t'
  | 'up.8.b'
  | 'up.9.t'
  | 'up.9.b'
  | 'up.10.t'
  | 'up.10.b'
  | 'up.11.t'
  | 'up.11.b'
  | 'up.12.t'
  | 'up.12.b'
  | 'up.13.t'
  | 'up.13.b'
  | 'up.14.t'
  | 'up.14.b'
  | 'up.15.t'
  | 'up.15.b'
  | 'up.16.t'
  | 'up.16.b'
  | 'story.4'
  | 'story.5'
  | 'hud.exploit'
  | 'hud.heat'
  | 'tip.synergy'
  | 'tip.inject'
  | 'wave.calm'
  | 'wave.surge'
  | 'wave.layout'
  | 'wave.escalate'
  | 'hud.layout'
  | 'call.triple'
  | 'call.penta'
  | 'call.link'
  | 'call.exploit'
  | 'call.inject'

const EN: Record<StringKey, string> = {
  title: 'Rootkit Garden',
  subtitle: 'Malware Flower Garden',
  'menu.tip': 'Link flowers. Inject aimed volleys. Ride wave Surges & Re-layout windows.',
  'menu.start': 'Enter — start   L — language   [ — difficulty',
  'menu.controls': 'WASD move · Space dash · Shift/F Inject · E plant · Q prune · R cycle',
  'menu.touch': 'Touch: left drag move · right buttons plant/prune/dash/cycle',
  'menu.lang': 'Language',
  'menu.diff': 'Difficulty',
  'diff.easy': 'Easy',
  'diff.normal': 'Normal',
  'diff.hard': 'Hard',
  'diff.nightmare': 'Nightmare',
  'story.1': 'Press E to plant a malware flower at your feet.',
  'story.2': 'Edge flowers link: Wormvine chains, Packet swarms, Slowfield buffs neighbors.',
  'story.3': 'Firing builds heat — prune to dump neighbor heat before overclock silence.',
  'story.4': 'Plant → Dash → Prune stacks Exploit. At 5, the garden bursts.',
  'story.5': 'Hold aim with stick, tap Inject (Shift/F) to fire a manual volley — spends Exploit or cooldown.',
  'story.next': 'Enter — next',
  'story.skip': 'Esc — skip tutorial',
  pause: 'Paused',
  'pause.resume': 'Esc — resume',
  levelup: 'Level Up — pick a card',
  'result.win': 'Garden Holds',
  'result.lose': 'Scan Complete',
  'result.wiped': 'Garden wiped',
  'result.survived': 'Survived the scan window',
  'result.restart': 'Enter — restart with new seed',
  'result.share': 'C — download / copy share card',
  'result.verify': 'V — POST replay to localhost:8787/verify',
  'result.stats': 'time {s}s · kills {k} · lv {l}',
  'hud.controls': 'WASD / left-stick  Space/dash btn  E/plant  Q/prune  Esc/pause',
  'hud.wave': 'Wave',
  'hud.seed': 'seed',
  'hud.kills': 'kills',
  'hud.time': 'time',
  'touch.plant': 'Plant',
  'touch.prune': 'Prune',
  'touch.dash': 'Dash',
  'touch.inject': 'Inject',
  'touch.cycle': 'Seed',
  'touch.pause': '||',
  'touch.move': 'MOVE',
  'touch.confirm': 'Tap / Enter',
  'touch.lang': 'Lang',
  'touch.diff': 'Diff',
  'flower.packet': 'Packet Bloom',
  'flower.wormvine': 'Wormvine',
  'flower.payload': 'Payload Bloom',
  'flower.slowfield': 'Slowfield',
  'flower.buckshot': 'Buckshot Bud',
  'biome.calm': 'Biome: Quiet garden',
  'biome.stir': 'Biome: Packet storm',
  'biome.siege': 'Biome: Scan siege',
  'biome.sentinel': 'Biome: Sentinel inbound',
  'egg.seed': 'seed 1337 whispers…',
  'egg.konami': 'rootkit code accepted',
  'share.empty': 'empty bed',
  'share.loadout': 'loadout',
  'share.tag': 'portrait',
  'share.footer': 'portrait phone · share card',
  'og.desc': 'Plant malware flowers. They shoot. Prune to reclaim. Survive. Portrait phone game.',
  'up.0.t': 'Wormvine Seed',
  'up.0.b': 'Unlock rapid Wormvine flowers',
  'up.1.t': 'Payload Seed',
  'up.1.b': 'Unlock long-range Payload blooms',
  'up.2.t': 'Overclock Petals',
  'up.2.b': '+20% flower fire rate',
  'up.3.t': 'Payload Boost',
  'up.3.b': '+25% flower damage',
  'up.4.t': 'Wide Canopy',
  'up.4.b': '+15% flower range',
  'up.5.t': 'Garden Beds',
  'up.5.b': '+2 max flowers',
  'up.6.t': 'Kernel Sprint',
  'up.6.b': 'Faster dash recharge',
  'up.7.t': 'Prune Ritual',
  'up.7.b': 'Pruning restores 8 HP',
  'up.8.t': 'Root Runner',
  'up.8.b': '+12% move speed',
  'up.9.t': 'Hardened Soil',
  'up.9.b': '+25 max HP and heal',
  'up.10.t': 'Slowfield Seed',
  'up.10.b': 'Unlock Slowfield aura flower',
  'up.11.t': 'Buckshot Seed',
  'up.11.b': 'Unlock Buckshot spread flower',
  'up.12.t': 'Synergy Range',
  'up.12.b': 'Amplify adjacency link effects',
  'up.13.t': 'Heat Sink',
  'up.13.b': 'Less heat gain; prune dumps more',
  'up.14.t': 'Exploit Window',
  'up.14.b': 'Longer combo window for Exploit',
  'up.15.t': 'Colony Strength',
  'up.15.b': 'Stronger 3+ cluster Root colony',
  'up.16.t': 'Coolant Dash',
  'up.16.b': 'Dash vents more flower heat',
  'hud.exploit': 'Exploit',
  'hud.heat': 'HEAT',
  'tip.synergy': 'Link flowers · manage heat · chase Exploit',
  'call.triple': 'TRIPLE!!',
  'call.penta': 'OVERCLOCK x5!!',
  'call.link': 'LINKED!',
  'call.exploit': 'EXPLOIT BURST!!',
  'call.inject': 'INJECT!!',
  'tip.inject': 'Inject: aimed volley (Shift/F)',
  'wave.calm': 'Calm',
  'wave.surge': 'Surge',
  'wave.layout': 'Re-layout',
  'wave.escalate': 'Escalate',
  'hud.layout': 'RE-LAYOUT — move beds!',
}




const ZH: Record<StringKey, string> = {
  title: '惡意程式花園',
  subtitle: 'Rootkit Garden',
  'menu.tip': '連花。Inject 瞄準齊射。抓湧浪／重新佈局節拍。',
  'menu.start': 'Enter 開始   L 語言   [ 難度',
  'menu.controls': 'WASD 移動 · Space 衝刺 · Shift/F 注入 · E 種植 · Q 修剪 · R 換種',
  'menu.touch': '觸控：左半拖曳移動 · 右側按鈕 種/剪/衝/換種',
  'menu.lang': '語言',
  'menu.diff': '難度',
  'diff.easy': '簡單',
  'diff.normal': '普通',
  'diff.hard': '困難',
  'diff.nightmare': '惡夢',
  'story.1': '按 E 在腳下種下一朵惡意程式花。',
  'story.2': '鄰接連花：蠕蟲藤連鎖、封包成群、緩速場強化鄰居。',
  'story.3': '射擊會囤過熱——修剪可幫鄰居散熱，避免過熱沉默。',
  'story.4': '種→衝→剪疊 Exploit。滿 5 層花園齊射爆發。',
  'story.5': '用搖桿瞄準，按 Inject（Shift／F）手動齊射——消耗 Exploit 或冷卻。',
  'story.next': 'Enter — 下一步',
  'story.skip': 'Esc — 跳過教學',
  pause: '暫停',
  'pause.resume': 'Esc — 繼續',
  levelup: '升級 — 選一張卡',
  'result.win': '花園守住了',
  'result.lose': '掃描結束',
  'result.wiped': '花園被清空',
  'result.survived': '撐過掃描時窗',
  'result.restart': 'Enter — 用新種子重開',
  'result.share': 'C — 下載／複製分享圖',
  'result.verify': 'V — 上傳回放至 localhost:8787/verify',
  'result.stats': '時間 {s}秒 · 擊殺 {k} · 等級 {l}',
  'hud.controls': 'WASD／左搖桿  Space／衝刺鈕  E／種植  Q／修剪  Esc／暫停',
  'hud.wave': '波次',
  'hud.seed': '種子',
  'hud.kills': '擊殺',
  'hud.time': '時間',
  'touch.plant': '種植',
  'touch.prune': '修剪',
  'touch.dash': '衝刺',
  'touch.inject': '注入',
  'touch.cycle': '換種',
  'touch.pause': '||',
  'touch.move': '移動',
  'touch.confirm': '點擊／Enter',
  'touch.lang': '語言',
  'touch.diff': '難度',
  'flower.packet': '封包花',
  'flower.wormvine': '蠕蟲藤',
  'flower.payload': '酬載花',
  'flower.slowfield': '緩速場',
  'flower.buckshot': '散彈芽',
  'biome.calm': '生態：靜謐花園',
  'biome.stir': '生態：封包風暴',
  'biome.siege': '生態：掃描圍城',
  'biome.sentinel': '生態：哨兵逼近',
  'egg.seed': '種子 1337 在低語…',
  'egg.konami': 'rootkit 密語已接受',
  'share.empty': '空花床',
  'share.loadout': '配置',
  'share.tag': '直屏',
  'share.footer': '直屏手遊 · 分享卡',
  'og.desc': '種下惡意程式花。花會射擊。修剪回收空位。活下去。直屏手遊。',
  'up.0.t': '蠕蟲藤種子',
  'up.0.b': '解鎖快速蠕蟲藤',
  'up.1.t': '酬載種子',
  'up.1.b': '解鎖遠距酬載花',
  'up.2.t': '花瓣超頻',
  'up.2.b': '射速 +20%',
  'up.3.t': '酬載強化',
  'up.3.b': '傷害 +25%',
  'up.4.t': '寬闊樹冠',
  'up.4.b': '射程 +15%',
  'up.5.t': '擴充花床',
  'up.5.b': '最大花朵 +2',
  'up.6.t': '核心衝刺',
  'up.6.b': '衝刺冷卻更快',
  'up.7.t': '修剪儀式',
  'up.7.b': '修剪回復 8 HP',
  'up.8.t': '根系跑者',
  'up.8.b': '移動速度 +12%',
  'up.9.t': '硬化土壤',
  'up.9.b': '最大 HP +25 並回滿',
  'up.10.t': '緩速場種子',
  'up.10.b': '解鎖緩速場光環花',
  'up.11.t': '散彈種子',
  'up.11.b': '解鎖散彈散射花',
  'up.12.t': '連花增幅',
  'up.12.b': '強化鄰接連花效果',
  'up.13.t': '散熱根系',
  'up.13.b': '過熱較慢；修剪多洩熱',
  'up.14.t': 'Exploit 視窗',
  'up.14.b': '延長 Exploit 連段時間',
  'up.15.t': '菌落強化',
  'up.15.b': '強化三朵同種菌落光環',
  'up.16.t': '冷卻衝刺',
  'up.16.b': '衝刺額外帶走花朵熱量',
  'hud.exploit': 'Exploit',
  'hud.heat': '過熱',
  'tip.synergy': '連花 · 管過熱 · 追 Exploit',
  'call.triple': '三連擊!!',
  'call.penta': '過熱五連!!',
  'call.link': '連花成立!',
  'call.exploit': 'EXPLOIT 爆發!!',
  'call.inject': '注入!!',
  'tip.inject': '注入：手動瞄準齊射（Shift／F）',
  'wave.calm': '平靜',
  'wave.surge': '湧浪',
  'wave.layout': '重新佈局',
  'wave.escalate': '升級壓制',
  'hud.layout': '重新佈局 — 快移花床！',
}




const TABLES: Record<LocaleId, Record<StringKey, string>> = {
  en: EN,
  'zh-Hant': ZH,
}

const ORDER: LocaleId[] = ['zh-Hant', 'en']

/** Product default: Traditional Chinese (HK Cantonese UI preference). */
let locale: LocaleId = 'zh-Hant'

function syncDocumentLang(id: LocaleId): void {
  if (typeof document === 'undefined') return
  document.documentElement.lang = id === 'zh-Hant' ? 'zh-Hant' : 'en'
  const desc = t('og.desc')
  const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
  if (metaDesc) metaDesc.content = desc
  const ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null
  if (ogDesc) ogDesc.content = desc
  const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null
  if (ogTitle && !ogTitle.content.includes('seed')) {
    ogTitle.content = `${t('title')} · ${id === 'zh-Hant' ? 'Rootkit Garden' : t('subtitle')}`
  }
  if (!document.title.includes('seed')) {
    document.title = `${t('title')} · ${id === 'zh-Hant' ? 'Rootkit Garden' : '惡意程式花園'}`
  }
}

/**
 * Prefer zh-Hant for zh-HK / zh-TW / zh-Hant / any zh*.
 * Prefer en for clear English tags. Otherwise product default zh-Hant.
 */
export function detectLocale(tag?: string): LocaleId {
  const candidates: string[] = []
  if (tag) candidates.push(tag)
  else if (typeof navigator !== 'undefined') {
    if (navigator.language) candidates.push(navigator.language)
    const langs = navigator.languages
    if (langs) for (let i = 0; i < langs.length; i++) candidates.push(langs[i])
  }
  let sawEn = false
  for (let i = 0; i < candidates.length; i++) {
    const raw = (candidates[i] || '').toLowerCase()
    if (!raw) continue
    if (
      raw.startsWith('zh-hk') ||
      raw.startsWith('zh-tw') ||
      raw.startsWith('zh-hant') ||
      raw.startsWith('zh-mo') ||
      raw === 'zh' ||
      raw.startsWith('zh-')
    ) {
      return 'zh-Hant'
    }
    if (raw.startsWith('en')) sawEn = true
  }
  if (sawEn) return 'en'
  return 'zh-Hant'
}

export function setLocale(id: LocaleId): void {
  locale = id
  syncDocumentLang(id)
}

export function getLocale(): LocaleId {
  return locale
}

export function cycleLocale(): LocaleId {
  const i = ORDER.indexOf(locale)
  locale = ORDER[(i + 1) % ORDER.length]
  syncDocumentLang(locale)
  return locale
}

export function t(key: StringKey): string {
  return TABLES[locale][key] || TABLES.en[key] || key
}

export function tf(key: StringKey, vars: Record<string, string | number>): string {
  let s = t(key)
  for (const k of Object.keys(vars)) {
    s = s.split('{' + k + '}').join(String(vars[k]))
  }
  return s
}

export function upgradeTitle(id: number): string {
  return t(('up.' + id + '.t') as StringKey)
}

export function upgradeBlurb(id: number): string {
  return t(('up.' + id + '.b') as StringKey)
}

export function flowerName(kind: number): string {
  if (kind === 1) return t('flower.wormvine')
  if (kind === 2) return t('flower.payload')
  if (kind === 3) return t('flower.slowfield')
  if (kind === 4) return t('flower.buckshot')
  return t('flower.packet')
}

export function biomeLabel(tier: number): string {
  if (tier >= 3) return t('biome.sentinel')
  if (tier === 2) return t('biome.siege')
  if (tier === 1) return t('biome.stir')
  return t('biome.calm')
}

export function diffName(id: number): string {
  if (id === 0) return t('diff.easy')
  if (id === 2) return t('diff.hard')
  if (id === 3) return t('diff.nightmare')
  return t('diff.normal')
}

/** Assert EN/ZH key parity (dev / build-time helper). */
export function assertLocaleParity(): string[] {
  const missing: string[] = []
  for (const k of Object.keys(EN) as StringKey[]) {
    if (!ZH[k]) missing.push('zh-Hant:' + k)
  }
  for (const k of Object.keys(ZH) as StringKey[]) {
    if (!EN[k]) missing.push('en:' + k)
  }
  return missing
}
