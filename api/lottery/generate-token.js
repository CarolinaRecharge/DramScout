import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function generateToken() {
  return crypto.randomBytes(6).toString('base64url').slice(0, 8)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { program_id } = req.body
  if (!program_id) return res.status(400).json({ error: 'program_id required' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  const jwt = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' })

  // Confirm program belongs to this store
  const { data: program, error: progError } = await supabaseAdmin
    .from('lottery_programs')
    .select('id, store_id, status, bottle_name, draw_date')
    .eq('id', program_id)
    .eq('store_id', user.id)
    .single()

  if (progError || !program) return res.status(403).json({ error: 'Program not found' })
  if (program.status === 'drawn' || program.status === 'closed') {
    return res.status(400).json({ error: 'This lottery has already been drawn' })
  }

  // Generate unique token (retry on collision)
  let token, inserted
  for (let attempt = 0; attempt < 3; attempt++) {
    token = generateToken()
    const { data, error } = await supabaseAdmin
      .from('lottery_tokens')
      .insert({ token, program_id, store_id: user.id })
      .select()
      .single()
    if (!error) { inserted = data; break }
  }

  if (!inserted) return res.status(500).json({ error: 'Token generation failed' })

  const baseUrl = process.env.BASE_URL || process.env.VITE_BASE_URL || 'https://dramscout.app'
  const claimUrl = `${baseUrl}/claim/${token}`

  return res.status(200).json({
    token: inserted.token,
    claim_url: claimUrl,
    expires_at: inserted.expires_at,
    program: {
      bottle_name: program.bottle_name,
      draw_date: program.draw_date
    }
  })
}
