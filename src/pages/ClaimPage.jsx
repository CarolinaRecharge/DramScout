import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase.js'

const styles = `
  .claim-root {
    min-height: 100vh;
    background: #0D0A07;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 32px 20px 48px;
    font-family: 'DM Mono', monospace;
    color: #F2E8D5;
  }

  .claim-wordmark {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 900;
    color: #C8820A;
    letter-spacing: -0.5px;
    margin-bottom: 32px;
    text-align: center;
  }

  .claim-card {
    background: #1A1208;
    border: 1px solid #3D2B10;
    border-radius: 12px;
    padding: 32px 28px;
    width: 100%;
    max-width: 400px;
  }

  .claim-tag {
    font-size: 8px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #8A7660;
    margin-bottom: 10px;
    display: block;
  }

  .claim-bottle-name {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    font-weight: 700;
    color: #F2E8D5;
    line-height: 1.15;
    margin-bottom: 6px;
  }

  .claim-store-info {
    font-size: 11px;
    color: #8A7660;
    margin-bottom: 4px;
  }

  .claim-draw-info {
    font-size: 11px;
    color: #E8D9BE;
    margin-bottom: 24px;
    padding-top: 12px;
    border-top: 1px solid #3D2B10;
    margin-top: 12px;
  }

  .claim-divider {
    border: none;
    border-top: 1px solid #3D2B10;
    margin: 24px 0;
  }

  .claim-section-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #8A7660;
    margin-bottom: 16px;
  }

  .claim-auth-btn {
    width: 100%;
    background: #C8820A;
    color: #0D0A07;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    border: none;
    border-radius: 6px;
    padding: 16px;
    cursor: pointer;
    transition: opacity 0.2s;
    margin-bottom: 12px;
  }

  .claim-auth-btn:hover { opacity: 0.88; }
  .claim-auth-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .claim-auth-btn-outline {
    width: 100%;
    background: none;
    color: #E8D9BE;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    border: 1px solid #3D2B10;
    border-radius: 6px;
    padding: 16px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    margin-bottom: 12px;
  }

  .claim-auth-btn-outline:hover { border-color: #C8820A; color: #C8820A; }

  .claim-or {
    text-align: center;
    font-size: 10px;
    color: #8A7660;
    letter-spacing: 2px;
    margin: 4px 0 16px;
  }

  .claim-phone-input {
    width: 100%;
    background: #2E2214;
    border: 1px solid #3D2B10;
    border-radius: 6px;
    color: #F2E8D5;
    font-family: 'DM Mono', monospace;
    font-size: 16px;
    padding: 14px 16px;
    outline: none;
    transition: border-color 0.2s;
    margin-bottom: 12px;
    letter-spacing: 1px;
  }

  .claim-phone-input:focus { border-color: #C8820A; }

  .claim-phone-note {
    font-size: 10px;
    color: #8A7660;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .claim-error {
    background: rgba(139, 46, 46, 0.2);
    border: 1px solid #8B2E2E;
    border-radius: 6px;
    color: #e06060;
    font-size: 11px;
    padding: 12px 16px;
    margin-bottom: 16px;
    line-height: 1.5;
  }

  /* Success state */
  .claim-success-card {
    background: #1A1208;
    border: 1px solid #2D5A27;
    border-radius: 12px;
    padding: 40px 28px;
    width: 100%;
    max-width: 400px;
    text-align: center;
  }

  .claim-success-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .claim-success-label {
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #5cb85c;
    margin-bottom: 12px;
  }

  .claim-ticket-number {
    font-family: 'Playfair Display', serif;
    font-size: 48px;
    font-weight: 900;
    color: #C8820A;
    line-height: 1;
    margin-bottom: 8px;
  }

  .claim-ticket-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #8A7660;
    margin-bottom: 24px;
  }

  .claim-success-detail {
    font-size: 12px;
    color: #E8D9BE;
    line-height: 1.7;
    margin-bottom: 24px;
  }

  .claim-success-entries {
    font-size: 14px;
    font-weight: 500;
    color: #C8820A;
    margin-bottom: 4px;
  }

  .claim-cta {
    background: none;
    border: 1px solid #C8820A;
    border-radius: 6px;
    color: #C8820A;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 12px 24px;
    cursor: pointer;
    width: 100%;
    transition: background 0.2s;
    margin-top: 8px;
    text-decoration: none;
    display: block;
    text-align: center;
  }

  .claim-cta:hover { background: rgba(200, 130, 10, 0.1); }

  /* Error / expired states */
  .claim-state-card {
    background: #1A1208;
    border: 1px solid #3D2B10;
    border-radius: 12px;
    padding: 48px 28px;
    width: 100%;
    max-width: 400px;
    text-align: center;
  }

  .claim-state-icon { font-size: 40px; margin-bottom: 16px; }

  .claim-state-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    color: #E8D9BE;
    margin-bottom: 10px;
  }

  .claim-state-body {
    font-size: 12px;
    color: #8A7660;
    line-height: 1.7;
  }

  .claim-loading {
    color: #8A7660;
    font-size: 11px;
    letter-spacing: 3px;
    margin-top: 80px;
  }
`

