import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, updateStoreCommentsEnabled } from '../../supabase.js'

const styles = `
  .bpm-root {}

  .bpm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  .bpm-title {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .bpm-new-btn {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    background: var(--amber);
    color: var(--dark);
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    font-weight: 600;
    transition: opacity 0.2s;
  }
  .bpm-new-btn:hover { opacity: 0.85; }

  .bpm-empty {
    padding: 48px 0;
    text-align: center;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 1px;
    color: var(--muted);
    border: 1px dashed var(--bark);
    border-radius: 6px;
  }

  .bpm-list { display: flex; flex-direction: column; gap: 8px; }

  .bpm-row {
    background: var(--dark-3);
    border: 1px solid var(--bark);
    border-radius: 6px;
    border-left: 3px solid var(--amber);
    display: flex;
    align-items: stretch;
    gap: 0;
    overflow: hidden;
    transition: border-color 0.2s;
  }
  .bpm-row.draft { border-left-color: var(--muted); }
  .bpm-row:hover { border-color: var(--amber-light); }

  .bpm-thumb {
    width: 64px;
    min-height: 64px;
    flex-shrink: 0;
    background: var(--dark-4);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .bpm-thumb img {
    width: 64px;
    height: 64px;
    object-fit: cover;
    display: block;
  }

  .bpm-main {
    flex: 1;
    padding: 10px 12px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .bpm-brand-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .bpm-brand {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 14px;
    color: var(--cream);
  }
  .bpm-draft-label {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    letter-spacing: 2px;
    color: var(--muted);
    border: 1px solid var(--bark);
    padding: 2px 6px;
    border-radius: 2px;
  }
  .bpm-expression {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted);
    letter-spacing: 0.03em;
  }
  .bpm-meta-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 2px;
  }
  .bpm-meta-item {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted);
    letter-spacing: 0.03em;
  }

  /* Inline bottles_remaining editor */
  .bpm-bottles-edit {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .bpm-bottles-val {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--cream-2);
    cursor: pointer;
    border-bottom: 1px dashed var(--bark);
    padding-bottom: 1px;
  }
  .bpm-bottles-val:hover { border-bottom-color: var(--amber); color: var(--amber); }
  .bpm-bottles-input {
    width: 52px;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    background: var(--dark-4);
    border: 1px solid var(--amber);
    border-radius: 3px;
    color: var(--cream);
    padding: 2px 6px;
    outline: none;
  }

  /* Status dropdown */
  .bpm-status-select {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    letter-spacing: 1px;
    text-transform: uppercase;
    background: var(--dark-4);
    border: 1px solid var(--bark);
    border-radius: 3px;
    color: var(--cream-2);
    padding: 3px 6px;
    cursor: pointer;
    outline: none;
  }
  .bpm-status-select:focus { border-color: var(--amber); }

  /* Publish toggle */
  .bpm-publish-wrap { display: flex; align-items: center; gap: 6px; }
  .bpm-toggle {
    position: relative;
    width: 32px;
    height: 18px;
    flex-shrink: 0;
  }
  .bpm-toggle input { opacity: 0; width: 0; height: 0; }
  .bpm-toggle-slider {
    position: absolute;
    inset: 0;
    background: var(--bark);
    border-radius: 18px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .bpm-toggle-slider::before {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    left: 3px;
    top: 3px;
    background: var(--muted);
    border-radius: 50%;
    transition: transform 0.2s, background 0.2s;
  }
  .bpm-toggle input:checked + .bpm-toggle-slider { background: rgba(200,130,10,0.3); }
  .bpm-toggle input:checked + .bpm-toggle-slider::before {
    transform: translateX(14px);
    background: var(--amber);
  }
  .bpm-toggle-label {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    letter-spacing: 1px;
    color: var(--muted);
    text-transform: uppercase;
  }
  .bpm-toggle-label.on { color: var(--amber); }
  .bpm-toggle-label.featured { color: var(--green); }

  /* Feature toggle — green accent */
  .bpm-feature-wrap { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
  .bpm-toggle.feature input:checked + .bpm-toggle-slider { background: rgba(10,180,10,0.2); }
  .bpm-toggle.feature input:checked + .bpm-toggle-slider::before { background: var(--green); }

  .bpm-publish-err {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--red);
    letter-spacing: 0.03em;
    margin-top: 2px;
  }

  /* Action buttons column */
  .bpm-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 12px;
    border-left: 1px solid var(--bark);
    flex-shrink: 0;
  }
  .bpm-edit-btn, .bpm-del-btn {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
    border: 1px solid;
    transition: opacity 0.2s;
    white-space: nowrap;
  }
  .bpm-edit-btn { background: none; border-color: var(--bark); color: var(--cream-2); }
  .bpm-edit-btn:hover { border-color: var(--amber-light); color: var(--amber-light); }
  .bpm-del-btn { background: none; border-color: var(--bark); color: var(--muted); }
  .bpm-del-btn:hover { border-color: var(--red); color: var(--red); }

  /* Delete confirm dialog */
  .bpm-confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .bpm-confirm-box {
    background: var(--dark-3);
    border: 1px solid var(--bark);
    border-radius: 8px;
    padding: 24px;
    max-width: 380px;
    width: 100%;
  }
  .bpm-confirm-title {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    color: var(--cream);
    margin-bottom: 8px;
  }
  .bpm-confirm-text {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    margin-bottom: 20px;
    line-height: 1.5;
    letter-spacing: 0.03em;
  }
  .bpm-confirm-actions { display: flex; gap: 10px; justify-content: flex-end; }
  .bpm-confirm-cancel {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 8px 16px;
    border: 1px solid var(--bark);
    border-radius: 4px;
    background: none;
    color: var(--muted);
    cursor: pointer;
  }
  .bpm-confirm-delete {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 8px 16px;
    border: 1px solid var(--red);
    border-radius: 4px;
    background: none;
    color: var(--red);
    cursor: pointer;
  }
  .bpm-confirm-delete:hover { background: rgba(139,46,46,0.15); }

  .bpm-error-msg {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--red);
    padding: 12px;
    border: 1px solid var(--red);
    border-radius: 4px;
    margin-bottom: 16px;
    opacity: 0.8;
  }
`

