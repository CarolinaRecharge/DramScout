import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { program_id } = req.body
  if (!program_id) return res.status(400).json({ error: 'program_id required' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = authHeader.replace('Bearer ', '')

  // Per-request authenticated client — RLS enforces store ownership automatically,
  // matching the same pattern used by generate-token.js.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } }
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' })

  // RLS policy "store_own_programs" (store_id = auth.uid()) enforces ownership —
  // no row returned means either not found or not owned by this store.
  const { data: program, error: progError } = await supabase
    .from('lottery_programs')
    .select('*')
    .eq('id', program_id)
    .single()

  if (progError || !program) {
    console.error('draw: program lookup failed', { program_id, error: progError?.message })
    return res.status(403).json({ error: 'Program not found' })
  }
  if (program.status === 'drawn') return res.status(400).json({ error: 'Already drawn' })

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

  // Fisher-Yates shuffle, pick winners
  const shuffled = [...entries].sort(() => Math.random() - 0.5)
  const winners = shuffled.slice(0, program.draw_winner_count)
  const winnerIds = winners
    .filter(w => w.claimed_by_user_id)
    .map(w => w.claimed_by_user_id)

  // Update program status
  const { error: updateError } = await supabase
    .from('lottery_programs')
    .update({ status: 'drawn', winner_user_ids: winnerIds })
    .eq('id', program_id)

  if (updateError) {
    console.error('draw: program update failed', updateError.message)
    return res.status(500).json({ error: 'Failed to record draw result' })
  }

  return res.status(200).json({ success: true, winners })
}
