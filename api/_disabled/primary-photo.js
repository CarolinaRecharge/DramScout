import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// PATCH /api/store/:storeId/barrel-picks/:id/primary-photo
// Body: { url: string } — promote an existing photo to primary position
export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  const { storeId, id } = req.query

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' })

  if (user.id !== storeId) return res.status(403).json({ error: 'Forbidden' })

  const { url } = req.body || {}
  if (!url) return res.status(400).json({ error: 'url is required' })

  const { data: pick, error: fetchError } = await supabaseAdmin
    .from('barrel_picks')
    .select('id, photo_urls')
    .eq('id', id)
    .eq('store_id', storeId)
    .single()

  if (fetchError || !pick) return res.status(404).json({ error: 'Pick not found' })

  if (!(pick.photo_urls || []).includes(url)) {
    return res.status(400).json({ error: 'URL not in photo_urls array' })
  }

  // Reorder photo_urls so the promoted URL is first
  const reordered = [url, ...(pick.photo_urls || []).filter(u => u !== url)]

  const { data, error } = await supabaseAdmin
    .from('barrel_picks')
    .update({ photo_urls: reordered, primary_photo_url: url })
    .eq('id', id)
    .eq('store_id', storeId)
    .select('photo_urls, primary_photo_url')
    .single()

  if (error) {
    console.error('barrel-picks primary-photo PATCH:', error.message)
    return res.status(500).json({ error: 'Failed to update primary photo' })
  }

  return res.status(200).json({ photo_urls: data.photo_urls, primary_photo_url: data.primary_photo_url })
}
