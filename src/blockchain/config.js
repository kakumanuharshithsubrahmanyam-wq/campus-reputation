export {
  CAMPUS_TOKEN_ADDRESS,
  CAMPUS_BADGE_ADDRESS,
  TOKEN_ABI,
  BADGE_ABI,
  BRONZE_IPFS_URI,
  SILVER_IPFS_URI,
  GOLD_IPFS_URI,
} from '../../config.js'

export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 11155111)
export const SEPOLIA_HEX = '0xaa36a7'

export const AWARD_REASONS = [
  'Attendance',
  'Participation',
  'Volunteering',
  'Workshop Completed',
  'Competition Winner',
]

export const ON_CHAIN_BADGES = [
  { type: 'BRONZE', label: 'Bronze Scholar', min: 100, uriKey: 'BRONZE_IPFS_URI', emoji: '🥉' },
  { type: 'SILVER', label: 'Silver Scholar', min: 300, uriKey: 'SILVER_IPFS_URI', emoji: '🥈' },
  { type: 'GOLD', label: 'Gold Scholar', min: 500, uriKey: 'GOLD_IPFS_URI', emoji: '🥇' },
]
