import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { authStyles } from '../styles/auth'

export default function AuthConfirm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying') // verifying | success | error

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash')
    const type      = searchParams.get('type') // 'signup' | 'recovery'

    if (!tokenHash || !type) {
      setStatus('error')
      return
    }

    supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      .then(({ error }) => {
        if (error) {
          setStatus('error')
        } else {
          setStatus('success')
          setTimeout(() => navigate('/'), 2500)
        }
      })
  }, [])

  return (
    <>
      <style>{authStyles}</style>
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo">Dram Scout</div>
          <div className="auth-tagline">Community Bourbon Intelligence</div>

          {status === 'verifying' && (
            <p className="auth-muted" style={{ marginTop: 24 }}>
              Verifying your email...
            </p>
          )}

          {status === 'success' && (
            <div className="auth-success" style={{ marginTop: 24 }}>
              Email confirmed. Welcome to Dram Scout. Redirecting...
            </div>
          )}

          {status === 'error' && (
            <div style={{ marginTop: 24 }}>
              <div className="auth-error">
                This confirmation link is invalid or has already been used.
              </div>
              <button
                className="auth-btn"
                style={{ marginTop: 16 }}
                onClick={() => navigate('/login')}
              >
                Go to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
