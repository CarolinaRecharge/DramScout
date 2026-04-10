/**
 * Consolidated auth handler — /api/auth/[action]
 *
 * All consumer auth endpoints live here to stay within Vercel's serverless
 * function count limits. Vercel passes the URL segment as req.query.action.
 *
 * Endpoints:
 *   POST /api/auth/signup               — create account
 *   POST /api/auth/login                — sign in
 *   POST /api/auth/logout               — sign out
 *   POST /api/auth/forgot-password      — trigger reset email
 *   POST /api/auth/reset-password       — exchange token + set new password
 *   POST /api/auth/resend-confirmation  — resend email verification link
 *   GET  /api/auth/me                   — fetch authenticated user + profile
 */

import { createClient } from '@supabase/supabase-js'
import { sendEmail, buildWelcomeEmail } from '../services/emailProvider.js'

const SUPABASE_URL  = process.env.SUPABASE_URL  || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const APP_URL       = process.env.BASE_URL || process.env.VITE_BASE_URL || ''

// Service-role client for admin operations (bypasses RLS where needed)
const supabaseAdmin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// ─── Dispatcher ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const { action } = req.query

  switch (action) {
    case 'signup':              return handleSignup(req, res)
    case 'login':               return handleLogin(req, res)
    case 'logout':              return handleLogout(req, res)
    case 'forgot-password':     return handleForgotPassword(req, res)
    case 'reset-password':      return handleResetPassword(req, res)
    case 'resend-confirmation': return handleResendConfirmation(req, res)
    case 'me':                  return handleMe(req, res)
    default:                    return res.status(404).json({ error: 'Not found' })
  }
}

// ─── POST /api/auth/signup ─────────────────────────────────────────────────

async function handleSignup(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password, displayName } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
  const resolvedName = displayName?.trim() || email.split('@')[0]

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: resolvedName },
      emailRedirectTo: `${APP_URL}/auth/confirm`,
    },
  })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  // Send welcome email via abstraction layer (no-op until real provider added)
  if (data.user) {
    const welcome = buildWelcomeEmail({ displayName: resolvedName })
    sendEmail({ to: email, ...welcome }).catch(err => {
      console.warn('[auth/signup] Welcome email failed:', err.message)
    })
  }

  return res.status(201).json({
    message: 'Check your email to confirm your account before signing in.',
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
  })
}

// ─── POST /api/auth/login ──────────────────────────────────────────────────

async function handleLogin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return res.status(401).json({
        error: 'Please confirm your email address before signing in.',
        code: 'EMAIL_NOT_CONFIRMED',
      })
    }
    if (error.message.includes('Invalid login credentials')) {
      return res.status(401).json({ error: 'Incorrect email or password.' })
    }
    return res.status(401).json({ error: error.message })
  }

  return res.status(200).json({
    session: {
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at:    data.session.expires_at,
    },
    user: {
      id:           data.user.id,
      email:        data.user.email,
      display_name: data.user.user_metadata?.display_name,
    },
  })
}

// ─── POST /api/auth/logout ─────────────────────────────────────────────────

async function handleLogout(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(204).end()

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  await supabase.auth.signOut()
  return res.status(204).end()
}

// ─── POST /api/auth/forgot-password ───────────────────────────────────────

async function handleForgotPassword(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.body || {}

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

  // Always return success — Supabase silently no-ops for unknown emails,
  // which prevents email enumeration attacks.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_URL}/reset-password`,
  })

  return res.status(200).json({
    message: 'If an account exists with that email, a reset link has been sent.',
  })
}

// ─── POST /api/auth/reset-password ────────────────────────────────────────

async function handleResetPassword(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { token_hash, new_password } = req.body || {}

  if (!token_hash || !new_password) {
    return res.status(400).json({ error: 'Token and new password are required' })
  }
  if (new_password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

  // Step 1: Exchange the token_hash for a live session
  const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
    token_hash,
    type: 'recovery',
  })

  if (sessionError || !sessionData.session) {
    return res.status(400).json({
      error: 'This reset link is invalid or has expired. Please request a new one.',
    })
  }

  // Step 2: Update the password using the authenticated session
  const authedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: {
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    },
  })

  const { error: updateError } = await authedSupabase.auth.updateUser({
    password: new_password,
  })

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  return res.status(200).json({ message: 'Password updated successfully. You can now sign in.' })
}

// ─── POST /api/auth/resend-confirmation ───────────────────────────────────

async function handleResendConfirmation(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.body || {}

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
  await supabase.auth.resend({ type: 'signup', email })

  // Always return success — don't reveal whether the email exists
  return res.status(200).json({
    message: 'If this email is registered and unconfirmed, a new link has been sent.',
  })
}

// ─── GET /api/auth/me ──────────────────────────────────────────────────────

async function handleMe(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'No auth token provided' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, handle, created_at')
    .eq('user_id', user.id)
    .single()

  return res.status(200).json({
    user: {
      id:              user.id,
      email:           user.email,
      email_confirmed: !!user.email_confirmed_at,
      display_name:    profile?.display_name || user.user_metadata?.display_name,
      handle:          profile?.handle,
      avatar_url:      profile?.avatar_url,
      created_at:      profile?.created_at,
    },
  })
}
