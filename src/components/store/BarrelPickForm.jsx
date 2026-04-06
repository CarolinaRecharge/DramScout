import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BarrelPickPhotos from './BarrelPickPhotos.jsx'

const styles = `
  .bpf-root { max-width: 760px; }

  .bpf-back {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-bottom: 20px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s;
  }
  .bpf-back:hover { color: var(--cream-2); }

  .bpf-page-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 28px;
  }

  .bpf-fieldset {
    margin-bottom: 28px;
    padding: 20px;
    background: var(--dark-3);
    border: 1px solid var(--bark);
    border-radius: 6px;
  }
  .bpf-legend {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--bark);
  }

  .bpf-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .bpf-grid-full { grid-column: 1 / -1; }
  @media (max-width: 520px) { .bpf-grid { grid-template-columns: 1fr; } }

  .bpf-field { display: flex; flex-direction: column; gap: 5px; }
  .bpf-label {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .bpf-label-required::after { content: ' *'; color: var(--amber); }
  .bpf-helper {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--muted);
    opacity: 0.7;
    margin-top: -2px;
    letter-spacing: 0.03em;
  }

  .bpf-input, .bpf-select, .bpf-textarea {
    background: var(--dark-4);
    border: 1px solid var(--bark);
    border-radius: 4px;
    color: var(--cream);
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    padding: 8px 10px;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
  }
  .bpf-input:focus, .bpf-select:focus, .bpf-textarea:focus { border-color: var(--amber); }
  .bpf-input.error { border-color: var(--red); }

  .bpf-textarea { resize: vertical; min-height: 80px; font-family: 'Libre Baskerville', serif; font-size: 12px; }
  .bpf-char-count {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--muted);
    text-align: right;
    margin-top: -2px;
  }
  .bpf-char-count.warn { color: var(--amber); }

  /* Tasting notes grid */
  .bpf-tasting-section { display: flex; flex-direction: column; gap: 12px; }
  .bpf-flavor-family { display: flex; flex-direction: column; gap: 6px; }
  .bpf-flavor-label {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--muted);
    opacity: 0.7;
  }
  .bpf-chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .bpf-note-chip {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.05em;
    padding: 5px 11px;
    border-radius: 20px;
    border: 1px solid var(--bark);
    background: var(--dark-4);
    color: var(--muted);
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .bpf-note-chip.selected {
    background: var(--amber);
    border-color: var(--amber);
    color: var(--dark);
    font-weight: 600;
  }

  /* Validation banner */
  .bpf-validation-banner {
    background: rgba(200,130,10,0.08);
    border: 1px solid rgba(200,130,10,0.4);
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--amber-light);
    letter-spacing: 0.03em;
    line-height: 1.6;
  }
  .bpf-validation-title {
    font-weight: 600;
    margin-bottom: 4px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* Footer */
  .bpf-footer {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    padding-top: 8px;
  }
  .bpf-save-draft {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 10px 20px;
    border: 1px solid var(--bark);
    border-radius: 4px;
    background: none;
    color: var(--cream-2);
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
  }
  .bpf-save-draft:hover { border-color: var(--amber-light); color: var(--amber-light); }

  .bpf-save-publish {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    background: var(--amber);
    color: var(--dark);
    cursor: pointer;
    font-weight: 600;
    transition: opacity 0.2s;
  }
  .bpf-save-publish:hover { opacity: 0.85; }
  .bpf-save-publish:disabled, .bpf-save-draft:disabled { opacity: 0.5; cursor: not-allowed; }

  .bpf-spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: currentColor;
    border-radius: 50%;
    animation: bpf-spin 0.7s linear infinite;
    margin-right: 6px;
    vertical-align: middle;
  }
  @keyframes bpf-spin { to { transform: rotate(360deg); } }

  .bpf-api-error {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--red);
    padding: 10px 12px;
    border: 1px solid rgba(139,46,46,0.5);
    border-radius: 4px;
    margin-top: 8px;
  }
`

