import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useWallet } from './WalletContext.jsx'
import { getStudent } from '../services/students.js'
import { fetchTokenState } from '../blockchain/tokenReads.js'

const CampusDataContext = createContext(null)

export function CampusDataProvider({ children }) {
  const { account, isConnected } = useWallet()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!account) {
      setData(null)
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await getStudent(account)
      setData(result)
    } catch (e) {
      try {
        const chain = await fetchTokenState(account)
        setData({
          walletAddress: account,
          profile: null,
          onChainName: chain.onChainName,
          campBalance: chain.balance,
          reputationLevel: chain.level,
          badges: {},
          achievementCount: 0,
          rank: null,
          apiOffline: true,
        })
        setError('Campus API unavailable — showing on-chain balance only.')
      } catch {
        setError(e.message || 'Could not load campus data')
        setData(null)
      }
    } finally {
      setLoading(false)
    }
  }, [account])

  useEffect(() => {
    if (isConnected) refresh()
    else setData(null)
  }, [isConnected, account, refresh])

  const value = useMemo(() => ({
    data,
    loading,
    error,
    refresh,
    score: data?.campBalance ?? 0,
    level: data?.reputationLevel ?? 'Newcomer',
    rank: data?.rank,
    profile: data?.profile,
    badges: data?.badges ?? {},
    achievementCount: data?.achievementCount ?? 0,
  }), [data, loading, error, refresh])

  return <CampusDataContext.Provider value={value}>{children}</CampusDataContext.Provider>
}

export function useCampusData() {
  return useContext(CampusDataContext)
}
