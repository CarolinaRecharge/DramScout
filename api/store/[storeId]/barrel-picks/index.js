import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET  /api/store/:storeId/barrel-picks — all picks for store (auth, store staff only)
// POST /api/store/:storeId/barrel-picks — create new pick in draft state
export default async function handler(req, res) {
  const { storeId } = req.query

  // Auth required for all store routes
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' })

  // Verify store ownership — store_id = auth.uid() (matching existing pattern)
  if (user.id !== storeId) return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') return handleList(storeId, res)
  if (req.method === 'POST') return handleCreate(storeId, user.id, req, res)
  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleList(storeId, res) {
  const { data, error } = await supabaseAdmin
    .from('barrel_picks')
    .select(`
      *,
      barrel_pick_reports ( id, report_type )
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('store barrel-picks GET:', error.message)
    return res.status(500).json({ error: 'Failed to fetch picks' })
  }

  const picks = (data || []).map(pick => ({
    ...pick,
    reports_count: (pick.barrel_pick_reports || []).reduce((acc, r) => {
      acc[r.report_type] = (acc[r.report_type] || 0) + 1
      return acc
    }, {}),
  }))

  return res.status(200).json({ picks })
}

const MUTABLE_FIELDS = [
  'distillery', 'brand', 'expression', 'barrel_number', 'warehouse_rick',
  'age_stated', 'proof', 'vintage_year', 'label_name', 'selected_by',
  'selection_date', 'arrival_date', 'price_per_bottle', 'bottles_total',
  'bottles_remaining', 'msrp', 'store_notes', 'tasting_notes', 'status',
]

async function handleCreate(storeId, userId, req, res) {
  const body = req.body || {}

  if (!body.distillery || !body.brand || !body.proof) {
    return res.status(400).json({ error: 'distillery, brand, and proof are required' })
  }

  const insertData = { store_id: storeId, created_by: userId, is_published: false }
  for (const field of MUTABLE_FIELDS) {
    if (body[field] !== undefined) insertData[field] = body[field]
  }

  // Auto-set sold_out if bottles_remaining is 0
  if (insertData.bottles_remaining === 0) {
    insertData.status = 'sold_out'
  }

  const { data, error } = await supabaseAdmin
    .from('barrel_picks')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('store barrel-picks POST:', error.code, error.message)
    // 42P01 = undefined_table (migration not yet run in Supabase)
    const msg = error.code === '42P01'
      ? 'Table not found — run migration 012_barrel_picks.sql in Supabase SQL editor'
      : error.message || 'Failed to create pick'
    return res.status(500).json({ error: msg })
  }

  return res.status(201).json({ pick: data })
}
