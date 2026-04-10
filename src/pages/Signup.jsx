import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authStyles } from '../styles/auth'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '', displayName: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setSuccess(true)
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
            <div>
              <div className="auth-success">
                Account created. Check your email for a confirmation link before signing in.
              </div>
              <p className="auth-muted" style={{ marginBottom: 20 }}>
                Didn't get it? Check your spam folder, or{' '}
                <button
                  onClick={() => navigate('/login', { state: { email: form.email, resend: true } })}
                  style={{ background: 'none', border: 'none', color: '#E8A020', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Mono, monospace', padding: 0 }}
                >
                  resend the confirmation email.
                </button>
              </p>
              <button className="auth-btn" onClick={() => navigate('/login')}>
                Go to Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="auth-title">Create Account</div>
              {error && <div className="auth-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label>Display Name</label>
                  <input
                    name="displayName"
                    type="text"
                    placeholder="BourbonHunter_NC"
                    value={form.displayName}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
                <div className="auth-field">
                  <label>Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="auth-field">
                  <label>Password</label>
                  <input
                    name="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
              <div className="auth-footer">
                Already have an account? <Link to="/login">Sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
