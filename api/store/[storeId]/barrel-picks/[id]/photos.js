import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST   /api/store/:storeId/barrel-picks/:id/photos
//   Body: { urls: string[] } — public URLs already uploaded to Supabase Storage
//   by the frontend using the authenticated Supabase client directly.
//   Appends URLs to photo_urls array; sets primary_photo_url if not yet set.
//   Max 5 photos total.
//
// DELETE /api/store/:storeId/barrel-picks/:id/photos
//   Body: { url: string } — remove a specific photo URL, delete from storage.

export default async function handler(req, res) {
  const { storeId, id } = req.query

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' })

  if (user.id !== storeId) return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'POST') return handleAddPhotos(storeId, id, req, res)
  if (req.method === 'DELETE') return handleRemovePhoto(storeId, id, req, res)
  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleAddPhotos(storeId, id, req, res) {
  const { urls } = req.body || {}
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls array is required' })
  }

  const { data: pick, error: fetchError } = await supabaseAdmin
    .from('barrel_picks')
    .select('id, photo_urls, primary_photo_url')
    .eq('id', id)
    .eq('store_id', storeId)
    .single()

  if (fetchError || !pick) return res.status(404).json({ error: 'Pick not found' })

  const existing = pick.photo_urls || []
  const slotsLeft = 5 - existing.length
  if (slotsLeft <= 0) {
    return res.status(400).json({ error: 'Maximum 5 photos already reached' })
  }

  const newUrls = urls.slice(0, slotsLeft)
  const updatedUrls = [...existing, ...newUrls]
  const primaryUrl = pick.primary_photo_url || updatedUrls[0]

  const { data, error } = await supabaseAdmin
    .from('barrel_picks')
    .update({ photo_urls: updatedUrls, primary_photo_url: primaryUrl })
    .eq('id', id)
    .eq('store_id', storeId)
    .select('photo_urls, primary_photo_url')
    .single()

  if (error) {
    console.error('barrel-picks photos POST:', error.message)
    return res.status(500).json({ error: 'Failed to update photo URLs' })
  }

  return res.status(200).json({ photo_urls: data.photo_urls, primary_photo_url: data.primary_photo_url })
}

async function handleRemovePhoto(storeId, id, req, res) {
  const { url } = req.body || {}
  if (!url) return res.status(400).json({ error: 'url is required' })

  const { data: pick, error: fetchError } = await supabaseAdmin
    .from('barrel_picks')
    .select('id, photo_urls, primary_photo_url')
    .eq('id', id)
    .eq('store_id', storeId)
    .single()

  if (fetchError || !pick) return res.status(404).json({ error: 'Pick not found' })

  const updatedUrls = (pick.photo_urls || []).filter(u => u !== url)
  const newPrimary = url === pick.primary_photo_url
    ? (updatedUrls[0] || null)
    : pick.primary_photo_url

  // Delete from Supabase Storage
  const match = url.match(/barrel-pick-photos\/(.+)$/)
  if (match) {
    const storagePath = match[1]
    const { error: storageError } = await supabaseAdmin.storage
      .from('barrel-pick-photos')
      .remove([storagePath])
    if (storageError) {
      console.error('barrel-picks photo storage delete:', storageError.message)
    }
  }

  const { data, error } = await supabaseAdmin
    .from('barrel_picks')
    .update({ photo_urls: updatedUrls, primary_photo_url: newPrimary })
    .eq('id', id)
    .eq('store_id', storeId)
    .select('photo_urls, primary_photo_url')
    .single()

  if (error) {
    console.error('barrel-picks photos DELETE:', error.message)
    return res.status(500).json({ error: 'Failed to update photo URLs' })
  }

  return res.status(200).json({ photo_urls: data.photo_urls, primary_photo_url: data.primary_photo_url })
}