const STATUS_OPTIONS = [
  { value: 'available',    label: 'AVAILABLE' },
  { value: 'low',          label: 'LOW STOCK' },
  { value: 'sold_out',     label: 'SOLD OUT' },
  { value: 'coming_soon',  label: 'COMING SOON' },
]

function GlencairnThumb() {
  return (
    <svg width="28" height="35" viewBox="0 0 32 40" fill="none">
      <path d="M10 2 C10 2 4 10 4 18 C4 24 8 28 13 29 L13 36 L10 36 L10 38 L22 38 L22 36 L19 36 L19 29 C24 28 28 24 28 18 C28 10 22 2 22 2 Z" stroke="var(--bark)" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    </svg>
  )
}

export default function BarrelPicksManager({ storeProfile, session }) {
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [editingBottles, setEditingBottles] = useState({}) // pickId -> tempValue
  const [publishErrors, setPublishErrors] = useState({})  // pickId -> string
  const [commentsEnabled, setCommentsEnabled] = useState(true)
  const [togglingComments, setTogglingComments] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadPicks()
  }, [])

  useEffect(() => {
    if (storeProfile?.comments_enabled !== undefined) {
      setCommentsEnabled(storeProfile.comments_enabled)
    }
  }, [storeProfile?.comments_enabled])

  async function handleCommentsToggle() {
    const newValue = !commentsEnabled
    setCommentsEnabled(newValue)
    setTogglingComments(true)
    const result = await updateStoreCommentsEnabled(storeProfile.id, newValue)
    if (!result.ok) setCommentsEnabled(!newValue) // revert on failure
    setTogglingComments(false)
  }

  async function getLiveAuth() {
    const { data: { session: s } } = await supabase.auth.getSession()
    return { token: s?.access_token, storeId: s?.user?.id }
  }

  async function loadPicks() {
    setLoading(true)
    setError(null)
    try {
      const { token, storeId } = await getLiveAuth()
      const res = await fetch(`/api/store/${storeId}/barrel-picks`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load picks')
      const data = await res.json()
      setPicks(data.picks || [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function patchPick(pickId, updates) {
    const { token, storeId } = await getLiveAuth()
    const res = await fetch(`/api/store/${storeId}/barrel-picks/${pickId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Update failed')
    const data = await res.json()
    return data.pick
  }

  async function handleBottlesSave(pickId, value) {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 0) {
      setEditingBottles(prev => { const n = { ...prev }; delete n[pickId]; return n })
      return
    }
    // Optimistic update
    const prevPicks = picks
    const newStatus = num === 0 ? 'sold_out' : undefined
    setPicks(prev => prev.map(p => {
      if (p.id !== pickId) return p
      return { ...p, bottles_remaining: num, ...(newStatus ? { status: newStatus } : {}) }
    }))
    setEditingBottles(prev => { const n = { ...prev }; delete n[pickId]; return n })

    try {
      const updated = await patchPick(pickId, { bottles_remaining: num })
      setPicks(prev => prev.map(p => p.id === pickId ? { ...p, ...updated } : p))
    } catch {
      setPicks(prevPicks) // revert
    }
  }

  async function handleStatusChange(pickId, status) {
    const prevPicks = picks
    setPicks(prev => prev.map(p => p.id === pickId ? { ...p, status } : p))
    try {
      const updated = await patchPick(pickId, { status })
      setPicks(prev => prev.map(p => p.id === pickId ? { ...p, ...updated } : p))
    } catch {
      setPicks(prevPicks)
    }
  }

  async function handleTogglePublish(pick) {
    setPublishErrors(prev => { const n = { ...prev }; delete n[pick.id]; return n })
    const { token, storeId } = await getLiveAuth()
    const res = await fetch(`/api/store/${storeId}/barrel-picks/${pick.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ toggle_publish: true }),
    })
    const data = await res.json()
    if (!res.ok || data.validation_errors) {
      const fields = (data.validation_errors || []).join(', ')
      setPublishErrors(prev => ({ ...prev, [pick.id]: `Required before publishing: ${fields}` }))
      return
    }
    setPicks(prev => prev.map(p => p.id === pick.id ? { ...p, is_published: data.is_published } : p))
  }

  async function handleToggleFeature(pick) {
    const prevPicks = picks
    setPicks(prev => prev.map(p => p.id === pick.id ? { ...p, is_featured: !p.is_featured } : p))
    try {
      await patchPick(pick.id, { is_featured: !pick.is_featured })
    } catch {
      setPicks(prevPicks)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { token, storeId } = await getLiveAuth()
      const res = await fetch(`/api/store/${storeId}/barrel-picks/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Delete failed')
      setPicks(prev => prev.filter(p => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      alert('Failed to delete pick: ' + err.message)
    }
    setDeleting(false)
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2 }}>
        LOADING...
      </div>
    )
  }

  return (
    <div className="bpm-root">
      <style>{styles}</style>

      <div className="bpm-header">
        <span className="bpm-title">Barrel Picks</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="bpm-publish-wrap" title="Allow customers to comment on barrel picks">
            <label className="bpm-toggle">
              <input
                type="checkbox"
                checked={commentsEnabled}
                onChange={handleCommentsToggle}
                disabled={togglingComments || !storeProfile}
              />
              <span className="bpm-toggle-slider" />
            </label>
            <span className={`bpm-toggle-label${commentsEnabled ? ' on' : ''}`}>
              Comments {commentsEnabled ? 'On' : 'Off'}
            </span>
          </div>
          <button className="bpm-new-btn" onClick={() => navigate('/store/barrel-picks/new')}>
            + New Pick
          </button>
        </div>
      </div>

      {error && <div className="bpm-error-msg">{error}</div>}

      {picks.length === 0 ? (
        <div className="bpm-empty">
          No barrel picks yet. Click <strong>+ New Pick</strong> to add your first one.
        </div>
      ) : (
        <div className="bpm-list">
          {picks.map(pick => (
            <div key={pick.id} className={`bpm-row${pick.is_published ? '' : ' draft'}`}>
              {/* Thumbnail */}
              <div className="bpm-thumb">
                {pick.primary_photo_url
                  ? <img src={pick.primary_photo_url} alt={pick.brand} />
                  : <GlencairnThumb />
                }
              </div>

              {/* Main info */}
              <div className="bpm-main">
                <div className="bpm-brand-row">
                  <span className="bpm-brand">{pick.brand}</span>
                  {!pick.is_published && <span className="bpm-draft-label">DRAFT</span>}
                </div>
                {pick.expression && <div className="bpm-expression">{pick.expression}</div>}

                <div className="bpm-meta-row">
                  <span className="bpm-meta-item">{pick.proof}° proof</span>
                  {pick.price_per_bottle && (
                    <span className="bpm-meta-item">${Number(pick.price_per_bottle).toFixed(2)}</span>
                  )}

                  {/* Bottles remaining — inline editable */}
                  <span className="bpm-meta-item">
                    <span className="bpm-bottles-edit">
                      Remaining:&nbsp;
                      {editingBottles[pick.id] !== undefined ? (
                        <input
                          className="bpm-bottles-input"
                          type="number"
                          min="0"
                          autoFocus
                          value={editingBottles[pick.id]}
                          onChange={e => setEditingBottles(prev => ({ ...prev, [pick.id]: e.target.value }))}
                          onBlur={() => handleBottlesSave(pick.id, editingBottles[pick.id])}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleBottlesSave(pick.id, editingBottles[pick.id])
                            if (e.key === 'Escape') setEditingBottles(prev => { const n = {...prev}; delete n[pick.id]; return n })
                          }}
                        />
                      ) : (
                        <span
                          className="bpm-bottles-val"
                          onClick={() => setEditingBottles(prev => ({ ...prev, [pick.id]: String(pick.bottles_remaining ?? '') }))}
                          title="Click to edit"
                        >
                          {pick.bottles_remaining ?? '—'}
                        </span>
                      )}
                    </span>
                  </span>

                  {/* Status dropdown */}
                  <select
                    className="bpm-status-select"
                    value={pick.status}
                    onChange={e => handleStatusChange(pick.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Publish toggle */}
                <div style={{ marginTop: 6 }}>
                  <div className="bpm-publish-wrap">
                    <label className="bpm-toggle">
                      <input
                        type="checkbox"
                        checked={!!pick.is_published}
                        onChange={() => handleTogglePublish(pick)}
                      />
                      <span className="bpm-toggle-slider" />
                    </label>
                    <span className={`bpm-toggle-label${pick.is_published ? ' on' : ''}`}>
                      {pick.is_published ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>
                  {publishErrors[pick.id] && (
                    <div className="bpm-publish-err">{publishErrors[pick.id]}</div>
                  )}

                  {/* Feature toggle — always shown regardless of location */}
                  <div className="bpm-feature-wrap">
                    <label className="bpm-toggle feature">
                      <input
                        type="checkbox"
                        checked={!!pick.is_featured}
                        onChange={() => handleToggleFeature(pick)}
                      />
                      <span className="bpm-toggle-slider" />
                    </label>
                    <span className={`bpm-toggle-label${pick.is_featured ? ' featured' : ''}`}>
                      {pick.is_featured ? 'FEATURED (ALWAYS SHOWN)' : 'FEATURE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="bpm-actions">
                <button className="bpm-edit-btn" onClick={() => navigate(`/store/barrel-picks/${pick.id}/edit`)}>
                  Edit
                </button>
                <button className="bpm-del-btn" onClick={() => setDeleteTarget(pick)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="bpm-confirm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="bpm-confirm-box" onClick={e => e.stopPropagation()}>
            <div className="bpm-confirm-title">Delete "{deleteTarget.brand}"?</div>
            <div className="bpm-confirm-text">
              This will permanently delete this barrel pick and all associated photos.
              This action cannot be undone.
            </div>
            <div className="bpm-confirm-actions">
              <button className="bpm-confirm-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="bpm-confirm-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
