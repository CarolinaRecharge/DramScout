import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

// Anon client — works for reading tokens and claiming as guest.
// RLS policies in 005_anon_claim_access.sql grant the anon role
// the necessary SELECT / UPDATE permissions.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
  const { data, error } = await supabase
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
  if (data.status === 'claimed') return res.status(409).json({ error: 'already_claimed' })
  // Check expiry inline rather than calling expire_stale_tokens() — avoids
  // an RLS conflict since the anon UPDATE policy only allows → 'claimed'.
  if (data.status === 'expired' || new Date(data.expires_at) < new Date()) {
    return res.status(410).json({ error: 'expired' })
  }

  return res.status(200).json({
    valid: true,
    expires_at: data.expires_at,
    program: data.lottery_programs
  })
}

// ── POST: claim token ─────────────────────────────────────────────────────────
async function handleClaim(token, req, res) {
  const { phone } = req.body || {}

  // Resolve user identity if a JWT was sent
  let userId = null
  const authHeader = req.headers.authorization
  if (authHeader) {
    const jwt = authHeader.replace('Bearer ', '')
    // Use a per-request authenticated client to verify the JWT via RLS
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    })
    const { data: { user } } = await userClient.auth.getUser(jwt)
    if (user) userId = user.id
  }

  if (!userId && !phone) {
    return res.status(400).json({ error: 'Must be logged in or provide phone number' })
  }

  // Read the token row (anon SELECT policy allows this)
  const { data: tokenRow, error: fetchError } = await supabase
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
    await supabase
      .from('lottery_tokens')
      .update({ status: 'expired' })
      .eq('id', tokenRow.id)
    return res.status(410).json({ error: 'expired' })
  }

  // Get next ticket number (anon has EXECUTE on this function via migration 005)
  const { data: ticketNumData } = await supabase
    .rpc('next_ticket_number', { p_program_id: tokenRow.program_id })
  const ticketNumber = ticketNumData || 1

  // Atomic claim: anon UPDATE policy enforces status 'pending' → 'claimed'
  const { data: updated, error: updateError } = await supabase
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

  // Count total entries this customer has in this program (authenticated only)
  let totalEntries = 1
  if (userId) {
    const { count } = await supabase
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
