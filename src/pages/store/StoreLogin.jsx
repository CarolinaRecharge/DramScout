import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabase.js'
import './store-vars.css'

const styles = `
  .store-login-root {
    min-height: 100vh;
    background: var(--dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Mono', monospace;
    padding: 24px;
  }

  .login-card {
    background: var(--dark-2);
    border: 1px solid var(--bark);
    border-radius: 4px;
    padding: 48px 40px;
    width: 100%;
    max-width: 380px;
  }

  .login-wordmark {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 900;
    color: var(--amber);
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }

  .login-mode-label {
    font-size: 9px;
    letter-spacing: 4px;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 40px;
  }

  .login-field-label {
    display: block;
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }

  .login-input {
    width: 100%;
    background: var(--dark-4);
    border: 1px solid var(--bark);
    border-radius: 3px;
    color: var(--cream);
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    padding: 12px 14px;
    margin-bottom: 20px;
    outline: none;
    transition: border-color 0.2s;
  }

  .login-input:focus { border-color: var(--amber); }

  .login-btn {
    width: 100%;
    background: var(--amber);
    color: var(--dark);
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    border: none;
    border-radius: 3px;
    padding: 14px;
    cursor: pointer;
    transition: opacity 0.2s;
    margin-top: 8px;
  }

  .login-btn:hover { opacity: 0.88; }
  .login-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .login-error {
    background: rgba(139, 46, 46, 0.2);
    border: 1px solid var(--red);
    border-radius: 3px;
    color: #e06060;
    font-size: 11px;
    padding: 10px 14px;
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .login-divider {
    border: none;
    border-top: 1px solid var(--bark);
    margin: 28px 0;
  }

  .login-note {
    font-size: 10px;
    color: var(--muted);
    line-height: 1.6;
    text-align: center;
  }
`

export default function StoreLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  async function handleLogin() {
    setLoading(true)
    setError(null)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })

    if (signInError) {
      setError('Invalid credentials. Contact Dram Scout support if you need access.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('store_profiles')
      .select('is_active, store_name')
      .eq('id', data.user.id)
      .single()

    if (!profile || !profile.is_active) {
      await supabase.auth.signOut()
      setError('This account does not have store portal access.')
      setLoading(false)
      return
    }

    navigate('/store')
  }

  return (
    <div className="store-root">
      <style>{styles}</style>
      <div className="store-login-root">
        <div className="login-card">
          <div className="login-wordmark">Dram Scout</div>
          <div className="login-mode-label">Store Portal</div>

          {(error || params.get('error')) && (
            <div className="login-error">
              {error || 'You do not have access to the store portal.'}
            </div>
          )}

          <label className="login-field-label">Email</label>
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoComplete="username"
            placeholder="store@abcboard.nc.gov"
          />

          <label className="login-field-label">Password</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoComplete="current-password"
          />

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={loading || !email || !password}
          >
            {loading ? 'Signing In...' : 'Sign In to Store Portal'}
          </button>

          <hr className="login-divider" />

          <p className="login-note">
            Store portal access is provisioned by Dram Scout.<br />
            Customer? <a href="/" style={{ color: 'var(--amber)' }}>Return to app</a>
          </p>
        </div>
      </div>
    </div>
  )
}
