import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// PATCH  /api/store/:storeId/barrel-picks/:id — partial update
// DELETE /api/store/:storeId/barrel-picks/:id — hard delete (+ storage cleanup)
export default async function handler(req, res) {
  const { storeId, id } = req.query

  // Auth required
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' })

  if (user.id !== storeId) return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'PATCH') return handleUpdate(storeId, id, req, res)
  if (req.method === 'DELETE') return handleDelete(storeId, id, res)
  return res.status(405).json({ error: 'Method not allowed' })
}

const MUTABLE_FIELDS = [
  'distillery', 'brand', 'expression', 'barrel_number', 'warehouse_rick',
  'age_stated', 'proof', 'vintage_year', 'label_name', 'selected_by',
  'selection_date', 'arrival_date', 'price_per_bottle', 'bottles_total',
  'bottles_remaining', 'msrp', 'store_notes', 'tasting_notes', 'status',
  'photo_urls', 'primary_photo_url',
]

async function handleUpdate(storeId, id, req, res) {
  const body = req.body || {}
  const updates = {}

  for (const field of MUTABLE_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' })
  }

  // Auto-set sold_out if bottles_remaining becomes 0
  if (updates.bottles_remaining === 0) {
    updates.status = 'sold_out'
  }

  const { data, error } = await supabaseAdmin
    .from('barrel_picks')
    .update(updates)
    .eq('id', id)
    .eq('store_id', storeId)
    .select()
    .single()

  if (error) {
    console.error('store barrel-picks PATCH:', error.message)
    return res.status(500).json({ error: 'Failed to update pick' })
  }

  if (!data) return res.status(404).json({ error: 'Pick not found' })

  return res.status(200).json({ pick: data })
}

async function handleDelete(storeId, id, res) {
  // Fetch pick first to get photo_urls for storage cleanup
  const { data: pick, error: fetchError } = await supabaseAdmin
    .from('barrel_picks')
    .select('id, photo_urls')
    .eq('id', id)
    .eq('store_id', storeId)
    .single()

  if (fetchError || !pick) {
    return res.status(404).json({ error: 'Pick not found' })
  }

  // Delete associated storage objects
  if (pick.photo_urls && pick.photo_urls.length > 0) {
    const storagePaths = pick.photo_urls.map(url => {
      // Extract path from public URL: .../barrel-pick-photos/{path}
      const match = url.match(/barrel-pick-photos\/(.+)$/)
      return match ? match[1] : null
    }).filter(Boolean)

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('barrel-pick-photos')
        .remove(storagePaths)

      if (storageError) {
        console.error('barrel-picks storage delete:', storageError.message)
        // Continue with DB delete even if storage cleanup partially fails
      }
    }
  }

  // Hard delete the pick
  const { error: deleteError } = await supabaseAdmin
    .from('barrel_picks')
    .delete()
    .eq('id', id)
    .eq('store_id', storeId)

  if (deleteError) {
    console.error('store barrel-picks DELETE:', deleteError.message)
    return res.status(500).json({ error: 'Failed to delete pick' })
  }

  return res.status(200).json({ deleted: true })
}
