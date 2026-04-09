import { useState, useEffect } from 'react'
import { supabase, fetchPickComments, postPickComment, deletePickComment, deletePickCommentAsOwner, fetchUserHandle } from '../supabase.js'

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
    cursor: pointer;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    min-height: 150px;
  }
  .bp-card:hover { border-color: var(--gold); }

  /* ── Photo column (left) ── */
  .bp-photo-col {
    width: 110px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    background: var(--card-2);
  }
  .bp-photo-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .bp-photo-placeholder {
    width: 110px;
    flex-shrink: 0;
    background: var(--card-2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .bp-photo-placeholder-text {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 8px;
    letter-spacing: 1.5px;
    color: var(--ghost);
    text-transform: uppercase;
    text-align: center;
    padding: 0 6px;
  }
  .bp-photo-dots {
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
  }
  .bp-photo-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255,255,255,0.4);
    transition: background 0.2s;
  }
  .bp-photo-dot.active { background: rgba(255,255,255,0.9); }

  /* ── Card body (right column) ── */
  .bp-body { flex: 1; min-width: 0; padding: 10px 12px; overflow: hidden; }

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

  .bp-comment-count {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px;
    color: var(--ghost);
    display: flex;
    align-items: center;
    gap: 3px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ── Lightbox ── */
  .bp-lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.95);
    z-index: 9200;
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

  /* ── Detail modal ── */
  .bp-detail-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.85);
    z-index: 9050;
    display: flex; align-items: center; justify-content: center;
    padding: 20px; box-sizing: border-box;
  }
  .bp-detail-modal {
    background: var(--card);
    border: 1px solid var(--worn);
    border-radius: 16px;
    overflow: hidden;
    display: flex; flex-direction: row;
    max-width: 880px; width: 100%;
    max-height: 88vh;
    position: relative;
  }
  .bp-detail-close {
    position: absolute; top: 14px; right: 14px;
    font-size: 18px; color: var(--paper);
    background: rgba(0,0,0,0.55); border: none; cursor: pointer;
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    z-index: 2; line-height: 1;
  }
  .bp-detail-photo-sec {
    width: 45%; flex-shrink: 0; position: relative;
    background: var(--card-2); overflow: hidden;
    min-height: 300px;
  }
  .bp-detail-photo-img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    cursor: zoom-in;
  }
  .bp-detail-photo-ph {
    width: 100%; height: 100%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
  }
  .bp-detail-photo-ph-text {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px; letter-spacing: 1.5px; color: var(--ghost);
    text-transform: uppercase;
  }
  .bp-detail-prev, .bp-detail-next {
    position: absolute; top: 50%; transform: translateY(-50%);
    font-size: 26px; color: rgba(255,255,255,0.75);
    background: rgba(0,0,0,0.4); border: none; cursor: pointer;
    padding: 8px 10px; border-radius: 4px; line-height: 1; z-index: 1;
    user-select: none;
  }
  .bp-detail-prev { left: 8px; }
  .bp-detail-next { right: 8px; }
  .bp-detail-photo-dots {
    position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 6px;
  }
  .bp-detail-photo-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.35); cursor: pointer; transition: background 0.2s;
  }
  .bp-detail-photo-dot.active { background: rgba(255,255,255,0.9); }
  .bp-detail-info {
    flex: 1; overflow-y: auto; padding: 24px 20px;
    min-width: 0; display: flex; flex-direction: column;
  }
  .bp-detail-row1 {
    display: flex; align-items: flex-start;
    justify-content: space-between; margin-bottom: 6px; gap: 8px;
  }
  .bp-detail-brand {
    font-family: 'Playfair Display', 'Cormorant Garamond', serif;
    font-weight: 700; font-size: 22px; color: var(--paper);
    flex: 1; min-width: 0;
  }
  .bp-detail-row2 {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 11px; color: var(--ghost);
    margin-bottom: 12px; letter-spacing: 0.03em;
  }
  .bp-detail-row3 {
    display: flex; align-items: baseline;
    justify-content: space-between; margin-bottom: 10px;
  }
  .bp-detail-proof {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 10px; color: var(--gold); letter-spacing: 1px; text-transform: uppercase;
  }
  .bp-detail-price-block { text-align: right; }
  .bp-detail-price {
    font-family: 'Playfair Display', 'Cormorant Garamond', serif;
    font-weight: 700; font-size: 20px; color: var(--gold-light);
  }
  .bp-detail-msrp {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 10px; color: var(--ghost);
    text-decoration: line-through; display: block; text-align: right;
  }
  .bp-detail-row4 {
    font-family: 'Libre Baskerville', 'Cormorant Garamond', serif;
    font-style: italic; font-size: 13px; color: var(--parchment); margin-bottom: 10px;
  }
  .bp-detail-notes {
    font-family: 'Libre Baskerville', 'Cormorant Garamond', serif;
    font-size: 13px; color: var(--ghost); margin-bottom: 12px; line-height: 1.6;
  }
  .bp-detail-chips {
    display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 14px;
  }
  .bp-detail-divider {
    border: none; border-top: 1px solid var(--rule); margin: 10px 0;
  }
  .bp-detail-footer {
    display: flex; align-items: flex-start; justify-content: space-between; margin-top: auto;
  }
  .bp-detail-store-name {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 11px; color: var(--parchment); display: flex; align-items: center; gap: 6px;
  }
  .bp-detail-store-dist {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 10px; color: var(--ghost); margin-top: 2px; padding-left: 12px;
  }
  @media (max-width: 640px) {
    .bp-detail-overlay { padding: 0; align-items: flex-end; }
    .bp-detail-modal {
      flex-direction: column;
      max-height: 95vh; border-radius: 16px 16px 0 0;
      width: 100%; max-width: 100%;
    }
    .bp-detail-photo-sec { width: 100%; height: 260px; flex-shrink: 0; min-height: unset; }
    .bp-detail-close { top: 10px; right: 10px; }
  }

  /* ── Comments ── */
  .bp-comments { margin-top: 4px; }
  .bp-comments-header {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--ghost); margin-bottom: 10px;
  }
  .bp-comments-empty {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 10px; color: var(--ghost); padding: 8px 0;
  }
  .bp-comments-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
  .bp-comment {
    padding: 8px 10px;
    background: var(--card-2);
    border-radius: 6px;
    border: 1px solid var(--rule);
  }
  .bp-comment-meta {
    display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;
  }
  .bp-comment-handle {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 10px; color: var(--gold); font-weight: 600;
  }
  .bp-comment-time {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px; color: var(--ghost);
  }
  .bp-comment-del {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 11px; color: var(--ghost);
    background: none; border: none; cursor: pointer; padding: 0;
    margin-left: auto; line-height: 1; transition: color 0.15s;
  }
  .bp-comment-del:hover { color: var(--urgent); }
  .bp-comment-body {
    font-family: 'Libre Baskerville', 'Cormorant Garamond', serif;
    font-size: 12px; color: var(--parchment); line-height: 1.5;
  }
  .bp-comment-form { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
  .bp-comment-input {
    width: 100%; box-sizing: border-box;
    background: var(--card-2); border: 1px solid var(--rule);
    border-radius: 6px; color: var(--paper);
    font-family: 'Libre Baskerville', 'Cormorant Garamond', serif;
    font-size: 12px; padding: 8px 10px; resize: none; outline: none;
    transition: border-color 0.2s;
  }
  .bp-comment-input:focus { border-color: var(--gold); }
  .bp-comment-input::placeholder { color: var(--ghost); }
  .bp-comment-submit {
    align-self: flex-end;
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase;
    background: var(--gold); color: var(--card); border: none;
    border-radius: 4px; padding: 6px 14px; cursor: pointer;
    transition: opacity 0.2s; font-weight: 600;
  }
  .bp-comment-submit:disabled { opacity: 0.45; cursor: default; }
  .bp-comment-submit:not(:disabled):hover { opacity: 0.85; }
  .bp-comment-signin {
    font-family: 'DM Mono', 'Courier Prime', monospace;
    font-size: 10px; color: var(--ghost);
    padding: 8px 0; margin-top: 4px;
  }
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

export default function BarrelPickCard({ pick, session, defaultDetailOpen, onDetailClose }) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [detailOpen, setDetailOpen] = useState(defaultDetailOpen || false)
  const [detailPhotoIndex, setDetailPhotoIndex] = useState(0)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [commentPosting, setCommentPosting] = useState(false)
  const [userHandle, setUserHandle] = useState(null)
  const [localSession, setLocalSession] = useState(null)

  // Self-fetch session so commenting works regardless of whether parent passes session prop
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLocalSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setLocalSession(sess)
    })
    return () => subscription.unsubscribe()
  }, [])

  const activeSession = localSession || session
  const isStoreOwner = Boolean(pick.store_id && activeSession?.user?.id === pick.store_id)

  useEffect(() => {
    if (!detailOpen || !pick.comments_enabled) return
    setCommentsLoading(true)
    fetchPickComments(pick.id).then(setComments).finally(() => setCommentsLoading(false))
  }, [detailOpen, pick.id, pick.comments_enabled])

  useEffect(() => {
    if (!activeSession?.user?.id) return
    fetchUserHandle(activeSession.user.id).then(h => setUserHandle(h))
  }, [activeSession?.user?.id])

  async function handlePostComment() {
    if (!activeSession?.user?.id || !commentInput.trim()) return
    const handle = userHandle || activeSession.user.email?.split('@')[0] || 'User'
    setCommentPosting(true)
    const newComment = await postPickComment(pick.id, activeSession.user.id, handle, commentInput.trim())
    if (newComment) {
      setComments(prev => [...prev, newComment])
      setCommentInput('')
    }
    setCommentPosting(false)
  }

  async function handleDeleteComment(commentId, commentUserId) {
    let result
    if (isStoreOwner) {
      result = await deletePickCommentAsOwner(commentId)
    } else {
      result = await deletePickComment(commentId, activeSession.user.id)
    }
    if (result.ok) setComments(prev => prev.filter(c => c.id !== commentId))
  }

  function formatCommentTime(ts) {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const photos = pick.photo_urls || []
  const hasPhotos = photos.length > 0

  function openLightbox(idx) {
    setLightboxIndex(idx)
    setLightboxOpen(true)
  }

  function advancePhoto() {
    if (photos.length <= 1) return
    setPhotoIndex(i => (i + 1) % photos.length)
  }

  const row2Parts = [pick.distillery, pick.expression].filter(Boolean)
  if (pick.age_stated) row2Parts.push(`${pick.age_stated}yr`)

  const visibleChips = (pick.tasting_notes || []).slice(0, 5)
  const extraChips = Math.max(0, (pick.tasting_notes || []).length - 5)

  return (
    <>
      <style>{CARD_STYLES}</style>

      <div className="bp-card" onClick={() => setDetailOpen(true)}>
        {/* ── Photo column (left) ── */}
        {hasPhotos ? (
          <div className="bp-photo-col">
            <img
              className="bp-photo-img"
              src={photos[photoIndex]}
              alt={`${pick.brand} barrel pick`}
              loading="lazy"
            />
            {photos.length > 1 && (
              <div className="bp-photo-dots">
                {photos.map((_, i) => (
                  <div key={i} className={`bp-photo-dot${i === photoIndex ? ' active' : ''}`} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bp-photo-placeholder">
            <GlencairnIcon />
            <span className="bp-photo-placeholder-text">No Photo</span>
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
                <button className="bp-notes-toggle" onClick={e => { e.stopPropagation(); setNotesExpanded(v => !v) }}>
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

            {pick.comments_count > 0 && (
              <span className="bp-comment-count">
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M2 2h10v8H8l-3 2v-2H2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
                </svg>
                {pick.comments_count}
              </span>
            )}

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

      {/* ── Detail modal ── */}
      {detailOpen && (
        <div className="bp-detail-overlay" onClick={() => { setDetailOpen(false); onDetailClose?.() }}>
          <div className="bp-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="bp-detail-close" onClick={() => { setDetailOpen(false); onDetailClose?.() }}>✕</button>

            {/* Photo section */}
            <div className="bp-detail-photo-sec">
              {hasPhotos ? (
                <>
                  <img
                    className="bp-detail-photo-img"
                    src={photos[detailPhotoIndex]}
                    alt={`${pick.brand} barrel pick`}
                    onClick={() => openLightbox(detailPhotoIndex)}
                  />
                  {photos.length > 1 && (
                    <>
                      <button
                        className="bp-detail-prev"
                        onClick={e => { e.stopPropagation(); setDetailPhotoIndex(i => (i - 1 + photos.length) % photos.length) }}
                      >‹</button>
                      <button
                        className="bp-detail-next"
                        onClick={e => { e.stopPropagation(); setDetailPhotoIndex(i => (i + 1) % photos.length) }}
                      >›</button>
                      <div className="bp-detail-photo-dots">
                        {photos.map((_, i) => (
                          <div
                            key={i}
                            className={`bp-detail-photo-dot${i === detailPhotoIndex ? ' active' : ''}`}
                            onClick={e => { e.stopPropagation(); setDetailPhotoIndex(i) }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="bp-detail-photo-ph">
                  <GlencairnIcon color="var(--worn)" />
                  <span className="bp-detail-photo-ph-text">No Photo</span>
                </div>
              )}
            </div>

            {/* Info section */}
            <div className="bp-detail-info">
              {/* Row 1: brand + status */}
              <div className="bp-detail-row1">
                <span className="bp-detail-brand">{pick.brand}</span>
                <span className={`bp-status-badge bp-status-${pick.status}`}>
                  {STATUS_LABEL[pick.status] || pick.status}
                </span>
              </div>

              {/* Row 2: distillery · expression · age */}
              {row2Parts.length > 0 && (
                <div className="bp-detail-row2">{row2Parts.join(' · ')}</div>
              )}

              {/* Row 3: proof + price */}
              <div className="bp-detail-row3">
                <span className="bp-detail-proof">{pick.proof}° PROOF</span>
                <div className="bp-detail-price-block">
                  {pick.price_per_bottle && (
                    <span className="bp-detail-price">${Number(pick.price_per_bottle).toFixed(2)}</span>
                  )}
                  {pick.msrp && (
                    <span className="bp-detail-msrp">MSRP ${Number(pick.msrp).toFixed(2)}</span>
                  )}
                </div>
              </div>

              {/* Row 4: label · barrel */}
              {(pick.label_name || pick.barrel_number) && (
                <div className="bp-detail-row4">
                  {[pick.label_name && `"${pick.label_name}"`, pick.barrel_number && `Barrel #${pick.barrel_number}`]
                    .filter(Boolean).join(' · ')}
                </div>
              )}

              {/* Store notes — fully expanded */}
              {pick.store_notes && (
                <div className="bp-detail-notes">{pick.store_notes}</div>
              )}

              {/* All tasting chips */}
              {(pick.tasting_notes || []).length > 0 && (
                <div className="bp-detail-chips">
                  {(pick.tasting_notes || []).map(note => (
                    <span key={note} className="bp-tasting-chip">{note}</span>
                  ))}
                </div>
              )}

              <hr className="bp-detail-divider" />

              {/* Footer: store info + report button */}
              <div className="bp-detail-footer">
                <div className="bp-store-info">
                  <div className="bp-detail-store-name">
                    <span className="bp-store-dot" />
                    {pick.store_name || 'Local Store'}
                  </div>
                  {pick.distance_miles != null && (
                    <div className="bp-detail-store-dist">{pick.distance_miles} mi away</div>
                  )}
                </div>
                <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
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

              {/* Comments section */}
              {pick.comments_enabled && (
                <div className="bp-comments">
                  <hr className="bp-detail-divider" />
                  <div className="bp-comments-header">Comments</div>
                  {commentsLoading ? (
                    <div className="bp-comments-empty">Loading…</div>
                  ) : comments.length === 0 ? (
                    <div className="bp-comments-empty">No comments yet.</div>
                  ) : (
                    <div className="bp-comments-list">
                      {comments.map(c => (
                        <div key={c.id} className="bp-comment">
                          <div className="bp-comment-meta">
                            <span className="bp-comment-handle">{c.handle}</span>
                            <span className="bp-comment-time">{formatCommentTime(c.created_at)}</span>
                            {(activeSession?.user?.id === c.user_id || isStoreOwner) && (
                              <button
                                className="bp-comment-del"
                                onClick={() => handleDeleteComment(c.id, c.user_id)}
                              >×</button>
                            )}
                          </div>
                          <div className="bp-comment-body">{c.body}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeSession ? (
                    <div className="bp-comment-form">
                      <textarea
                        className="bp-comment-input"
                        placeholder="Add a comment…"
                        value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                        rows={2}
                        maxLength={1000}
                      />
                      <button
                        className="bp-comment-submit"
                        onClick={handlePostComment}
                        disabled={commentPosting || !commentInput.trim()}
                      >
                        {commentPosting ? 'Posting…' : 'Post'}
                      </button>
                    </div>
                  ) : (
                    <div className="bp-comment-signin">Sign in to leave a comment.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
