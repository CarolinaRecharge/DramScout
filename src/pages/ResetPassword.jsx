import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authStyles } from '../styles/auth'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm]         = useState({ password: '', confirm: '' })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [tokenValid, setTokenValid] = useState(true)

  const tokenHash = searchParams.get('token_hash')
  const type      = searchParams.get('type') // 'recovery'

  useEffect(() => {
    if (!tokenHash || type !== 'recovery') {
      setTokenValid(false)
      setError('This reset link is invalid. Please request a new one.')
    }
  }, [tokenHash, type])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_hash: tokenHash, new_password: form.password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Reset failed. The link may have expired.')
        return
      }

      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{authStyles}</style>
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">Dram Scout</div>
          <div className="auth-tagline">Community Bourbon Intelligence</div>

          {success ? (
            <div className="auth-success">
              Password updated. Redirecting to sign in...
            </div>
          ) : !tokenValid ? (
            <div>
              <div className="auth-error">{error}</div>
              <Link to="/forgot-password" className="auth-btn" style={{ marginTop: 16 }}>
                Request New Link
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-title">Set New Password</div>
              {error && <div className="auth-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="auth-field">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={form.confirm}
                    onChange={(e) => setForm(prev => ({ ...prev, confirm: e.target.value }))}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}
