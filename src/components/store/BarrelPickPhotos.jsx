import { useState, useRef } from 'react'
import { supabase } from '../../supabase.js'

const styles = `
  .bpp-root {
    background: var(--dark-3);
    border: 1px solid var(--bark);
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 28px;
  }

  .bpp-legend {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--bark);
  }

  .bpp-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }

  /* Photo tile */
  .bpp-tile {
    position: relative;
    aspect-ratio: 1;
    border-radius: 4px;
    overflow: hidden;
    background: var(--dark-4);
  }
  .bpp-tile img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* Primary badge */
  .bpp-primary-badge {
    position: absolute;
    top: 5px;
    left: 5px;
    font-family: 'DM Mono', monospace;
    font-size: 7px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    background: var(--amber);
    color: var(--dark);
    padding: 2px 6px;
    border-radius: 2px;
    font-weight: 600;
    pointer-events: none;
  }

  /* Hover overlay */
  .bpp-tile-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .bpp-tile:hover .bpp-tile-overlay { opacity: 1; }

  .bpp-overlay-btn {
    background: rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 4px;
    color: var(--cream);
    font-size: 14px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .bpp-overlay-btn:hover { background: rgba(0,0,0,0.85); border-color: rgba(255,255,255,0.5); }
  .bpp-overlay-btn.star:hover { border-color: var(--amber); color: var(--amber); }
  .bpp-overlay-btn.trash:hover { border-color: var(--red); color: var(--red); }

  /* Progress overlay on uploading tile */
  .bpp-tile-progress {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .bpp-progress-bar-track {
    width: 70%;
    height: 3px;
    background: rgba(255,255,255,0.15);
    border-radius: 2px;
    overflow: hidden;
  }
  .bpp-progress-bar-fill {
    height: 100%;
    background: var(--amber);
    border-radius: 2px;
    transition: width 0.2s;
  }
  .bpp-progress-label {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--cream);
    letter-spacing: 1px;
  }

  /* Add photo tile */
  .bpp-add-tile {
    aspect-ratio: 1;
    border: 2px dashed var(--bark);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: border-color 0.2s;
    background: var(--dark-4);
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    user-select: none;
  }
  .bpp-add-tile:hover { border-color: var(--amber); color: var(--amber); }
  .bpp-add-icon { font-size: 20px; line-height: 1; }

  .bpp-helper {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--muted);
    letter-spacing: 0.05em;
    line-height: 1.5;
  }

  .bpp-tile-error {
    position: absolute;
    inset: 0;
    background: rgba(139,46,46,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--cream);
    text-align: center;
    padding: 8px;
    letter-spacing: 0.03em;
  }
`

