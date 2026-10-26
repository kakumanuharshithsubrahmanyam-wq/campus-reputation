import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useWallet } from './WalletContext.jsx'
import {
  clearAuth,
  fetchNonce,
  getStoredAuthAddress,
  getStoredToken,
  saveAuth,
  verifySignature,
} from '../services/auth.js'
import { sameAddress } from '../utils/address.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { account } = useWallet()
  const [token, setToken] = useState(() => getStoredToken())
  const [authAddress, setAuthAddress] = useState(() => getStoredAuthAddress())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const authenticated =
    Boolean(token) &&
    Boolean(account) &&
    sameAddress(authAddress, account)

  const signIn = useCallback(async () => {
    if (!account || !window.ethereum) return
    setLoading(true)
    setError('')
    try {
      const { message } = await fetchNonce(account)
      const provider = await import('../blockchain/contracts.js').then((m) => m.getBrowserProvider())
      const signer = await provider.getSigner()
      const signature = await signer.signMessage(message)
      const result = await verifySignature(account, signature)
      saveAuth(result.token, result.address)
      setToken(result.token)
      setAuthAddress(result.address.toLowerCase())
    } catch (e) {
      setError(e.message || 'Authentication failed')
      clearAuth()
      setToken(null)
      setAuthAddress(null)
    } finally {
      setLoading(false)
    }
  }, [account])

  const signOut = useCallback(() => {
    clearAuth()
    setToken(null)
    setAuthAddress(null)
  }, [])

  const value = useMemo(() => ({
    authenticated,
    loading,
    error,
    signIn,
    signOut,
    token,
  }), [authenticated, loading, error, signIn, signOut, token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
