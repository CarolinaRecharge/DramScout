import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { token } = req.query

  if (req.method === 'GET') {
    return handleValidate(token, res)
  } else if (req.method === 'POST') {
    return handleClaim(token, req, res)
  }
  return res.status(405).json({ error: 'Method not allowed' })
}

// ── GET: validate token before showing claim UI ───────────────────────────────
async function handleValidate(token, res) {
  // Expire stale tokens
  await supabaseAdmin.rpc('expire_stale_tokens')

  const { data, error } = await supabaseAdmin
    .from('lottery_tokens')
    .select(`
      id, token, status, expires_at,
      lottery_programs (
        bottle_name, description, draw_date, draw_winner_count,
        store_profiles ( store_name, store_number, county )
      )
    `)
    .eq('token', token)
    .single()

  if (error || !data) return res.status(404).json({ error: 'invalid' })
  if (data.status === 'expired') return res.status(410).json({ error: 'expired' })
  if (data.status === 'claimed') return res.status(409).json({ error: 'already_claimed' })

  return res.status(200).json({
    valid: true,
    expires_at: data.expires_at,
    program: data.lottery_programs
  })
}

// ── POST: claim token ─────────────────────────────────────────────────────────
async function handleClaim(token, req, res) {
  const { phone } = req.body || {}

  // Resolve user identity
  let userId = null
  const authHeader = req.headers.authorization
  if (authHeader) {
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(jwt)
    if (user) userId = user.id
  }

  if (!userId && !phone) {
    return res.status(400).json({ error: 'Must be logged in or provide phone number' })
  }

  const { data: tokenRow, error: fetchError } = await supabaseAdmin
    .from('lottery_tokens')
    .select('id, status, program_id, expires_at')
    .eq('token', token)
    .single()

  if (fetchError || !tokenRow) return res.status(404).json({ error: 'invalid' })
  if (tokenRow.status !== 'pending') {
    return res.status(409).json({
      error: tokenRow.status === 'expired' ? 'expired' : 'already_claimed'
    })
  }
  if (new Date(tokenRow.expires_at) < new Date()) {
    await supabaseAdmin
      .from('lottery_tokens')
      .update({ status: 'expired' })
      .eq('id', tokenRow.id)
    return res.status(410).json({ error: 'expired' })
  }

  // Get next ticket number
  const { data: ticketNumData } = await supabaseAdmin
    .rpc('next_ticket_number', { p_program_id: tokenRow.program_id })
  const ticketNumber = ticketNumData || 1

  // Atomic claim: only succeeds if status is still 'pending'
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('lottery_tokens')
    .update({
      status: 'claimed',
      claimed_by_user_id: userId,
      claimed_by_phone: phone || null,
      claimed_at: new Date().toISOString(),
      ticket_number: ticketNumber
    })
    .eq('id', tokenRow.id)
    .eq('status', 'pending')   // race condition guard
    .select()

  if (updateError || !updated || updated.length === 0) {
    return res.status(409).json({ error: 'already_claimed' })
  }

  // Count total entries this customer has in this program
  let totalEntries = 1
  if (userId) {
    const { count } = await supabaseAdmin
      .from('lottery_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', tokenRow.program_id)
      .eq('claimed_by_user_id', userId)
      .eq('status', 'claimed')
    totalEntries = count || 1
  }

  return res.status(200).json({
    success: true,
    ticket_number: ticketNumber,
    total_entries: totalEntries
  })
}
