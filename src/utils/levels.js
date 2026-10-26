/** On-chain reputation tiers (from existing contract UI behavior) */
const THRESHOLDS = [
  { level: 'Gold', min: 500 },
  { level: 'Silver', min: 300 },
  { level: 'Bronze', min: 100 },
  { level: 'Newcomer', min: 0 },
]

export function progressToNextLevel(balance, level) {
  const b = Number(balance) || 0
  if (level === 'Gold' || b >= 500) {
    return { pct: 100, label: 'Maximum on-chain level reached (Gold)', next: null }
  }
  if (level === 'Silver' || b >= 300) {
    const pct = ((b - 300) / 200) * 100
    return { pct: Math.min(pct, 100), label: `${b} / 500 CAMP to Gold`, next: 'Gold' }
  }
  if (level === 'Bronze' || b >= 100) {
    const pct = ((b - 100) / 200) * 100
    return { pct: Math.min(pct, 100), label: `${b} / 300 CAMP to Silver`, next: 'Silver' }
  }
  const pct = (b / 100) * 100
  return { pct: Math.min(pct, 100), label: `${b} / 100 CAMP to Bronze`, next: 'Bronze' }
}

export function levelTone(level) {
  if (level === 'Gold') return 'gold'
  if (level === 'Silver') return ''
  if (level === 'Bronze') return ''
  return ''
}
