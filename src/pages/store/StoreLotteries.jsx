import { useEffect, useState } from 'react'
import { supabase } from '../../supabase.js'

const styles = `
  .lotteries-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  .lotteries-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--cream);
  }

  .lotteries-create-btn {
    background: var(--amber);
    color: var(--dark);
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    border: none;
    border-radius: 3px;
    padding: 12px 24px;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .lotteries-create-btn:hover { opacity: 0.88; }

  .lotteries-section-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 16px;
    margin-top: 32px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .lotteries-section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, var(--bark), transparent);
  }

  .program-card {
    background: var(--dark-3);
    border: 1px solid var(--bark);
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .program-card.program-active {
    border-color: var(--amber);
  }

  .program-card-main {
    flex: 1;
  }

  .program-bottle-name {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 4px;
  }

  .program-meta {
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.5px;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 6px;
  }

  .program-meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .program-status-badge {
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 2px;
    font-family: 'DM Mono', monospace;
    white-space: nowrap;
  }

  .badge-upcoming {
    background: rgba(138, 118, 96, 0.2);
    color: var(--muted);
    border: 1px solid var(--muted);
  }

  .badge-active {
    background: rgba(200, 130, 10, 0.2);
    color: var(--amber-light);
    border: 1px solid var(--amber);
  }

  .badge-drawn {
    background: rgba(45, 90, 39, 0.2);
    color: var(--green-light);
    border: 1px solid var(--green);
  }

  .badge-closed {
    background: rgba(61, 43, 16, 0.3);
    color: var(--muted);
    border: 1px solid var(--bark);
  }

  .program-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }

  .program-action-btn {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    border-radius: 3px;
    padding: 8px 16px;
    cursor: pointer;
    transition: opacity 0.2s;
    white-space: nowrap;
  }

  .btn-activate {
    background: none;
    color: var(--amber);
    border: 1px solid var(--amber);
  }

  .btn-activate:hover { background: rgba(200, 130, 10, 0.1); }

  .btn-draw {
    background: var(--amber);
    color: var(--dark);
    border: none;
    font-weight: 500;
  }

  .btn-draw:hover { opacity: 0.88; }
  .btn-draw:disabled { opacity: 0.4; cursor: not-allowed; }

  .program-entry-count {
    font-size: 28px;
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    color: var(--amber-pale);
    min-width: 60px;
    text-align: center;
  }

  .program-entry-label {
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    text-align: center;
  }

  .program-empty {
    background: var(--dark-3);
    border: 1px dashed var(--bark);
    border-radius: 8px;
    padding: 32px;
    text-align: center;
    color: var(--muted);
    font-size: 11px;
    letter-spacing: 1px;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .modal-box {
    background: var(--dark-2);
    border: 1px solid var(--bark);
    border-radius: 8px;
    padding: 40px;
    width: 100%;
    max-width: 480px;
  }

  .modal-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 28px;
  }

  .modal-field-label {
    display: block;
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
    margin-top: 16px;
  }

  .modal-field-label:first-of-type { margin-top: 0; }

  .modal-input, .modal-textarea, .modal-select {
    width: 100%;
    background: var(--dark-4);
    border: 1px solid var(--bark);
    border-radius: 3px;
    color: var(--cream);
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    padding: 10px 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  .modal-textarea {
    resize: vertical;
    min-height: 72px;
  }

  .modal-input:focus,
  .modal-textarea:focus,
  .modal-select:focus { border-color: var(--amber); }

  .modal-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 28px;
    justify-content: flex-end;
  }

  .modal-cancel-btn {
    background: none;
    border: 1px solid var(--bark);
    border-radius: 3px;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 10px 20px;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;
  }

  .modal-cancel-btn:hover { color: var(--cream); border-color: var(--cream); }

  .modal-submit-btn {
    background: var(--amber);
    color: var(--dark);
    border: none;
    border-radius: 3px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    padding: 10px 24px;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .modal-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .modal-submit-btn:hover:not(:disabled) { opacity: 0.88; }

  /* Draw result */
  .draw-result {
    background: rgba(45, 90, 39, 0.15);
    border: 1px solid var(--green);
    border-radius: 8px;
    padding: 20px 24px;
    margin-top: 12px;
  }

  .draw-result-title {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--green-light);
    margin-bottom: 12px;
  }

  .draw-winner-row {
    display: flex;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(45, 90, 39, 0.3);
    font-size: 12px;
    color: var(--cream-2);
  }

  .draw-winner-row:last-child { border-bottom: none; }

  .draw-ticket-num { color: var(--amber); min-width: 40px; }

  .lotteries-loading {
    color: var(--muted);
    font-size: 11px;
    letter-spacing: 2px;
    padding: 40px 0;
  }

  .confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    z-index: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .confirm-box {
    background: var(--dark-2);
    border: 1px solid var(--bark);
    border-radius: 8px;
    padding: 32px;
    width: 100%;
    max-width: 380px;
    text-align: center;
  }

  .confirm-title {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    color: var(--cream);
    margin-bottom: 12px;
  }

  .confirm-body {
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 24px;
    line-height: 1.6;
  }

  .confirm-actions { display: flex; gap: 12px; justify-content: center; }

  @keyframes draw-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .draw-spinning {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid var(--dark);
    border-top-color: transparent;
    border-radius: 50%;
    animation: draw-spin 0.7s linear infinite;
    vertical-align: middle;
    margin-right: 8px;
  }
`

