import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabase.js'
import QRCode from 'qrcode'

const styles = `
  .cashier-root {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 60vh;
    padding: 0;
  }

  .cashier-program-selector {
    width: 100%;
    max-width: 560px;
    margin-bottom: 32px;
  }

  .cashier-select-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
    display: block;
  }

  .cashier-select {
    width: 100%;
    background: var(--dark-4);
    border: 1px solid var(--bark);
    border-radius: 4px;
    color: var(--cream);
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    padding: 14px 16px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .cashier-select:focus { border-color: var(--amber); }

  .cashier-generate-btn {
    background: var(--amber);
    color: var(--dark);
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    border: none;
    border-radius: 6px;
    padding: 20px 48px;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
  }

  .cashier-generate-btn:hover { opacity: 0.88; transform: scale(1.02); }
  .cashier-generate-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .cashier-qr-panel {
    background: var(--dark-2);
    border: 1px solid var(--bark);
    border-radius: 12px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
    max-width: 480px;
    margin-top: 24px;
  }

  .cashier-ticket-label {
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--muted);
    text-align: center;
  }

  .cashier-bottle-name {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--cream);
    text-align: center;
  }

  .cashier-qr-canvas {
    border-radius: 8px;
    background: #fff;
    padding: 16px;
  }

  .cashier-expiry {
    font-size: 28px;
    font-weight: 500;
    color: var(--amber-light);
    letter-spacing: 2px;
    min-width: 80px;
    text-align: center;
    font-family: 'DM Mono', monospace;
  }

  .cashier-expiry.cashier-urgent { color: #e06060; }

  .cashier-expiry-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    text-align: center;
  }

  .cashier-status-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11px;
    letter-spacing: 2px;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
  }

  .cashier-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--muted);
    animation: cashier-blink 1.2s infinite;
  }

  @keyframes cashier-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }

  .cashier-confirmed {
    background: rgba(45, 90, 39, 0.3);
    border: 1px solid var(--green-light);
    border-radius: 8px;
    padding: 28px 40px;
    text-align: center;
    width: 100%;
    max-width: 480px;
    margin-top: 24px;
  }

  .cashier-confirmed-check {
    font-size: 40px;
    margin-bottom: 12px;
  }

  .cashier-confirmed-label {
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--green-light);
    margin-bottom: 6px;
    font-family: 'DM Mono', monospace;
  }

  .cashier-confirmed-detail {
    font-size: 12px;
    color: var(--cream-2);
    font-family: 'DM Mono', monospace;
  }

  .cashier-again-btn {
    background: none;
    border: 1px solid var(--bark);
    border-radius: 4px;
    color: var(--cream-2);
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 12px 24px;
    cursor: pointer;
    margin-top: 20px;
    transition: border-color 0.2s, color 0.2s;
  }

  .cashier-again-btn:hover { border-color: var(--amber); color: var(--amber); }

  .cashier-no-program {
    color: var(--muted);
    font-size: 12px;
    letter-spacing: 1px;
    text-align: center;
    padding: 60px 0;
    line-height: 2;
    font-family: 'DM Mono', monospace;
  }
`