export default function ClaimPage() {
  const { token } = useParams()
  const [phase, setPhase] = useState('loading') // loading|valid|invalid|expired|claimed|claiming|success
  const [tokenInfo, setTokenInfo] = useState(null)
  const [phone, setPhone] = useState('')
  const [showPhone, setShowPhone] = useState(false)
  const [ticketResult, setTicketResult] = useState(null)
  const [error, setError] = useState(null)
  const [autoClaiming, setAutoClaiming] = useState(false)

  useEffect(() => {
    async function init() {
      // Check if returning from OAuth — try auto-claim if session exists
      const { data: { session } } = await supabase.auth.getSession()
      const pendingToken = sessionStorage.getItem('ds_claim_token')

      if (session && pendingToken === token) {
        sessionStorage.removeItem('ds_claim_token')
        setAutoClaiming(true)
        await validateToken()
        await claimWithAuth(session.access_token)
        return
      }

      await validateToken()
    }
    init()
  }, [token])

  async function validateToken() {
    const res = await fetch(`/api/lottery/claim/${token}`)
    if (res.status === 404) { setPhase('invalid'); return }
    if (res.status === 410) { setPhase('expired'); return }
    if (res.status === 409) { setPhase('claimed'); return }
    if (!res.ok) { setPhase('invalid'); return }

    const data = await res.json()
    setTokenInfo(data)
    setPhase('valid')
    setAutoClaiming(false)
  }

  async function claimWithAuth(accessToken) {
    setPhase('claiming')
    setError(null)

    const res = await fetch(`/api/lottery/claim/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const data = await res.json()

    if (res.status === 409 && data.error === 'already_claimed') { setPhase('claimed'); return }
    if (res.status === 410) { setPhase('expired'); return }
    if (!res.ok) {
      setError(data.error || 'Something went wrong. Please try again.')
      setPhase('valid')
      return
    }

    setTicketResult(data)
    setPhase('success')
  }

  async function handleGoogleSignIn() {
    sessionStorage.setItem('ds_claim_token', token)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href }
    })
  }

  async function handlePhoneClaim() {
    if (!phone.trim()) return
    setPhase('claiming')
    setError(null)

    const res = await fetch(`/api/lottery/claim/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim() })
    })

    const data = await res.json()

    if (res.status === 409 && data.error === 'already_claimed') { setPhase('claimed'); return }
    if (res.status === 410) { setPhase('expired'); return }
    if (!res.ok) {
      setError(data.error || 'Something went wrong. Please try again.')
      setPhase('valid')
      return
    }

    setTicketResult(data)
    setPhase('success')
  }

  async function handleClaimWithAccount() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await claimWithAuth(session.access_token)
    } else {
      handleGoogleSignIn()
    }
  }

  function formatDate(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const program = tokenInfo?.program

  return (
    <>
      <style>{styles}</style>
      <div className="claim-root">
        <div className="claim-wordmark">Dram Scout</div>

        {(phase === 'loading' || autoClaiming) && (
          <div className="claim-loading">
            {autoClaiming ? 'CLAIMING TICKET...' : 'LOADING...'}
          </div>
        )}

        {phase === 'claiming' && !autoClaiming && (
          <div className="claim-loading">CLAIMING TICKET...</div>
        )}

        {phase === 'invalid' && (
          <div className="claim-state-card">
            <div className="claim-state-icon">✗</div>
            <div className="claim-state-title">Invalid Ticket</div>
            <div className="claim-state-body">
              This QR code is not valid. Ask the cashier to generate a new ticket.
            </div>
          </div>
        )}

        {phase === 'expired' && (
          <div className="claim-state-card">
            <div className="claim-state-icon">⏱</div>
            <div className="claim-state-title">Ticket Expired</div>
            <div className="claim-state-body">
              This QR code has expired (tickets are valid for 15 minutes).
              Ask the cashier to generate a new ticket.
            </div>
          </div>
        )}

        {phase === 'claimed' && (
          <div className="claim-state-card">
            <div className="claim-state-icon">✓</div>
            <div className="claim-state-title">Already Claimed</div>
            <div className="claim-state-body">
              This ticket has already been used. Each QR code can only be
              claimed once.
            </div>
          </div>
        )}

        {phase === 'valid' && program && (
          <div className="claim-card">
            <span className="claim-tag">Lottery Entry</span>
            <div className="claim-bottle-name">{program.bottle_name}</div>
            {program.store_profiles && (
              <div className="claim-store-info">
                {program.store_profiles.store_name}
                {program.store_profiles.store_number && ` · ABC #${program.store_profiles.store_number}`}
                {program.store_profiles.county && `, ${program.store_profiles.county} County`}
              </div>
            )}
            {program.description && (
              <div className="claim-store-info" style={{ color: '#E8D9BE', marginTop: 4 }}>
                {program.description}
              </div>
            )}
            <div className="claim-draw-info">
              Draw: {formatDate(program.draw_date)} · {program.draw_winner_count} winner{program.draw_winner_count > 1 ? 's' : ''}
            </div>

            {error && <div className="claim-error">{error}</div>}

            <div className="claim-section-label">Claim your entry</div>

            <button className="claim-auth-btn" onClick={handleClaimWithAccount}>
              Sign in with Google
            </button>

            <div className="claim-or">— or —</div>

            {!showPhone ? (
              <button className="claim-auth-btn-outline" onClick={() => setShowPhone(true)}>
                Enter as Guest
              </button>
            ) : (
              <>
                <input
                  className="claim-phone-input"
                  type="tel"
                  placeholder="(919) 555-0123"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePhoneClaim()}
                  autoFocus
                />
                <div className="claim-phone-note">
                  Your phone number is used only to notify you if you win.
                </div>
                <button
                  className="claim-auth-btn"
                  onClick={handlePhoneClaim}
                  disabled={!phone.trim()}
                >
                  Claim Entry
                </button>
                <button
                  className="claim-auth-btn-outline"
                  onClick={() => setShowPhone(false)}
                  style={{ marginTop: 0 }}
                >
                  Back
                </button>
              </>
            )}
          </div>
        )}

        {phase === 'success' && ticketResult && program && (
          <div className="claim-success-card">
            <div className="claim-success-icon">🥃</div>
            <div className="claim-success-label">You're In!</div>
            <div className="claim-ticket-number">#{ticketResult.ticket_number}</div>
            <div className="claim-ticket-label">Your Ticket Number</div>
            <div className="claim-success-detail">
              <strong style={{ color: '#F2E8D5', fontFamily: "'Playfair Display', serif", fontSize: 16 }}>
                {program.bottle_name}
              </strong><br />
              {program.store_profiles?.store_name}<br />
              Draw: {formatDate(program.draw_date)}
            </div>
            {ticketResult.total_entries > 1 && (
              <div className="claim-success-entries">
                {ticketResult.total_entries} entries in this drawing
              </div>
            )}
            <a href="/" className="claim-cta">
              Track entries in Dram Scout
            </a>
          </div>
        )}

      </div>
    </>
  )
}