const EMPTY_FORM = {
  bottle_name: '',
  description: '',
  draw_date: '',
  draw_winner_count: 1,
  bottle_count: 1
}

export default function StoreLotteries({ storeProfile }) {
  const [programs, setPrograms] = useState([])
  const [entryCounts, setEntryCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDrawId, setConfirmDrawId] = useState(null)
  const [drawingId, setDrawingId] = useState(null)
  const [drawResults, setDrawResults] = useState({}) // programId → winners[]

  async function loadPrograms() {
    const { data } = await supabase
      .from('lottery_programs')
      .select('*')
      .order('draw_date', { ascending: false })

    setPrograms(data || [])

    if (data && data.length > 0) {
      const counts = {}
      await Promise.all(data.map(async p => {
        const { count } = await supabase
          .from('lottery_tokens')
          .select('id', { count: 'exact', head: true })
          .eq('program_id', p.id)
          .eq('status', 'claimed')
        counts[p.id] = count || 0
      }))
      setEntryCounts(counts)
    }

    setLoading(false)
  }

  useEffect(() => { loadPrograms() }, [])

  async function handleCreate() {
    if (!form.bottle_name.trim() || !form.draw_date) return
    setCreating(true)

    const { data: { session } } = await supabase.auth.getSession()

    const { error } = await supabase.from('lottery_programs').insert({
      bottle_name: form.bottle_name.trim(),
      description: form.description.trim() || null,
      draw_date: new Date(form.draw_date).toISOString(),
      draw_winner_count: Number(form.draw_winner_count),
      bottle_count: Number(form.bottle_count),
      store_id: session.user.id,
      status: 'upcoming'
    })

    if (!error) {
      setShowCreateModal(false)
      setForm(EMPTY_FORM)
      await loadPrograms()
    }
    setCreating(false)
  }

  async function handleActivate(programId) {
    await supabase
      .from('lottery_programs')
      .update({ status: 'active' })
      .eq('id', programId)
    await loadPrograms()
  }

  async function handleDraw(programId) {
    setConfirmDrawId(null)
    setDrawingId(programId)

    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/lottery/draw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ program_id: programId })
    })

    const data = await res.json()
    setDrawingId(null)

    if (res.ok) {
      setDrawResults(prev => ({ ...prev, [programId]: data.winners }))
      await loadPrograms()
    } else {
      alert(data.error || 'Draw failed')
    }
  }

  function formatDate(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function statusBadgeClass(status) {
    return {
      upcoming: 'program-status-badge badge-upcoming',
      active: 'program-status-badge badge-active',
      drawn: 'program-status-badge badge-drawn',
      closed: 'program-status-badge badge-closed'
    }[status] || 'program-status-badge badge-closed'
  }

  const upcoming = programs.filter(p => p.status === 'upcoming')
  const active   = programs.filter(p => p.status === 'active')
  const past     = programs.filter(p => ['drawn', 'closed'].includes(p.status))

  function ProgramCard({ p }) {
    const count = entryCounts[p.id] ?? '—'
    const isDrawing = drawingId === p.id
    const result = drawResults[p.id]

    return (
      <>
        <div className={`program-card ${p.status === 'active' ? 'program-active' : ''}`}>
          <div style={{ textAlign: 'center' }}>
            <div className="program-entry-count">{count}</div>
            <div className="program-entry-label">Entries</div>
          </div>

          <div className="program-card-main">
            <div className="program-bottle-name">{p.bottle_name}</div>
            <div style={{ marginBottom: 8 }}>
              <span className={statusBadgeClass(p.status)}>{p.status}</span>
            </div>
            <div className="program-meta">
              <span className="program-meta-item">Draw: {formatDate(p.draw_date)}</span>
              <span className="program-meta-item">{p.draw_winner_count} winner{p.draw_winner_count > 1 ? 's' : ''}</span>
              {p.description && <span className="program-meta-item" style={{ color: 'var(--cream-2)' }}>{p.description}</span>}
            </div>
          </div>

          <div className="program-actions">
            {p.status === 'upcoming' && (
              <button className="program-action-btn btn-activate" onClick={() => handleActivate(p.id)}>
                Activate
              </button>
            )}
            {p.status === 'active' && (
              <button
                className="program-action-btn btn-draw"
                disabled={isDrawing}
                onClick={() => setConfirmDrawId(p.id)}
              >
                {isDrawing
                  ? <><span className="draw-spinning" />Drawing...</>
                  : 'Run Draw'
                }
              </button>
            )}
          </div>
        </div>

        {result && (
          <div className="draw-result">
            <div className="draw-result-title">Draw Results — {p.bottle_name}</div>
            {result.map((w, i) => (
              <div key={i} className="draw-winner-row">
                <span className="draw-ticket-num">#{w.ticket_number}</span>
                <span>
                  {w.claimed_by_phone
                    ? w.claimed_by_phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
                    : w.claimed_by_user_id
                      ? 'Dram Scout user'
                      : 'Anonymous'}
                </span>
                <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: '10px' }}>
                  {w.claimed_at ? new Date(w.claimed_at).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  if (loading) return <div className="lotteries-loading">LOADING...</div>

  return (
    <>
      <style>{styles}</style>

      <div className="lotteries-header">
        <div className="lotteries-title">Lottery Programs</div>
        <button className="lotteries-create-btn" onClick={() => setShowCreateModal(true)}>
          + Create Lottery
        </button>
      </div>

      {/* Active programs */}
      {active.length > 0 && (
        <>
          <div className="lotteries-section-label">Active</div>
          {active.map(p => <ProgramCard key={p.id} p={p} />)}
        </>
      )}

      {/* Upcoming programs */}
      <div className="lotteries-section-label">Upcoming</div>
      {upcoming.length === 0
        ? <div className="program-empty">No upcoming lotteries — create one above</div>
        : upcoming.map(p => <ProgramCard key={p.id} p={p} />)
      }

      {/* Past programs */}
      {past.length > 0 && (
        <>
          <div className="lotteries-section-label">Past</div>
          {past.map(p => <ProgramCard key={p.id} p={p} />)}
        </>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="modal-box">
            <div className="modal-title">Create Lottery</div>

            <label className="modal-field-label">Bottle Name *</label>
            <input
              className="modal-input"
              type="text"
              placeholder="e.g. Weller 12"
              value={form.bottle_name}
              onChange={e => setForm(f => ({ ...f, bottle_name: e.target.value }))}
            />

            <label className="modal-field-label">Description (optional)</label>
            <textarea
              className="modal-textarea"
              placeholder="Any notes for customers about this lottery..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />

            <label className="modal-field-label">Draw Date & Time *</label>
            <input
              className="modal-input"
              type="datetime-local"
              value={form.draw_date}
              onChange={e => setForm(f => ({ ...f, draw_date: e.target.value }))}
            />

            <div className="modal-row">
              <div>
                <label className="modal-field-label">Bottles Available</label>
                <input
                  className="modal-input"
                  type="number"
                  min="1"
                  value={form.bottle_count}
                  onChange={e => setForm(f => ({ ...f, bottle_count: e.target.value }))}
                />
              </div>
              <div>
                <label className="modal-field-label">Winners to Select</label>
                <input
                  className="modal-input"
                  type="number"
                  min="1"
                  value={form.draw_winner_count}
                  onChange={e => setForm(f => ({ ...f, draw_winner_count: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => { setShowCreateModal(false); setForm(EMPTY_FORM) }}>
                Cancel
              </button>
              <button
                className="modal-submit-btn"
                disabled={creating || !form.bottle_name.trim() || !form.draw_date}
                onClick={handleCreate}
              >
                {creating ? 'Creating...' : 'Create Lottery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draw confirmation */}
      {confirmDrawId && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-title">Run the Draw?</div>
            <div className="confirm-body">
              This will randomly select {programs.find(p => p.id === confirmDrawId)?.draw_winner_count ?? 1} winner(s) from {entryCounts[confirmDrawId] ?? 0} entries.
              This action cannot be undone.
            </div>
            <div className="confirm-actions">
              <button className="modal-cancel-btn" onClick={() => setConfirmDrawId(null)}>
                Cancel
              </button>
              <button className="modal-submit-btn" onClick={() => handleDraw(confirmDrawId)}>
                Run Draw
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