const TASTING_NOTES = [
  { family: 'Fruit', notes: ['cherry', 'dried fruit', 'citrus', 'apple', 'stone fruit'] },
  { family: 'Sweet', notes: ['vanilla', 'caramel', 'honey', 'maple', 'brown sugar'] },
  { family: 'Spice', notes: ['baking spice', 'cinnamon', 'white pepper', 'black pepper', 'clove'] },
  { family: 'Wood', notes: ['oak', 'toasted oak', 'cedar', 'char'] },
  { family: 'Grain', notes: ['corn', 'wheat', 'rye', 'malt'] },
  { family: 'Dark', notes: ['chocolate', 'coffee', 'leather', 'tobacco'] },
  { family: 'Other', notes: ['floral', 'mint', 'coconut', 'molasses', 'dried herb'] },
]

const EMPTY_FORM = {
  distillery: '', brand: '', expression: '', barrel_number: '', warehouse_rick: '',
  age_stated: '', proof: '', vintage_year: '', label_name: '', selected_by: '',
  selection_date: '', arrival_date: '', price_per_bottle: '', bottles_total: '',
  bottles_remaining: '', msrp: '', store_notes: '', tasting_notes: [], status: 'available',
}

function Field({ label, required, helper, error, children }) {
  return (
    <div className="bpf-field">
      <label className={`bpf-label${required ? ' bpf-label-required' : ''}`}>{label}</label>
      {helper && <span className="bpf-helper">{helper}</span>}
      {children}
      {error && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}

export default function BarrelPickForm({ storeProfile, session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const storeId = storeProfile?.id || session?.user?.id

  const [form, setForm] = useState(EMPTY_FORM)
  const [loadingPick, setLoadingPick] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [savedPick, setSavedPick] = useState(null) // for photo section in edit mode

  // Load existing pick data when editing
  useEffect(() => {
    if (!isEdit) return
    ;(async () => {
      try {
        const token = session?.access_token
        const res = await fetch(`/api/store/${storeId}/barrel-picks`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        const pick = (data.picks || []).find(p => p.id === id)
        if (pick) {
          setSavedPick(pick)
          setForm({
            distillery: pick.distillery || '',
            brand: pick.brand || '',
            expression: pick.expression || '',
            barrel_number: pick.barrel_number || '',
            warehouse_rick: pick.warehouse_rick || '',
            age_stated: pick.age_stated != null ? String(pick.age_stated) : '',
            proof: pick.proof != null ? String(pick.proof) : '',
            vintage_year: pick.vintage_year != null ? String(pick.vintage_year) : '',
            label_name: pick.label_name || '',
            selected_by: pick.selected_by || '',
            selection_date: pick.selection_date || '',
            arrival_date: pick.arrival_date || '',
            price_per_bottle: pick.price_per_bottle != null ? String(pick.price_per_bottle) : '',
            bottles_total: pick.bottles_total != null ? String(pick.bottles_total) : '',
            bottles_remaining: pick.bottles_remaining != null ? String(pick.bottles_remaining) : '',
            msrp: pick.msrp != null ? String(pick.msrp) : '',
            store_notes: pick.store_notes || '',
            tasting_notes: pick.tasting_notes || [],
            status: pick.status || 'available',
          })
        }
      } catch (err) {
        setApiError('Failed to load pick data')
      }
      setLoadingPick(false)
    })()
  }, [id, isEdit])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleNote(note) {
    setForm(prev => {
      const has = prev.tasting_notes.includes(note)
      return {
        ...prev,
        tasting_notes: has
          ? prev.tasting_notes.filter(n => n !== note)
          : [...prev.tasting_notes, note],
      }
    })
  }

  function buildPayload() {
    const payload = {
      distillery: form.distillery.trim(),
      brand: form.brand.trim(),
      expression: form.expression.trim() || null,
      barrel_number: form.barrel_number.trim() || null,
      warehouse_rick: form.warehouse_rick.trim() || null,
      age_stated: form.age_stated ? parseInt(form.age_stated, 10) : null,
      proof: form.proof ? parseFloat(form.proof) : null,
      vintage_year: form.vintage_year ? parseInt(form.vintage_year, 10) : null,
      label_name: form.label_name.trim() || null,
      selected_by: form.selected_by.trim() || null,
      selection_date: form.selection_date || null,
      arrival_date: form.arrival_date || null,
      price_per_bottle: form.price_per_bottle ? parseFloat(form.price_per_bottle) : null,
      bottles_total: form.bottles_total ? parseInt(form.bottles_total, 10) : null,
      bottles_remaining: form.bottles_remaining ? parseInt(form.bottles_remaining, 10) : null,
      msrp: form.msrp ? parseFloat(form.msrp) : null,
      store_notes: form.store_notes.trim() || null,
      tasting_notes: form.tasting_notes,
      status: form.status,
    }
    return payload
  }

  async function save(andPublish = false) {
    setValidationErrors(null)
    setApiError(null)
    setSaving(true)

    const payload = buildPayload()
    const token = session?.access_token

    try {
      let pick
      if (isEdit) {
        const res = await fetch(`/api/store/${storeId}/barrel-picks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Save failed') }
        const d = await res.json()
        pick = d.pick
      } else {
        const res = await fetch(`/api/store/${storeId}/barrel-picks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Create failed') }
        const d = await res.json()
        pick = d.pick
      }

      if (andPublish) {
        const pubRes = await fetch(`/api/store/${storeId}/barrel-picks/${pick.id}/publish`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        })
        const pubData = await pubRes.json()
        if (!pubRes.ok || pubData.validation_errors) {
          setValidationErrors(pubData.validation_errors || ['Unknown validation error'])
          // Navigate to edit if newly created (so photos can be added etc.)
          if (!isEdit) navigate(`/store/barrel-picks/${pick.id}/edit`, { replace: true })
          setSaving(false)
          return
        }
      }

      navigate('/store/barrel-picks')
    } catch (err) {
      setApiError(err.message)
    }

    setSaving(false)
  }

  if (loadingPick) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2 }}>
        LOADING...
      </div>
    )
  }

  const notesLen = form.store_notes.length

  return (
    <div className="bpf-root">
      <style>{styles}</style>

      <button className="bpf-back" onClick={() => navigate('/store/barrel-picks')}>
        ← Back to Barrel Picks
      </button>

      <div className="bpf-page-title">
        {isEdit ? 'Edit Barrel Pick' : 'New Barrel Pick'}
      </div>

      {/* ── Fieldset 1: Whiskey Details ── */}
      <div className="bpf-fieldset">
        <div className="bpf-legend">Whiskey Details</div>
        <div className="bpf-grid">
          <Field label="Distillery" required error={!form.distillery && saving ? 'Required' : null}>
            <input className={`bpf-input${!form.distillery && saving ? ' error' : ''}`} value={form.distillery} onChange={e => set('distillery', e.target.value)} placeholder="e.g. Buffalo Trace" />
          </Field>
          <Field label="Brand" required>
            <input className="bpf-input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Eagle Rare" />
          </Field>
          <Field label="Expression" helper="e.g. Single Barrel Select, Bottled in Bond">
            <input className="bpf-input" value={form.expression} onChange={e => set('expression', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Barrel Number">
            <input className="bpf-input" value={form.barrel_number} onChange={e => set('barrel_number', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Warehouse / Rick">
            <input className="bpf-input" value={form.warehouse_rick} onChange={e => set('warehouse_rick', e.target.value)} placeholder="e.g. Warehouse K, Rick 3" />
          </Field>
          <Field label="Stated Age (yrs)" helper="Leave blank if NAS">
            <input className="bpf-input" type="number" min="0" max="50" value={form.age_stated} onChange={e => set('age_stated', e.target.value)} placeholder="NAS" />
          </Field>
          <Field label="Proof" required>
            <input className="bpf-input" type="number" step="0.1" min="40" max="200" value={form.proof} onChange={e => set('proof', e.target.value)} placeholder="e.g. 107.2" />
          </Field>
          <Field label="Vintage Year" helper="Distillation year if known">
            <input className="bpf-input" type="number" min="1900" max="2100" value={form.vintage_year} onChange={e => set('vintage_year', e.target.value)} placeholder="Optional" />
          </Field>
        </div>
      </div>

      {/* ── Fieldset 2: Store Story ── */}
      <div className="bpf-fieldset">
        <div className="bpf-legend">Store Story</div>
        <div className="bpf-grid">
          <Field label="Custom Label Name" helper="Your store's name for this pick">
            <input className="bpf-input" value={form.label_name} onChange={e => set('label_name', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Selected By" helper="Staff, Owner, Bourbon Club, etc.">
            <input className="bpf-input" value={form.selected_by} onChange={e => set('selected_by', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Selection Date">
            <input className="bpf-input" type="date" value={form.selection_date} onChange={e => set('selection_date', e.target.value)} />
          </Field>
          <Field label="Arrival Date">
            <input className="bpf-input" type="date" value={form.arrival_date} onChange={e => set('arrival_date', e.target.value)} />
          </Field>
          <div className="bpf-grid-full">
            <Field label="Store Notes" helper="The narrative shown on the pick card (max 500 chars)">
              <textarea
                className="bpf-textarea"
                value={form.store_notes}
                onChange={e => set('store_notes', e.target.value.slice(0, 500))}
                placeholder="Describe your barrel pick — what makes it special, how you found it..."
                rows={4}
              />
              <span className={`bpf-char-count${notesLen > 400 ? ' warn' : ''}`}>{notesLen}/500</span>
            </Field>
          </div>
        </div>
      </div>

      {/* ── Fieldset 3: Pricing & Inventory ── */}
      <div className="bpf-fieldset">
        <div className="bpf-legend">Pricing &amp; Inventory</div>
        <div className="bpf-grid">
          <Field label="Price Per Bottle" required helper="Required before publishing">
            <input className="bpf-input" type="number" step="0.01" min="0" value={form.price_per_bottle} onChange={e => set('price_per_bottle', e.target.value)} placeholder="e.g. 49.95" />
          </Field>
          <Field label="MSRP" helper="Official suggested retail price for comparison">
            <input className="bpf-input" type="number" step="0.01" min="0" value={form.msrp} onChange={e => set('msrp', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Bottles Total">
            <input className="bpf-input" type="number" min="0" value={form.bottles_total} onChange={e => set('bottles_total', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Bottles Remaining">
            <input className="bpf-input" type="number" min="0" value={form.bottles_remaining} onChange={e => set('bottles_remaining', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Status">
            <select className="bpf-select" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="available">Available</option>
              <option value="low">Low Stock</option>
              <option value="sold_out">Sold Out</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </Field>
        </div>
      </div>

      {/* ── Fieldset 4: Tasting Notes ── */}
      <div className="bpf-fieldset">
        <div className="bpf-legend">Tasting Notes</div>
        <div className="bpf-tasting-section">
          {TASTING_NOTES.map(({ family, notes }) => (
            <div key={family} className="bpf-flavor-family">
              <span className="bpf-flavor-label">{family}</span>
              <div className="bpf-chip-grid">
                {notes.map(note => (
                  <button
                    key={note}
                    type="button"
                    className={`bpf-note-chip${form.tasting_notes.includes(note) ? ' selected' : ''}`}
                    onClick={() => toggleNote(note)}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Photo upload (edit mode only) ── */}
      {isEdit && savedPick && (
        <BarrelPickPhotos
          pick={savedPick}
          storeId={storeId}
          session={session}
          onUpdate={updated => setSavedPick(prev => ({ ...prev, ...updated }))}
        />
      )}
      {!isEdit && (
        <div className="bpf-fieldset">
          <div className="bpf-legend">Photos</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: '0.05em' }}>
            Save the pick first, then upload photos from the edit screen.
          </div>
        </div>
      )}

      {/* ── Validation banner ── */}
      {validationErrors && validationErrors.length > 0 && (
        <div className="bpf-validation-banner">
          <div className="bpf-validation-title">Cannot publish — missing required fields:</div>
          {validationErrors.map(f => (
            <div key={f}>· {f.replace(/_/g, ' ')}</div>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="bpf-footer">
        <button className="bpf-save-draft" onClick={() => save(false)} disabled={saving}>
          {saving ? <><span className="bpf-spinner" />Saving...</> : 'Save Draft'}
        </button>
        <button className="bpf-save-publish" onClick={() => save(true)} disabled={saving}>
          {saving ? <><span className="bpf-spinner" />Saving...</> : 'Save & Publish'}
        </button>
      </div>

      {apiError && <div className="bpf-api-error">{apiError}</div>}
    </div>
  )
}
