import { useState } from 'react'
import { useWallet } from '../context/WalletContext.jsx'
import { useCampusData } from '../context/CampusDataContext.jsx'
import { registerStudent } from '../blockchain/transactions.js'
import { Button, Card } from './ui.jsx'

export default function RegisterGate({ children }) {
  const { canWrite, onChainName, refreshRole, account } = useWallet()
  const { refresh } = useCampusData()
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  if (onChainName?.trim()) return children

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Enter your name to register on Campus Reputation.')
      return
    }
    if (!canWrite) {
      setError('Connect MetaMask on Sepolia to register.')
      return
    }
    setPending(true)
    setError('')
    try {
      await registerStudent(name.trim())
      await refreshRole(account)
      await refresh()
    } catch (err) {
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setError('Registration cancelled in MetaMask.')
      } else {
        setError(err.reason || err.message || 'Registration failed')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="page">
      <Card style={{ maxWidth: 520, margin: '32px auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Complete your Campus Reputation profile</h2>
        <p className="sec sm" style={{ marginBottom: 20 }}>
          Register your wallet on Sepolia so faculty can award CAMP Score and your achievements can be indexed.
        </p>
        <form className="stack" onSubmit={submit}>
          <div className="field">
            <label htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="As you want it shown on your record"
            />
          </div>
          {error && <p className="err-text" role="alert">{error}</p>}
          <Button variant="primary" type="submit" disabled={pending}>
            {pending ? 'Waiting for MetaMask…' : 'Register on Campus Reputation'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
