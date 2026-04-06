import { createClient } from '@supabase/supabase-js'
import { randomInt } from 'crypto'

// Unbiased Fisher-Yates shuffle using a cryptographically secure RNG.
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1)  // uniform integer in [0, i]
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

// Service role client used only for reading winner profiles across user rows.
// The per-request store client can't see other users' profiles via RLS.
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { program_id } = req.body
  if (!program_id) return res.status(400).json({ error: 'program_id required' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = authHeader.replace('Bearer ', '')

  // Per-request authenticated client — RLS enforces store ownership automatically.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } }
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' })

  // RLS policy "store_own_programs" (store_id = auth.uid()) enforces ownership.
  // Re-draws are allowed — no status guard here.
  const { data: program, error: progError } = await supabase
    .from('lottery_programs')
    .select('*')
    .eq('id', program_id)
    .single()

  if (progError || !program) {
    console.error('draw: program lookup failed', { program_id, error: progError?.message })
    return res.status(403).json({ error: 'Program not found' })
  }

  // Get all claimed tokens for this program
  const { data: entries, error: entryError } = await supabase
    .from('lottery_tokens')
    .select('id, ticket_number, claimed_by_user_id, claimed_by_phone, claimed_at')
    .eq('program_id', program_id)
    .eq('status', 'claimed')

  if (entryError) {
    console.error('draw: entry lookup failed', entryError.message)
    return res.status(500).json({ error: 'Failed to load entries' })
  }

  if (!entries || entries.length === 0) {
    return res.status(400).json({ error: 'No entries in this lottery' })
  }

  // Unbiased Fisher-Yates shuffle with crypto RNG, then take the first N winners
  const winners = shuffle(entries).slice(0, program.draw_winner_count)
  const winnerIds = winners
    .filter(w => w.claimed_by_user_id)
    .map(w => w.claimed_by_user_id)

  // Enrich winners with profile data (display_name, email, phone).
  // Uses the admin client so RLS doesn't block cross-user profile reads.
  let profileMap = {}
  if (supabaseAdmin && winnerIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('user_id, display_name, email, phone')
      .in('user_id', winnerIds)
    if (profiles) {
      profiles.forEach(p => { profileMap[p.user_id] = p })
    }
  }

  const enrichedWinners = winners.map(w => {
    const profile = w.claimed_by_user_id ? profileMap[w.claimed_by_user_id] : null
    return {
      ticket_number: w.ticket_number,
      claimed_at: w.claimed_at,
      claimed_by_user_id: w.claimed_by_user_id,
      claimed_by_phone: w.claimed_by_phone,
      display_name: profile?.display_name || null,
      email: profile?.email || null,
      phone: profile?.phone || w.claimed_by_phone || null,
    }
  })

  // Update program status and record winner IDs
  const { error: updateError } = await supabase
    .from('lottery_programs')
    .update({ status: 'drawn', winner_user_ids: winnerIds })
    .eq('id', program_id)

  if (updateError) {
    console.error('draw: program update failed', updateError.message)
    return res.status(500).json({ error: 'Failed to record draw result' })
  }

  return res.status(200).json({ success: true, winners: enrichedWinners })
}
