import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authStyles } from '../styles/auth'

export default function ForgotPassword() {
  const [email, setEmail]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]         = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // Always show success regardless of whether the email exists
      setSubmitted(true)
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

          {submitted ? (
            <div>
              <div className="auth-success">
                If an account exists with that email address, a reset link is on its way.
              </div>
              <p className="auth-muted" style={{ marginBottom: 20 }}>
                The link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
              <Link to="/login" className="auth-link" style={{ display: 'block', textAlign: 'center' }}>
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-title">Reset Password</div>
              <p className="auth-muted" style={{ marginBottom: 24 }}>
                Enter your account email and we'll send a reset link.
              </p>
              {error && <div className="auth-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    required
                    autoComplete="email"
                  />
                </div>
                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <div className="auth-footer">
                <Link to="/login">← Back to Sign In</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
