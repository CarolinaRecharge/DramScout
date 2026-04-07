import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// PATCH /api/store/:storeId/barrel-picks/:id/publish
// Toggles is_published. Validates required fields before allowing publish.
// Returns: { is_published, validation_errors } (validation_errors is null or array)
export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  const { storeId, id } = req.query

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' })

  if (user.id !== storeId) return res.status(403).json({ error: 'Forbidden' })

  const { data: pick, error: fetchError } = await supabaseAdmin
    .from('barrel_picks')
    .select('id, distillery, brand, proof, price_per_bottle, is_published')
    .eq('id', id)
    .eq('store_id', storeId)
    .single()

  if (fetchError || !pick) return res.status(404).json({ error: 'Pick not found' })

  const targetPublished = !pick.is_published

  // Validate required fields before allowing publish
  if (targetPublished) {
    const validationErrors = []
    if (!pick.distillery) validationErrors.push('distillery')
    if (!pick.brand) validationErrors.push('brand')
    if (!pick.proof) validationErrors.push('proof')
    if (!pick.price_per_bottle) validationErrors.push('price_per_bottle')

    if (validationErrors.length > 0) {
      return res.status(422).json({
        is_published: false,
        validation_errors: validationErrors,
      })
    }
  }

  const { data, error } = await supabaseAdmin
    .from('barrel_picks')
    .update({ is_published: targetPublished })
    .eq('id', id)
    .eq('store_id', storeId)
    .select('id, is_published')
    .single()

  if (error) {
    console.error('barrel-picks publish PATCH:', error.message)
    return res.status(500).json({ error: 'Failed to update publish status' })
  }

  return res.status(200).json({ is_published: data.is_published, validation_errors: null })
}
