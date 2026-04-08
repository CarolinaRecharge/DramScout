// src/components/CountyPicker.jsx
// Reusable NC county selector — used in onboarding modal and profile settings.
import { useState, useEffect, useRef } from 'react'
import { NC_REGIONS, NC_COUNTY_CENTROIDS } from '../data/ncCounties.js'

const STYLES = `
.county-picker {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
}

.county-search-wrap {
  padding: 0 0 12px;
  position: sticky;
  top: 0;
  background: var(--card);
  z-index: 2;
}

.county-search {
  width: 100%;
  background: var(--card-2);
  color: var(--paper);
  border: 1px solid var(--worn);
  border-radius: 6px;
  padding: 10px 14px;
  font-family: 'Courier Prime', monospace;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}

.county-search::placeholder {
  color: var(--ghost);
}

.county-search:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 2px var(--gold-glow);
}

.county-region-block {
  margin-bottom: 4px;
}

.county-region-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0 6px;
}

.county-region-label {
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}

.county-region-rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--rule), transparent);
}

.county-option {
  width: 100%;
  text-align: left;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 5px;
  color: var(--parchment);
  padding: 11px 14px;
  font-family: 'Courier Prime', monospace;
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
  -webkit-tap-highlight-color: transparent;
}

.county-option:active {
  background: var(--worn);
}

.county-option.selected {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--ink);
  font-weight: 700;
}
`

// Flatten all counties for search mode
const ALL_COUNTIES = Object.keys(NC_COUNTY_CENTROIDS).sort()

export function CountyPicker({ selectedCounty, onSelect }) {
  const [search, setSearch] = useState('')
  const stylesInjected = useRef(false)

  useEffect(() => {
    if (stylesInjected.current) return
    const el = document.createElement('style')
    el.textContent = STYLES
    document.head.appendChild(el)
    stylesInjected.current = true
  }, [])

  const q = search.trim().toLowerCase()

  if (q) {
    // Search mode: flat list filtered by query
    const matches = ALL_COUNTIES.filter(c => c.toLowerCase().includes(q))
    return (
      <div className="county-picker">
        <div className="county-search-wrap">
          <input
            className="county-search"
            type="text"
            placeholder="Search county…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
        {matches.length === 0 && (
          <div style={{ color: 'var(--ghost)', fontFamily: "'Courier Prime', monospace", fontSize: 12, padding: '8px 0' }}>
            No counties match "{search}"
          </div>
        )}
        {matches.map(county => (
          <button
            key={county}
            className={`county-option${selectedCounty === county ? ' selected' : ''}`}
            onClick={() => onSelect(county)}
          >
            {county}
          </button>
        ))}
      </div>
    )
  }

  // Grouped by region
  return (
    <div className="county-picker">
      <div className="county-search-wrap">
        <input
          className="county-search"
          type="text"
          placeholder="Search county…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoComplete="off"
        />
      </div>
      {Object.entries(NC_REGIONS).map(([region, counties]) => (
        <div key={region} className="county-region-block">
          <div className="county-region-header">
            <span className="county-region-label">{region}</span>
            <span className="county-region-rule" />
          </div>
          {counties.map(county => (
            <button
              key={county}
              className={`county-option${selectedCounty === county ? ' selected' : ''}`}
              onClick={() => onSelect(county)}
            >
              {county}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
