import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authStyles } from '../styles/auth'

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { supabase } = useAuth()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm]           = useState({ email: location.state?.email || '', password: '' })
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [showResend, setShowResend] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  // If navigated here with resend: true (from Signup success screen), show the option upfront
  useEffect(() => {
    if (location.state?.resend && form.email) setShowResend(true)
  }, [])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setShowResend(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Sign in failed. Please try again.')
        if (data.code === 'EMAIL_NOT_CONFIRMED') setShowResend(true)
        return
      }

      // Hydrate the supabase client session so AuthContext picks it up via onAuthStateChange
      await supabase.auth.setSession({
        access_token:  data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      navigate(from, { replace: true })
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!form.email) {
      setError('Enter your email address above, then click resend.')
      return
    }
    try {
      await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })
      setResendSent(true)
      setShowResend(false)
      setError('')
    } catch {
      // Silently fail — the message is always ambiguous on purpose
      setResendSent(true)
    }
  }

  return (
    <>
      <style>{authStyles}</style>
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">Dram Scout</div>
          <div className="auth-tagline">Community Bourbon Intelligence</div>
          <div className="auth-title">Sign In</div>

          {resendSent && (
            <div className="auth-success">
              Confirmation email resent. Check your inbox.
            </div>
          )}

          {error && (
            <div className="auth-error">
              {error}
              {showResend && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={handleResend}
                    style={{ background: 'none', border: 'none', color: '#E8A020', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Mono, monospace', padding: 0, textDecoration: 'underline' }}
                  >
                    Resend confirmation email
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Link to="/forgot-password" className="auth-link" style={{ color: '#8A7660' }}>
                Forgot password?
              </Link>
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Create one</Link>
          </div>
        </div>
      </div>
    </>
  )
}
