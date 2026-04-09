// src/components/AgeVerificationModal.jsx
// Age gate modal shown on every page load.
// Centered overlay with backdrop blur, month/day/year dropdowns.
// Props: onVerified(birthdateStr), onBlocked()
import { useState } from 'react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const CURRENT_YEAR = new Date().getFullYear()
const MAX_YEAR = CURRENT_YEAR - 21  // youngest age that could be 21
const MIN_YEAR = 1910

export function calculateAge(birthdateStr) {
  const today = new Date()
  const birth = new Date(birthdateStr + 'T00:00:00') // force local-time parse
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const MODAL_STYLES = `
.age-overlay {
  position: fixed;
  inset: 0;
  background: rgba(14, 11, 8, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 700;
}

.age-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 710;
  background: var(--card-2, #251C0C);
  border: 1px solid var(--rule, #3A2910);
  border-radius: 14px;
  width: min(360px, calc(100vw - 32px));
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.7);
  overflow: hidden;
}

.age-modal-header {
  background: var(--ink, #0E0B08);
  border-bottom: 1px solid var(--rule, #3A2910);
  padding: 18px 24px 16px;
  text-align: center;
}

.age-modal-brand {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.25em;
  color: var(--gold, #C17D0E);
  margin-bottom: 10px;
}

.age-modal-headline {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-size: 24px;
  color: var(--paper, #F0E2C8);
  line-height: 1.2;
  margin-bottom: 6px;
}

.age-modal-sub {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost, #7A6845);
  line-height: 1.5;
}

.age-modal-body {
  padding: 22px 24px 20px;
}

.age-dropdowns {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr;
  gap: 8px;
  margin-bottom: 8px;
}

.age-dropdown-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.age-dropdown-label {
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  letter-spacing: 0.12em;
  color: var(--ghost, #7A6845);
  text-transform: uppercase;
}

.age-select {
  width: 100%;
  height: 40px;
  background: var(--card, #1E1509);
  border: 1px solid var(--rule, #3A2910);
  border-radius: 6px;
  color: var(--paper, #F0E2C8);
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  padding: 0 8px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%237A6845'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 24px;
}

.age-select:focus {
  outline: none;
  border-color: var(--gold, #C17D0E);
}

.age-select option {
  background: var(--card, #1E1509);
  color: var(--paper, #F0E2C8);
}

.age-error {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--urgent, #7A2E2E);
  margin-bottom: 10px;
  padding: 0 2px;
  min-height: 16px;
}

.age-submit-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, var(--gold, #C17D0E), var(--gold-light, #DCA030));
  color: var(--ink, #0E0B08);
  border: none;
  border-radius: 8px;
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  cursor: pointer;
  transition: opacity 0.15s;
}

.age-submit-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.age-submit-btn:not(:disabled):active {
  opacity: 0.85;
}

.age-modal-footer {
  padding: 0 24px 20px;
  text-align: center;
}

.age-legal {
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  color: var(--ghost, #7A6845);
  line-height: 1.5;
  letter-spacing: 0.03em;
}
`

let stylesInjected = false

export function AgeVerificationModal({ onVerified, onBlocked }) {
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState(null)

  if (!stylesInjected) {
    const el = document.createElement('style')
    el.textContent = MODAL_STYLES
    document.head.appendChild(el)
    stylesInjected = true
  }

  const allSelected = month && day && year

  function handleSubmit() {
    if (!allSelected) return
    const birthdateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const age = calculateAge(birthdateStr)
    if (age >= 21) {
      onVerified(birthdateStr)
    } else {
      onBlocked()
    }
  }

  // Generate day options based on selected month/year
  function daysInMonth() {
    if (!month) return 31
    if (!year) return new Date(2000, Number(month), 0).getDate()
    return new Date(Number(year), Number(month), 0).getDate()
  }

  const years = []
  for (let y = MAX_YEAR; y >= MIN_YEAR; y--) years.push(y)

  return (
    <>
      <div className="age-overlay" />
      <div className="age-modal" role="dialog" aria-modal="true" aria-labelledby="age-headline">
        <div className="age-modal-header">
          <div className="age-modal-brand">DRAM SCOUT</div>
          <div className="age-modal-headline" id="age-headline">Confirm Your Age</div>
          <div className="age-modal-sub">
            You must be 21 years of age or older to enter this site.
          </div>
        </div>

        <div className="age-modal-body">
          <div className="age-dropdowns">
            <div className="age-dropdown-wrap">
              <span className="age-dropdown-label">Month</span>
              <select
                className="age-select"
                value={month}
                onChange={e => { setMonth(e.target.value); setDay(''); setError(null) }}
              >
                <option value="">Month</option>
                {MONTHS.map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>

            <div className="age-dropdown-wrap">
              <span className="age-dropdown-label">Day</span>
              <select
                className="age-select"
                value={day}
                onChange={e => { setDay(e.target.value); setError(null) }}
              >
                <option value="">Day</option>
                {Array.from({ length: daysInMonth() }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="age-dropdown-wrap">
              <span className="age-dropdown-label">Year</span>
              <select
                className="age-select"
                value={year}
                onChange={e => { setYear(e.target.value); setError(null) }}
              >
                <option value="">Year</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="age-error">{error}</div>

          <button
            className="age-submit-btn"
            onClick={handleSubmit}
            disabled={!allSelected}
          >
            ENTER SITE
          </button>
        </div>

        <div className="age-modal-footer">
          <div className="age-legal">
            By entering you agree that you are of legal drinking age in your jurisdiction.
          </div>
        </div>
      </div>
    </>
  )
}
