import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { program_id } = req.body
  if (!program_id) return res.status(400).json({ error: 'program_id required' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(jwt)
  if (!user) return res.status(401).json({ error: 'Invalid session' })

  const { data: program } = await supabaseAdmin
    .from('lottery_programs')
    .select('*')
    .eq('id', program_id)
    .eq('store_id', user.id)
    .single()

  if (!program) return res.status(403).json({ error: 'Program not found' })
  if (program.status === 'drawn') return res.status(400).json({ error: 'Already drawn' })

  // Get all claimed tokens for this program
  const { data: entries } = await supabaseAdmin
    .from('lottery_tokens')
    .select('id, ticket_number, claimed_by_user_id, claimed_by_phone, claimed_at')
    .eq('program_id', program_id)
    .eq('status', 'claimed')

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
  await supabaseAdmin
    .from('lottery_programs')
    .update({ status: 'drawn', winner_user_ids: winnerIds })
    .eq('id', program_id)

  return res.status(200).json({ success: true, winners })
}
