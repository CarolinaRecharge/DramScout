import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Require authenticated user
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' })

  const { code } = req.body || {}
  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'code is required' })
  }

  const codeHash = createHash('sha256').update(code.trim()).digest('hex')

  // Find a matching, unexpired verification row for this user
  const { data: row, error: fetchError } = await supabaseAdmin
    .from('phone_verifications')
    .select('id, phone, expires_at')
    .eq('user_id', user.id)
    .eq('code_hash', codeHash)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (fetchError || !row) {
    return res.status(400).json({ error: 'Invalid or expired verification code' })
  }

  // Mark the phone as verified on the user's profile
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ phone: row.phone, phone_verified: true })
    .eq('user_id', user.id)

  if (updateError) {
    console.error('confirm-verification profile update:', updateError.message)
    return res.status(500).json({ error: 'Failed to save verified phone' })
  }

  // Clean up all pending verification rows for this user
  await supabaseAdmin
    .from('phone_verifications')
    .delete()
    .eq('user_id', user.id)

  return res.status(200).json({ verified: true, phone: row.phone })
}
