import { useState } from 'react'
import { supabase } from '../supabase.js'

// CSS tokens matching App.jsx (customer app) color scheme
// The spec uses store-portal token names; we map them to App.jsx tokens here.
const CARD_STYLES = `
  .bp-card {
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 12px;
    transition: border-color 0.2s;
    cursor: default;
  }
  .bp-card:hover { border-color: var(--gold); }

  /* ── Photo strip ── */
  .bp-photo-strip {
    position: relative;
    width: 100%;
    height: 180px;
    overflow: hidden;
    cursor: pointer;
    background: var(--card-2);
  }
  .bp-photo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .bp-photo-placeholder {
    width: 100%;
    height: 100px;
    background: var(--card-2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .bp-photo-placeholder-text {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    color: var(--ghost);
    text-transform: uppercase;
  }
  .bp-photo-dots {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 5px;
  }
  .bp-photo-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255,255,255,0.4);
    transition: background 0.2s;
  }
  .bp-photo-dot.active { background: rgba(255,255,255,0.9); }

  /* ── Card body ── */
  .bp-body { padding: 12px; }

  .bp-row-1 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  .bp-brand {
    font-family: 'Playfair Display', 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 16px;
    color: var(--paper);
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 8px;
  }
  .bp-status-badge {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 8px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 3px 7px;
    border-radius: 3px;
    border: 1px solid;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .bp-status-available { color: var(--fresh); border-color: var(--fresh); }
  .bp-status-low       { color: var(--gold); border-color: var(--gold); }
  .bp-status-sold_out  { color: var(--urgent); border-color: var(--urgent); }
  .bp-status-coming_soon { color: var(--ghost); border-color: var(--ghost); }

  .bp-row-2 {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 10px;
    color: var(--ghost);
    margin-bottom: 8px;
    letter-spacing: 0.03em;
  }

  .bp-row-3 {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .bp-proof {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    color: var(--gold);
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .bp-price-block { text-align: right; }
  .bp-price {
    font-family: 'Playfair Display', 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 15px;
    color: var(--gold-light);
  }
  .bp-msrp {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    color: var(--ghost);
    text-decoration: line-through;
    display: block;
    text-align: right;
  }

  .bp-row-4 {
    font-family: 'Libre Baskerville', 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 12px;
    color: var(--parchment);
    margin-bottom: 6px;
  }

  .bp-notes {
    font-family: 'Libre Baskerville', 'Cormorant Garamond', serif;
    font-size: 12px;
    color: var(--ghost);
    margin-bottom: 8px;
    line-height: 1.5;
  }
  .bp-notes-clamped {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .bp-notes-expanded { -webkit-line-clamp: unset; }
  .bp-notes-toggle {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    color: var(--gold);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-top: 2px;
    letter-spacing: 0.05em;
    display: block;
  }

  .bp-tasting-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 10px;
  }
  .bp-tasting-chip {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    letter-spacing: 0.05em;
    background: var(--card-2);
    border: 1px solid var(--rule);
    border-radius: 20px;
    padding: 3px 8px;
    color: var(--parchment);
  }

  .bp-divider {
    border: none;
    border-top: 1px solid var(--rule);
    margin: 8px 0;
  }

  .bp-footer {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }
  .bp-store-info { flex: 1; min-width: 0; }
  .bp-store-name {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 10px;
    color: var(--parchment);
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .bp-store-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--fresh);
    flex-shrink: 0;
  }
  .bp-store-dist {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    color: var(--ghost);
    margin-top: 2px;
    padding-left: 11px;
  }

  /* ── Report button ── */
  .bp-report-btn {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    letter-spacing: 0.05em;
    color: var(--ghost);
    background: none;
    border: 1px solid var(--worn);
    border-radius: 4px;
    padding: 5px 8px;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .bp-report-btn:hover { color: var(--gold); border-color: var(--gold); }
  .bp-report-btn.reported { color: var(--ghost); border-color: var(--rule); cursor: default; }

  .bp-report-popover {
    position: absolute;
    right: 0;
    bottom: calc(100% + 6px);
    background: var(--card-2);
    border: 1px solid var(--worn);
    border-radius: 8px;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 10;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    min-width: 150px;
  }
  .bp-report-option {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    letter-spacing: 0.05em;
    background: none;
    border: none;
    color: var(--parchment);
    padding: 6px 10px;
    cursor: pointer;
    text-align: left;
    border-radius: 4px;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .bp-report-option:hover { background: var(--card); }

  /* ── Lightbox ── */
  .bp-lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.95);
    z-index: 9000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    touch-action: pan-y;
  }
  .bp-lightbox-img {
    max-width: 100%;
    max-height: 85vh;
    object-fit: contain;
    user-select: none;
  }
  .bp-lightbox-close {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 22px;
    color: var(--paper);
    background: none;
    border: none;
    cursor: pointer;
    line-height: 1;
    padding: 4px;
    z-index: 1;
  }
  .bp-lightbox-dots {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
  }
  .bp-lightbox-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    cursor: pointer;
    transition: background 0.2s;
  }
  .bp-lightbox-dot.active { background: rgba(255,255,255,0.9); }
  .bp-lightbox-prev,
  .bp-lightbox-next {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 28px;
    color: rgba(255,255,255,0.6);
    background: none;
    border: none;
    cursor: pointer;
    padding: 12px;
    line-height: 1;
    user-select: none;
  }
  .bp-lightbox-prev { left: 8px; }
  .bp-lightbox-next { right: 8px; }
`