export default function BarrelPickPhotos({ pick, storeId, session, onUpdate }) {
  const fileInputRef = useRef(null)
  const [uploadQueue, setUploadQueue] = useState([]) // { file, preview, progress, error }
  const [deleting, setDeleting] = useState(null) // url being deleted

  const photos = pick?.photo_urls || []
  const primaryUrl = pick?.primary_photo_url || null
  const slotsLeft = 5 - photos.length

  function handleAddClick() {
    if (slotsLeft <= 0) return
    fileInputRef.current?.click()
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []).slice(0, slotsLeft)
    e.target.value = ''
    if (files.length === 0) return

    const queue = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      error: null,
    }))
    setUploadQueue(queue)
    uploadFiles(queue)
  }

  async function uploadFiles(queue) {
    const token = session?.access_token
    const uploadedUrls = []

    for (const item of queue) {
      if (item.file.size > 8 * 1024 * 1024) {
        setUploadQueue(prev =>
          prev.map(q => q.id === item.id ? { ...q, error: 'File too large (max 8MB)' } : q)
        )
        continue
      }

      const ext = item.file.name.split('.').pop().toLowerCase() || 'jpg'
      const filename = `${crypto.randomUUID()}.${ext}`
      const storagePath = `${storeId}/${pick.id}/${filename}`

      try {
        setUploadQueue(prev =>
          prev.map(q => q.id === item.id ? { ...q, progress: 30 } : q)
        )

        const { data, error } = await supabase.storage
          .from('barrel-pick-photos')
          .upload(storagePath, item.file, { contentType: item.file.type, upsert: false })

        if (error) throw error

        setUploadQueue(prev =>
          prev.map(q => q.id === item.id ? { ...q, progress: 80 } : q)
        )

        const { data: urlData } = supabase.storage
          .from('barrel-pick-photos')
          .getPublicUrl(storagePath)

        uploadedUrls.push(urlData.publicUrl)

        setUploadQueue(prev =>
          prev.map(q => q.id === item.id ? { ...q, progress: 100 } : q)
        )
      } catch (err) {
        setUploadQueue(prev =>
          prev.map(q => q.id === item.id ? { ...q, error: err.message || 'Upload failed' } : q)
        )
      }
    }

    if (uploadedUrls.length > 0) {
      // Register URLs with the backend
      const res = await fetch(`/api/store/${storeId}/barrel-picks/${pick.id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ urls: uploadedUrls }),
      })
      if (res.ok) {
        const data = await res.json()
        onUpdate && onUpdate({ photo_urls: data.photo_urls, primary_photo_url: data.primary_photo_url })
      }
    }

    // Clear completed uploads after a brief delay
    setTimeout(() => {
      setUploadQueue(prev => prev.filter(q => q.error !== null))
    }, 1500)
  }

  async function handleSetPrimary(url) {
    const token = session?.access_token
    const res = await fetch(`/api/store/${storeId}/barrel-picks/${pick.id}/primary-photo`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url }),
    })
    if (res.ok) {
      const data = await res.json()
      onUpdate && onUpdate({ photo_urls: data.photo_urls, primary_photo_url: data.primary_photo_url })
    }
  }

  async function handleDeletePhoto(url) {
    setDeleting(url)
    const token = session?.access_token
    const res = await fetch(`/api/store/${storeId}/barrel-picks/${pick.id}/photos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url }),
    })
    if (res.ok) {
      const data = await res.json()
      onUpdate && onUpdate({ photo_urls: data.photo_urls, primary_photo_url: data.primary_photo_url })
    }
    setDeleting(null)
  }

  return (
    <div className="bpp-root">
      <style>{styles}</style>

      <div className="bpp-legend">Photos</div>

      <div className="bpp-grid">
        {/* Existing photos */}
        {photos.map(url => (
          <div key={url} className="bpp-tile">
            <img src={url} alt="barrel pick" loading="lazy" />
            {url === primaryUrl && (
              <span className="bpp-primary-badge">Primary</span>
            )}
            {deleting === url ? (
              <div className="bpp-tile-progress">
                <span className="bpp-progress-label">Deleting...</span>
              </div>
            ) : (
              <div className="bpp-tile-overlay">
                {url !== primaryUrl && (
                  <button
                    className="bpp-overlay-btn star"
                    title="Set as primary photo"
                    onClick={() => handleSetPrimary(url)}
                  >★</button>
                )}
                <button
                  className="bpp-overlay-btn trash"
                  title="Delete photo"
                  onClick={() => handleDeletePhoto(url)}
                >🗑</button>
              </div>
            )}
          </div>
        ))}

        {/* Uploading previews */}
        {uploadQueue.map(item => (
          <div key={item.id} className="bpp-tile">
            <img src={item.preview} alt="uploading" />
            {item.error ? (
              <div className="bpp-tile-error">{item.error}</div>
            ) : item.progress < 100 ? (
              <div className="bpp-tile-progress">
                <span className="bpp-progress-label">{item.progress}%</span>
                <div className="bpp-progress-bar-track">
                  <div className="bpp-progress-bar-fill" style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {/* Add photo slot */}
        {photos.length + uploadQueue.filter(q => !q.error).length < 5 && (
          <div className="bpp-add-tile" onClick={handleAddClick}>
            <span className="bpp-add-icon">+</span>
            <span>Add Photo</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <div className="bpp-helper">
        First photo is shown on the pick card. Tap ★ to change primary. Max 5 photos, 8MB each.
      </div>
    </div>
  )
}
