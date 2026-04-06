import { useState, useEffect, useCallback } from 'react'
import BarrelPickCard from './BarrelPickCard.jsx'

const DISTILLERY_FILTERS = [
  'All',
  'Buffalo Trace',
  'Heaven Hill',
  'Four Roses',
  'Wild Turkey',
  'MGP',
  'Brown-Forman',
]

const SECTION_STYLES = `
  .bp-section { margin-bottom: 4px; }

  .bp-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 16px 10px;
  }
  .bp-section-label {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gold);
    white-space: nowrap;
  }
  .bp-section-rule {
    flex: 1;
    height: 1px;
    background: var(--gold);
    opacity: 0.35;
  }

  .bp-distillery-row {
    display: flex;
    gap: 6px;
    padding: 0 16px 12px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .bp-distillery-row::-webkit-scrollbar { display: none; }

  .bp-distillery-chip {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 5px 10px;
    border-radius: 20px;
    border: 1px solid var(--worn);
    background: var(--card-2);
    color: var(--parchment);
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    flex-shrink: 0;
  }
  .bp-distillery-chip.active {
    background: var(--gold);
    border-color: var(--gold);
    color: var(--ink);
  }

  .bp-picks-list { padding: 0 16px; }

  .bp-location-banner {
    margin: 0 16px 10px;
    padding: 8px 12px;
    background: rgba(193,125,14,0.08);
    border: 1px solid rgba(193,125,14,0.3);
    border-radius: 6px;
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    letter-spacing: 0.05em;
    color: var(--gold);
    text-align: center;
  }

  .bp-empty {
    padding: 40px 16px;
    text-align: center;
  }
  .bp-empty-icon {
    margin: 0 auto 16px;
    display: block;
    opacity: 0.35;
  }
  .bp-empty-headline {
    font-family: 'Cormorant Garamond', 'Playfair Display', serif;
    font-style: italic;
    font-size: 17px;
    color: var(--parchment);
    margin-bottom: 8px;
  }
  .bp-empty-sub {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    letter-spacing: 0.08em;
    color: var(--ghost);
    line-height: 1.6;
  }

  .bp-loading {
    padding: 24px 16px;
    text-align: center;
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    color: var(--ghost);
  }
  .bp-load-more {
    display: block;
    width: 100%;
    margin: 0 0 16px;
    padding: 12px;
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gold);
    background: none;
    border: 1px solid var(--rule);
    border-radius: 6px;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  .bp-load-more:hover { border-color: var(--gold); }
`

// Glencairn empty state icon
function GlencairnEmpty() {
  return (
    <svg className="bp-empty-icon" width="48" height="60" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2 C10 2 4 10 4 18 C4 24 8 28 13 29 L13 36 L10 36 L10 38 L22 38 L22 36 L19 36 L19 29 C24 28 28 24 28 18 C28 10 22 2 22 2 Z" stroke="var(--ghost)" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    </svg>
  )
}

export default function ScoutTab({ searchQuery = '' }) {
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [distilleryFilter, setDistilleryFilter] = useState('All')
  const [location, setLocation] = useState(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const LIMIT = 20

  // Request geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationDenied(true),
      { timeout: 5000 }
    )
  }, [])

  const fetchPicks = useCallback(async (newOffset = 0, append = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(newOffset),
        status: 'available,low,coming_soon',
      })
      if (location) {
        params.set('lat', String(location.lat))
        params.set('lng', String(location.lng))
      }
      if (distilleryFilter !== 'All') {
        params.set('distillery', distilleryFilter)
      }

      const res = await fetch(`/api/barrel-picks?${params}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      const fetched = data.picks || []

      setPicks(prev => append ? [...prev, ...fetched] : fetched)
      setHasMore(fetched.length === LIMIT)
      setOffset(newOffset + fetched.length)
    } catch (err) {
      console.error('ScoutTab fetch:', err)
      if (!append) setPicks([])
    }
    setLoading(false)
  }, [location, distilleryFilter])

  // Fetch when location resolves or filter changes
  useEffect(() => {
    // Only fetch once we know location status (resolved or denied)
    if (location !== null || locationDenied) {
      setOffset(0)
      fetchPicks(0, false)
    }
  }, [location, locationDenied, distilleryFilter])

  function handleReported(pickId, reportCounts) {
    setPicks(prev => prev.map(p =>
      p.id === pickId ? { ...p, reports_count: reportCounts } : p
    ))
  }

  // Client-side search filter
  const filteredPicks = searchQuery
    ? picks.filter(p => {
        const q = searchQuery.toLowerCase()
        return (
          (p.brand || '').toLowerCase().includes(q) ||
          (p.distillery || '').toLowerCase().includes(q) ||
          (p.expression || '').toLowerCase().includes(q)
        )
      })
    : picks

  return (
    <>
      <style>{SECTION_STYLES}</style>

      <div className="bp-section">
        {/* Section header */}
        <div className="bp-section-header">
          <span className="bp-section-label">Barrel Picks Near You</span>
          <div className="bp-section-rule" />
        </div>

        {/* Location denied banner */}
        {locationDenied && (
          <div className="bp-location-banner">
            Enable location for nearby picks
          </div>
        )}

        {/* Distillery filter chips */}
        <div className="bp-distillery-row">
          {DISTILLERY_FILTERS.map(d => (
            <button
              key={d}
              className={`bp-distillery-chip${distilleryFilter === d ? ' active' : ''}`}
              onClick={() => setDistilleryFilter(d)}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Pick cards */}
        <div className="bp-picks-list">
          {loading && picks.length === 0 ? (
            <div className="bp-loading">LOADING PICKS...</div>
          ) : filteredPicks.length === 0 ? (
            <div className="bp-empty">
              <GlencairnEmpty />
              <div className="bp-empty-headline">No barrel picks nearby</div>
              <div className="bp-empty-sub">
                Check back soon — stores are adding picks to Dram Scout
              </div>
            </div>
          ) : (
            <>
              {filteredPicks.map(pick => (
                <BarrelPickCard
                  key={pick.id}
                  pick={pick}
                  onReported={handleReported}
                />
              ))}
              {hasMore && !searchQuery && (
                <button
                  className="bp-load-more"
                  onClick={() => fetchPicks(offset, true)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load more picks'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
