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
  | 'hud.controls'
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

const EN: Record<StringKey, string> = {
  title: 'Rootkit Garden',
  subtitle: 'Malware Flower Garden',
  'menu.tip': 'Plant flowers. They shoot. Prune to reclaim. Survive.',
  'menu.start': 'Enter — start   L — language   [ — difficulty',
  'menu.controls': 'WASD move · Space dash · E plant · Q prune · R cycle seed',
  'menu.lang': 'Language',
  'menu.diff': 'Difficulty',
  'diff.easy': 'Easy',
  'diff.normal': 'Normal',
  'diff.hard': 'Hard',
  'diff.nightmare': 'Nightmare',
  'story.1': 'Press E to plant a malware flower at your feet.',
  'story.2': 'Flowers auto-fire at nearby antivirus drones.',
  'story.3': 'Press Q to prune a flower and reclaim the bed.',
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
  'hud.controls': 'WASD move  Space dash  E/click plant  Q prune  Esc pause',
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
}

const ZH: Record<StringKey, string> = {
  title: '惡意程式花園',
  subtitle: 'Rootkit Garden',
  'menu.tip': '種花。花會射擊。修剪回收空位。活下去。',
  'menu.start': 'Enter 開始   L 語言   [ 難度',
  'menu.controls': 'WASD 移動 · Space 衝刺 · E 種植 · Q 修剪 · R 切換種子',
  'menu.lang': '語言',
  'menu.diff': '難度',
  'diff.easy': '簡單',
  'diff.normal': '普通',
  'diff.hard': '困難',
  'diff.nightmare': '惡夢',
  'story.1': '按 E 在腳下種下一朵惡意程式花。',
  'story.2': '花朵會自動攻擊靠近的防毒無人機。',
  'story.3': '按 Q 修剪最近的花，騰出花床。',
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
  'hud.controls': 'WASD 移動  Space 衝刺  E/點擊 種植  Q 修剪  Esc 暫停',
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
}

const TABLES: Record<LocaleId, Record<StringKey, string>> = {
  en: EN,
  'zh-Hant': ZH,
}

const ORDER: LocaleId[] = ['en', 'zh-Hant']

let locale: LocaleId = 'en'

export function detectLocale(tag?: string): LocaleId {
  const raw = (tag || (typeof navigator !== 'undefined' ? navigator.language : 'en')).toLowerCase()
  if (raw.startsWith('zh')) return 'zh-Hant'
  return 'en'
}

export function setLocale(id: LocaleId): void {
  locale = id
}

export function getLocale(): LocaleId {
  return locale
}

export function cycleLocale(): LocaleId {
  const i = ORDER.indexOf(locale)
  locale = ORDER[(i + 1) % ORDER.length]
  return locale
}

export function t(key: StringKey): string {
  return TABLES[locale][key] || TABLES.en[key] || key
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
