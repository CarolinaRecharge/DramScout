import { createClient } from '@supabase/supabase-js'
import { createHash, randomInt } from 'crypto'
import { sendVerificationSMS } from '../services/sms.js'

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

  const { phone } = req.body || {}
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return res.status(400).json({ error: 'phone is required' })
  }
  const normalizedPhone = phone.trim()

  // Generate a 6-digit OTP and hash it for storage
  const code = String(randomInt(100000, 1000000))
  const codeHash = createHash('sha256').update(code).digest('hex')

  // Delete any existing pending verifications for this user (one active at a time)
  await supabaseAdmin
    .from('phone_verifications')
    .delete()
    .eq('user_id', user.id)

  // Insert the new verification row
  const { error: insertError } = await supabaseAdmin
    .from('phone_verifications')
    .insert({ user_id: user.id, phone: normalizedPhone, code_hash: codeHash })

  if (insertError) {
    console.error('request-verification insert:', insertError.message)
    return res.status(500).json({ error: 'Failed to create verification' })
  }

  // Send via the configured SMS provider
  try {
    await sendVerificationSMS(normalizedPhone, code)
  } catch (smsError) {
    console.error('sendVerificationSMS:', smsError.message)
    return res.status(500).json({ error: 'Failed to send verification code' })
  }

  const response = { sent: true }

  // In non-production return the code in the response so developers can
  // complete the flow without a real SMS provider configured.
  if (process.env.NODE_ENV !== 'production') {
    response.dev_code = code
  }

  return res.status(200).json(response)
}
