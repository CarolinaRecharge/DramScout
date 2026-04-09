import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET  /api/barrel-picks/:id  — public detail
// POST /api/barrel-picks/:id/report  — community availability report (auth required)
export default async function handler(req, res) {
  const { id } = req.query

  // Route sub-path: /api/barrel-picks/:id/report
  const url = req.url || ''
  if (url.endsWith('/report') || url.includes('/report?')) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    return handleReport(id, req, res)
  }

  if (req.method === 'GET') return handleGet(id, res)
  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleGet(id, res) {
  const { data, error } = await supabaseAdmin
    .from('barrel_picks')
    .select(`
      *,
      store_profiles (
        id, store_name, address, county, comments_enabled,
        stores ( id, lat, lng, name, address, city, state )
      ),
      barrel_pick_reports ( id, report_type, user_id, created_at )
    `)
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Pick not found' })
  }

  const storeData = data.store_profiles
  const linkedStore = storeData?.stores

  const reportCounts = (data.barrel_pick_reports || []).reduce((acc, r) => {
    acc[r.report_type] = (acc[r.report_type] || 0) + 1
    return acc
  }, {})

  return res.status(200).json({
    ...data,
    store_name: storeData?.store_name || null,
    store_address: linkedStore?.address || storeData?.address || null,
    store_city: linkedStore?.city || storeData?.county || null,
    store_state: linkedStore?.state || null,
    store_lat: linkedStore?.lat || null,
    store_lng: linkedStore?.lng || null,
    comments_enabled: storeData?.comments_enabled ?? true,
    reports_count: reportCounts,
  })
}

async function handleReport(id, req, res) {
  // Auth required
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' })

  const { report_type } = req.body || {}
  if (!['still_available', 'sold_out', 'low_stock'].includes(report_type)) {
    return res.status(400).json({ error: 'Invalid report_type' })
  }

  // Verify pick exists and is published
  const { data: pick, error: pickError } = await supabaseAdmin
    .from('barrel_picks')
    .select('id, status')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (pickError || !pick) {
    return res.status(404).json({ error: 'Pick not found' })
  }

  // Upsert report — one per user per pick
  const { error: reportError } = await supabaseAdmin
    .from('barrel_pick_reports')
    .upsert(
      { pick_id: id, user_id: user.id, report_type },
      { onConflict: 'pick_id,user_id' }
    )

  if (reportError) {
    console.error('barrel-picks report upsert:', reportError.message)
    return res.status(500).json({ error: 'Failed to submit report' })
  }

  // Fetch updated report counts
  const { data: reports } = await supabaseAdmin
    .from('barrel_pick_reports')
    .select('report_type')
    .eq('pick_id', id)

  const reportCounts = (reports || []).reduce((acc, r) => {
    acc[r.report_type] = (acc[r.report_type] || 0) + 1
    return acc
  }, {})

  // Auto-update status to sold_out if sold_out reports outnumber still_available by 3+
  const soldOutCount = reportCounts.sold_out || 0
  const stillAvailCount = reportCounts.still_available || 0
  if (soldOutCount - stillAvailCount >= 3 && pick.status !== 'sold_out') {
    await supabaseAdmin
      .from('barrel_picks')
      .update({ status: 'sold_out' })
      .eq('id', id)
  }

  return res.status(200).json({ reports_count: reportCounts })
}