const STATUS_LABEL = {
  available:    'AVAILABLE',
  low:          'LOW STOCK',
  sold_out:     'SOLD OUT',
  coming_soon:  'COMING SOON',
}

// Glencairn glass SVG placeholder
function GlencairnIcon({ color = 'var(--worn)' }) {
  return (
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2 C10 2 4 10 4 18 C4 24 8 28 13 29 L13 36 L10 36 L10 38 L22 38 L22 36 L19 36 L19 29 C24 28 28 24 28 18 C28 10 22 2 22 2 Z" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    </svg>
  )
}

export default function BarrelPickCard({ pick, session, onReported }) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reported, setReported] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)

  const photos = pick.photo_urls || []
  const hasPhotos = photos.length > 0

  function openLightbox(idx) {
    setLightboxIndex(idx)
    setLightboxOpen(true)
  }

  function advancePhoto(e) {
    e.stopPropagation()
    if (photos.length <= 1) return
    const next = (photoIndex + 1) % photos.length
    setPhotoIndex(next)
  }

  async function submitReport(reportType) {
    if (reportLoading || reported) return
    setReportLoading(true)
    setReportOpen(false)
    try {
      const { data: { session: sess } } = await supabase.auth.getSession()
      const token = sess?.access_token
      if (!token) {
        alert('Sign in to report availability.')
        setReportLoading(false)
        return
      }
      const res = await fetch(`/api/barrel-picks/${pick.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ report_type: reportType }),
      })
      if (res.ok) {
        const data = await res.json()
        setReported(true)
        onReported && onReported(pick.id, data.reports_count)
      }
    } catch (err) {
      console.error('report error:', err)
    }
    setReportLoading(false)
  }

  const row2Parts = [pick.distillery, pick.expression].filter(Boolean)
  if (pick.age_stated) row2Parts.push(`${pick.age_stated}yr`)

  const visibleChips = (pick.tasting_notes || []).slice(0, 5)
  const extraChips = Math.max(0, (pick.tasting_notes || []).length - 5)

  return (
    <>
      <style>{CARD_STYLES}</style>

      <div className="bp-card">
        {/* ── Photo strip ── */}
        {hasPhotos ? (
          <div
            className="bp-photo-strip"
            onClick={() => openLightbox(photoIndex)}
          >
            <img
              className="bp-photo-img"
              src={photos[photoIndex]}
              alt={`${pick.brand} barrel pick`}
              loading="lazy"
            />
            {photos.length > 1 && (
              <>
                <div
                  className="bp-photo-strip"
                  style={{ position: 'absolute', inset: 0, background: 'transparent' }}
                  onClick={e => { e.stopPropagation(); advancePhoto(e) }}
                />
                <div className="bp-photo-dots">
                  {photos.map((_, i) => (
                    <div
                      key={i}
                      className={`bp-photo-dot${i === photoIndex ? ' active' : ''}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bp-photo-placeholder">
            <GlencairnIcon />
            <span className="bp-photo-placeholder-text">No Photo Yet</span>
          </div>
        )}

        {/* ── Card body ── */}
        <div className="bp-body">
          {/* Row 1: brand + status */}
          <div className="bp-row-1">
            <span className="bp-brand">{pick.brand}</span>
            <span className={`bp-status-badge bp-status-${pick.status}`}>
              {STATUS_LABEL[pick.status] || pick.status}
            </span>
          </div>

          {/* Row 2: distillery · expression · age */}
          {row2Parts.length > 0 && (
            <div className="bp-row-2">{row2Parts.join(' · ')}</div>
          )}

          {/* Row 3: proof + price */}
          <div className="bp-row-3">
            <span className="bp-proof">{pick.proof}° PROOF</span>
            <div className="bp-price-block">
              {pick.price_per_bottle && (
                <span className="bp-price">${Number(pick.price_per_bottle).toFixed(2)}</span>
              )}
              {pick.msrp && (
                <span className="bp-msrp">MSRP ${Number(pick.msrp).toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Row 4: label name · barrel number */}
          {(pick.label_name || pick.barrel_number) && (
            <div className="bp-row-4">
              {[pick.label_name && `"${pick.label_name}"`, pick.barrel_number && `Barrel #${pick.barrel_number}`]
                .filter(Boolean).join(' · ')}
            </div>
          )}

          {/* Store notes */}
          {pick.store_notes && (
            <div>
              <div className={`bp-notes${notesExpanded ? ' bp-notes-expanded' : ' bp-notes-clamped'}`}>
                {pick.store_notes}
              </div>
              {pick.store_notes.length > 100 && (
                <button className="bp-notes-toggle" onClick={() => setNotesExpanded(e => !e)}>
                  {notesExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {/* Tasting note chips */}
          {visibleChips.length > 0 && (
            <div className="bp-tasting-chips">
              {visibleChips.map(note => (
                <span key={note} className="bp-tasting-chip">{note}</span>
              ))}
              {extraChips > 0 && (
                <span className="bp-tasting-chip">+{extraChips} more</span>
              )}
            </div>
          )}

          <hr className="bp-divider" />

          {/* Footer */}
          <div className="bp-footer">
            <div className="bp-store-info">
              <div className="bp-store-name">
                <span className="bp-store-dot" />
                {pick.store_name || 'Local Store'}
              </div>
              {pick.distance_miles !== null && pick.distance_miles !== undefined && (
                <div className="bp-store-dist">{pick.distance_miles} mi away</div>
              )}
            </div>

            {/* Community report */}
            <div style={{ position: 'relative' }}>
              {reported ? (
                <button className="bp-report-btn reported">Reported ✓</button>
              ) : (
                <button
                  className="bp-report-btn"
                  onClick={() => setReportOpen(o => !o)}
                  disabled={reportLoading}
                >
                  👍 Still there?
                </button>
              )}
              {reportOpen && !reported && (
                <div className="bp-report-popover">
                  <button className="bp-report-option" onClick={() => submitReport('still_available')}>✓ Still Available</button>
                  <button className="bp-report-option" onClick={() => submitReport('low_stock')}>↓ Going Fast</button>
                  <button className="bp-report-option" onClick={() => submitReport('sold_out')}>✗ Sold Out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && photos.length > 0 && (
        <div className="bp-lightbox" onClick={() => setLightboxOpen(false)}>
          <button className="bp-lightbox-close" onClick={() => setLightboxOpen(false)}>✕</button>
          <img
            className="bp-lightbox-img"
            src={photos[lightboxIndex]}
            alt={`${pick.brand} photo ${lightboxIndex + 1}`}
            onClick={e => e.stopPropagation()}
          />
          {photos.length > 1 && (
            <>
              <button
                className="bp-lightbox-prev"
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + photos.length) % photos.length) }}
              >‹</button>
              <button
                className="bp-lightbox-next"
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % photos.length) }}
              >›</button>
              <div className="bp-lightbox-dots">
                {photos.map((_, i) => (
                  <div
                    key={i}
                    className={`bp-lightbox-dot${i === lightboxIndex ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); setLightboxIndex(i) }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
