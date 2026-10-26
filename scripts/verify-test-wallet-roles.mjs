/**
 * Read-only Sepolia check: compares expected test roles vs authorizedTeachers()/owner().
 * Not imported by the app — run manually: node scripts/verify-test-wallet-roles.mjs
 */
import { Contract, JsonRpcProvider, getAddress } from 'ethers'
import { CAMPUS_TOKEN_ADDRESS, TOKEN_ABI } from '../config.js'

const WALLETS = {
  Bhavana: { address: '0x8B4e61B525376Cd9e85f7B846453610e963c1eC7', expected: 'Teacher' },
  Akhil: { address: '0x5cdCDb9B9869F53eBBCDB22Cb7e80fB915D0093C', expected: 'Teacher' },
  Subbu: { address: '0x2Ab4d7C729E2F6937D40be3CBf346fd1e8592Fc1', expected: 'Teacher' },
  Sakshi: { address: '0xFd14a15D308627804a9044e12088838F47A45d2e', expected: 'Student' },
  Satvika: { address: '0xF8CF0cDD71Ae7032bB52FDA88B91e98a03d068ED', expected: 'Student' },
  Jashwanth: { address: '0xc4cBd1734F69899aAdcc77527a0b5801F95F816E', expected: 'Student' },
}

const rpc = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
const provider = new JsonRpcProvider(rpc)
const token = new Contract(CAMPUS_TOKEN_ADDRESS, TOKEN_ABI, provider)

const owner = getAddress(await token.owner())
console.log('CAMP contract owner:', owner)
console.log('---')

let mismatches = 0
for (const [label, { address, expected }] of Object.entries(WALLETS)) {
  const w = getAddress(address)
  const authorized = await token.authorizedTeachers(w)
  const isOwner = owner === w
  let role = 'Student'
  if (isOwner) role = 'Owner'
  else if (authorized) role = 'Teacher'

  const teacherMismatch = expected === 'Teacher' && !authorized && !isOwner
  const studentMismatch = expected === 'Student' && (authorized || isOwner)
  if (teacherMismatch || studentMismatch) mismatches += 1

  console.log(`${label}: ${w}`)
  console.log(`  expected: ${expected}`)
  console.log(`  contract: ${role} (authorizedTeachers=${authorized}, owner=${isOwner})`)
  if (teacherMismatch) {
    console.log('  >>> Expected Teacher but deployed contract currently reports unauthorized.')
  }
  if (studentMismatch) {
    console.log('  >>> Expected Student but contract reports Teacher and/or Owner privileges.')
  }
}

process.exit(mismatches > 0 ? 1 : 0)
