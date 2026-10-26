import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CHAIN_ID, SEPOLIA_HEX } from '../blockchain/config.js'
import { readChainId } from '../blockchain/contracts.js'
import { fetchRoles, fetchTokenState } from '../blockchain/tokenReads.js'
import { clearAuth } from '../services/auth.js'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [chainId, setChainId] = useState(null)
  const [isTeacher, setIsTeacher] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [onChainName, setOnChainName] = useState('')
  const [error, setError] = useState('')
  const hasMetaMask = typeof window !== 'undefined' && Boolean(window.ethereum)

  const isSepolia = chainId === CHAIN_ID
  const isConnected = Boolean(account)

  const refreshRole = useCallback(async (addr) => {
    if (!addr) {
      setIsTeacher(false)
      setIsOwner(false)
      setOnChainName('')
      setRolesLoading(false)
      return
    }
    setRolesLoading(true)
    try {
      const [roles, token] = await Promise.all([fetchRoles(addr), fetchTokenState(addr)])
      setIsTeacher(roles.isTeacher)
      setIsOwner(roles.isOwner)
      setOnChainName(token.onChainName)
    } catch {
      setIsTeacher(false)
      setIsOwner(false)
    } finally {
      setRolesLoading(false)
    }
  }, [])

  const syncChain = useCallback(async () => {
    if (!hasMetaMask) return
    try {
      const id = await readChainId()
      setChainId(id)
    } catch {
      setChainId(null)
    }
  }, [hasMetaMask])

  const connectWallet = useCallback(async () => {
    if (!hasMetaMask) {
      setError('MetaMask is required to perform blockchain actions.')
      return
    }
    setIsConnecting(true)
    setError('')
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const provider = await import('../blockchain/contracts.js').then((m) => m.getBrowserProvider())
      const signer = await provider.getSigner()
      const addr = (await signer.getAddress()).toLowerCase()
      setAccount(addr)
      await syncChain()
      await refreshRole(addr)
    } catch (e) {
      setError(e.message || 'Connection failed')
    } finally {
      setIsConnecting(false)
    }
  }, [hasMetaMask, refreshRole, syncChain])

  const switchToSepolia = useCallback(async () => {
    if (!hasMetaMask) return
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_HEX }],
      })
      await syncChain()
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_HEX,
            chainName: 'Sepolia',
            nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        })
        await syncChain()
      } else {
        setError(e.message || 'Could not switch network')
      }
    }
  }, [hasMetaMask, syncChain])

  const disconnectLocal = useCallback(() => {
    setAccount(null)
    setIsTeacher(false)
    setIsOwner(false)
    setOnChainName('')
    clearAuth()
  }, [])

  useEffect(() => {
    if (!hasMetaMask) return
    syncChain()

    const onAccounts = (accounts) => {
      const next = accounts[0]?.toLowerCase() || null
      setAccount(next)
      clearAuth()
      setIsTeacher(false)
      setIsOwner(false)
      setOnChainName('')
      if (next) refreshRole(next)
    }
    const onChain = () => syncChain()

    window.ethereum.on('accountsChanged', onAccounts)
    window.ethereum.on('chainChanged', onChain)
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccounts)
      window.ethereum.removeListener('chainChanged', onChain)
    }
  }, [hasMetaMask, refreshRole, syncChain])

  useEffect(() => {
    if (!hasMetaMask || account) return
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts[0]) {
        const addr = accounts[0].toLowerCase()
        setAccount(addr)
        refreshRole(addr)
      }
    }).catch(() => {})
  }, [hasMetaMask, account, refreshRole])

  const value = useMemo(() => ({
    account,
    isConnected,
    isConnecting,
    chainId,
    isSepolia,
    hasMetaMask,
    isTeacher,
    isOwner,
    rolesLoading,
    onChainName,
    error,
    connectWallet,
    disconnectLocal,
    switchToSepolia,
    refreshRole,
    canWrite: isConnected && isSepolia,
  }), [
    account, isConnected, isConnecting, chainId, isSepolia, hasMetaMask,
    isTeacher, isOwner, rolesLoading, onChainName, error, connectWallet, disconnectLocal,
    switchToSepolia, refreshRole,
  ])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