export default function StoreCashier({ storeProfile }) {
  const [programs, setPrograms] = useState([])
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [qrState, setQrState] = useState(null)  // null | { url, token, expiresAt, bottleName } | 'confirmed'
  const [confirmedInfo, setConfirmedInfo] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const canvasRef = useRef(null)
  const realtimeRef = useRef(null)
  const timerRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    supabase
      .from('lottery_programs')
      .select('id, bottle_name, draw_date, status')
      .in('status', ['active', 'upcoming'])
      .order('draw_date', { ascending: true })
      .then(({ data }) => {
        setPrograms(data || [])
        if (data && data.length > 0) setSelectedProgramId(data[0].id)
      })
  }, [])

  useEffect(() => {
    if (qrState && qrState !== 'confirmed' && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrState.url, {
        width: 240,
        margin: 2,
        color: { dark: '#0D0A07', light: '#FFFFFF' }
      })
    }
  }, [qrState])

  useEffect(() => {
    if (!qrState || qrState === 'confirmed') return
    timerRef.current = setInterval(() => {
      const secs = Math.max(0, Math.floor((new Date(qrState.expiresAt) - new Date()) / 1000))
      setTimeLeft(secs)
      if (secs === 0) {
        clearInterval(timerRef.current)
        setQrState(null)
        cleanupRealtime()
      }
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [qrState])

  function cleanupRealtime() {
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current)
      realtimeRef.current = null
    }
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function handleClaimed(ticketNumber) {
    clearInterval(timerRef.current)
    clearInterval(pollRef.current)
    pollRef.current = null
    setConfirmedInfo({ ticketNumber })
    setQrState('confirmed')
    cleanupRealtime()
  }

  async function handleGenerate() {
    if (!selectedProgramId) return
    setGenerating(true)
    cleanupRealtime()

    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/lottery/generate-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ program_id: selectedProgramId })
    })

    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Failed to generate token')
      setGenerating(false)
      return
    }

    const selectedProgram = programs.find(p => p.id === selectedProgramId)

    setQrState({
      url: data.claim_url,
      token: data.token,
      expiresAt: data.expires_at,
      bottleName: selectedProgram?.bottle_name || 'Allocated Bottle'
    })

    const token = data.token

    // Primary: Supabase Realtime — fires instantly when the token is claimed.
    // Requires migration 008 (REPLICA IDENTITY FULL + publication).
    const channel = supabase
      .channel(`token-${token}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'lottery_tokens',
        filter: `token=eq.${token}`
      }, (payload) => {
        if (payload.new.status === 'claimed') {
          handleClaimed(payload.new.ticket_number)
        }
      })
      .subscribe()

    realtimeRef.current = channel

    // Fallback: poll every 3 s in case the realtime event is missed.
    // Uses store_own_tokens RLS — the store can SELECT their own tokens.
    pollRef.current = setInterval(async () => {
      const { data: row } = await supabase
        .from('lottery_tokens')
        .select('status, ticket_number')
        .eq('token', token)
        .single()
      if (row?.status === 'claimed') {
        handleClaimed(row.ticket_number)
      }
    }, 3000)

    setGenerating(false)
  }

  function handleReset() {
    setQrState(null)
    setConfirmedInfo(null)
    setTimeLeft(null)
    clearInterval(timerRef.current)
    cleanupRealtime()
  }

  function formatTime(secs) {
    if (secs === null) return '--:--'
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const selectedProgram = programs.find(p => p.id === selectedProgramId)

  return (
    <>
      <style>{styles}</style>
      <div className="cashier-root">

        {programs.length === 0 ? (
          <div className="cashier-no-program">
            No active lotteries.<br />
            Create one in the Lotteries tab first.
          </div>
        ) : (
          <>
            {!qrState && (
              <div className="cashier-program-selector">
                <span className="cashier-select-label">Select Lottery</span>
                <select
                  className="cashier-select"
                  value={selectedProgramId}
                  onChange={e => setSelectedProgramId(e.target.value)}
                >
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.bottle_name} — Draw {new Date(p.draw_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!qrState && (
              <button
                className="cashier-generate-btn"
                onClick={handleGenerate}
                disabled={generating || !selectedProgramId}
              >
                {generating ? 'Generating...' : 'Generate Ticket'}
              </button>
            )}

            {qrState && qrState !== 'confirmed' && (
              <div className="cashier-qr-panel">
                <span className="cashier-ticket-label">Scan to Enter Lottery</span>
                <span className="cashier-bottle-name">{qrState.bottleName}</span>
                <canvas ref={canvasRef} className="cashier-qr-canvas" />
                <div>
                  <div className={`cashier-expiry ${timeLeft !== null && timeLeft < 60 ? 'cashier-urgent' : ''}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="cashier-expiry-label">expires</div>
                </div>
                <div className="cashier-status-row">
                  <div className="cashier-status-dot" />
                  WAITING FOR SCAN
                </div>
                <button className="cashier-again-btn" onClick={handleReset}>
                  Cancel
                </button>
              </div>
            )}

            {qrState === 'confirmed' && confirmedInfo && (
              <div className="cashier-confirmed">
                <div className="cashier-confirmed-check">✓</div>
                <div className="cashier-confirmed-label">Ticket Issued</div>
                <div className="cashier-confirmed-detail">
                  Ticket #{confirmedInfo.ticketNumber} · {selectedProgram?.bottle_name}
                </div>
                <button className="cashier-again-btn" onClick={handleReset}>
                  Generate Another Ticket
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </>
  )
}
