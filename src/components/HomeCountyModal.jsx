// src/components/HomeCountyModal.jsx
// Onboarding bottom sheet shown to new users before they've set a home county.
// Cannot be dismissed without selecting — no X button.
// Reuses existing .sheet / .sheet-overlay CSS classes from App.jsx STYLES.
import { useState } from 'react'
import { CountyPicker } from './CountyPicker.jsx'

const MODAL_STYLES = `
.home-county-modal-header {
  padding: 8px 20px 16px;
  flex-shrink: 0;
}

.home-county-modal-headline {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-size: 26px;
  color: var(--paper);
  line-height: 1.2;
  margin-bottom: 8px;
}

.home-county-modal-sub {
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  color: var(--parchment);
  line-height: 1.5;
}

.home-county-modal-footer {
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  flex-shrink: 0;
  border-top: 1px solid var(--rule);
  background: var(--card);
}

.home-county-modal-error {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--urgent);
  margin-bottom: 8px;
  padding: 0 2px;
}

.home-county-cta {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
  color: var(--ink);
  border: none;
  border-radius: 8px;
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: opacity 0.15s;
}

.home-county-cta:disabled {
  opacity: 0.4;
  cursor: default;
}

.home-county-cta:not(:disabled):active {
  opacity: 0.85;
}
`

let stylesInjected = false

export function HomeCountyModal({ onComplete }) {
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!stylesInjected) {
    const el = document.createElement('style')
    el.textContent = MODAL_STYLES
    document.head.appendChild(el)
    stylesInjected = true
  }

  async function handleConfirm() {
    if (!selected || saving) return
    setSaving(true)
    setError(null)
    try {
      await onComplete(selected)
      // Parent re-renders: isOnboardingNeeded flips false → modal unmounts
    } catch (e) {
      setError('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <>
      {/* Non-dismissible overlay */}
      <div className="sheet-overlay" style={{ zIndex: 400 }} />

      <div className="sheet open" style={{ zIndex: 410, height: '88dvh', maxHeight: '88dvh' }}>
        <div className="sheet-handle-wrap">
          <div className="sheet-handle" />
        </div>

        <div className="home-county-modal-header">
          <div className="home-county-modal-headline">Where do you hunt?</div>
          <div className="home-county-modal-sub">
            We'll center your map and sort sightings by distance from your home county.
          </div>
        </div>

        <div className="sheet-body" style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          <CountyPicker selectedCounty={selected} onSelect={setSelected} />
        </div>

        <div className="home-county-modal-footer">
          {error && <div className="home-county-modal-error">{error}</div>}
          <button
            className="home-county-cta"
            onClick={handleConfirm}
            disabled={!selected || saving}
          >
            {saving ? 'SAVING…' : 'SET MY HOME COUNTY'}
          </button>
        </div>
      </div>
    </>
  )
}
