import { Contract, BrowserProvider } from 'ethers'
import {
  CAMPUS_TOKEN_ADDRESS,
  CAMPUS_BADGE_ADDRESS,
  TOKEN_ABI,
  BADGE_ABI,
} from './config.js'

export function getBrowserProvider() {
  if (!window.ethereum) throw new Error('MetaMask is required')
  return new BrowserProvider(window.ethereum)
}

export async function getSigner() {
  const provider = getBrowserProvider()
  return provider.getSigner()
}

export async function getTokenContract(signerOrProvider) {
  const runner = signerOrProvider || (await getSigner())
  return new Contract(CAMPUS_TOKEN_ADDRESS, TOKEN_ABI, runner)
}

export async function getBadgeContract(signerOrProvider) {
  const runner = signerOrProvider || (await getSigner())
  return new Contract(CAMPUS_BADGE_ADDRESS, BADGE_ABI, runner)
}

export async function readChainId() {
  const provider = getBrowserProvider()
  const net = await provider.getNetwork()
  return Number(net.chainId)
}
