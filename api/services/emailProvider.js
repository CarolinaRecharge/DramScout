/**
 * Email Provider Abstraction Layer
 *
 * Current provider: Supabase built-in (handles auth emails via its own SMTP).
 * Supabase automatically sends signup confirmation and password reset emails —
 * no manual send calls are needed for those flows. This module handles any
 * CUSTOM emails (welcome messages, lottery notifications, drop alerts, etc.).
 *
 * Switch providers by setting EMAIL_PROVIDER in your environment:
 *   supabase  (default) — logs in dev, no-op in prod until real SMTP is added
 *   sendgrid  — requires SENDGRID_API_KEY; npm install @sendgrid/mail
 *   resend    — requires RESEND_API_KEY; npm install resend (recommended)
 *
 * TO MIGRATE (when you're ready for real email delivery):
 *   Option A — Custom SMTP in Supabase Dashboard (easiest, no code changes):
 *     Project Settings → Auth → SMTP Settings → enter SendGrid/Resend credentials.
 *     Supabase keeps handling templates; you get your domain + deliverability.
 *
 *   Option B — Full provider swap (for custom email logic):
 *     1. Install the provider SDK
 *     2. Set EMAIL_PROVIDER=resend (or sendgrid) in .env
 *     3. Uncomment the appropriate block below
 *     4. No API route changes needed — abstraction handles it
 *
 * NOTE: Supabase free tier rate-limits auth emails to 4/hour.
 *   Fine for beta. Add real SMTP before any public launch.
 */

const PROVIDER = process.env.EMAIL_PROVIDER || 'supabase'

// ─── Supabase (default) ────────────────────────────────────────────────────
async function sendViaSupabase({ to, subject, html }) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[EmailProvider:supabase] Would send email:')
    console.log('  To:', to)
    console.log('  Subject:', subject)
  }
  return { provider: 'supabase', sent: false, reason: 'custom_emails_require_smtp' }
}

// ─── SendGrid (future) ─────────────────────────────────────────────────────
// async function sendViaSendGrid({ to, subject, html }) {
//   const { default: sgMail } = await import('@sendgrid/mail')
//   sgMail.setApiKey(process.env.SENDGRID_API_KEY)
//   await sgMail.send({
//     to,
//     from: process.env.EMAIL_FROM || 'noreply@dramscout.app',
//     subject,
//     html,
//   })
//   return { provider: 'sendgrid', sent: true }
// }

// ─── Resend (future — recommended) ─────────────────────────────────────────
// async function sendViaResend({ to, subject, html }) {
//   const { Resend } = await import('resend')
//   const resend = new Resend(process.env.RESEND_API_KEY)
//   const { data, error } = await resend.emails.send({
//     from: process.env.EMAIL_FROM || 'Dram Scout <noreply@dramscout.app>',
//     to,
//     subject,
//     html,
//   })
//   if (error) throw new Error(error.message)
//   return { provider: 'resend', sent: true, id: data.id }
// }

// ─── Router ────────────────────────────────────────────────────────────────
export async function sendEmail(options) {
  switch (PROVIDER) {
    // case 'sendgrid': return sendViaSendGrid(options)
    // case 'resend':   return sendViaResend(options)
    default:           return sendViaSupabase(options)
  }
}

// ─── Template helpers ──────────────────────────────────────────────────────

export function buildWelcomeEmail({ displayName }) {
  return {
    subject: 'Welcome to Dram Scout',
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #F2E8D5; background: #1A1208; padding: 40px 32px; border-radius: 8px;">
        <h1 style="font-size: 28px; color: #E8A020; margin-bottom: 4px;">Dram Scout</h1>
        <p style="color: #8A7660; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px;">Community Bourbon Intelligence</p>
        <p style="margin: 0 0 16px;">Welcome, ${displayName}.</p>
        <p style="margin: 0 0 32px;">You're now part of the network. Start reporting sightings, tracking drops, and building your cellar.</p>
        <p style="margin: 0; color: #8A7660; font-size: 12px;">You received this because you signed up at dramscout.app.</p>
      </div>
    `,
  }
}

export function buildPasswordResetEmail({ resetUrl }) {
  // Only used if you migrate AWAY from Supabase's built-in reset email.
  // While on Supabase auth, the reset link is sent automatically.
  return {
    subject: 'Reset your Dram Scout password',
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #F2E8D5; background: #1A1208; padding: 40px 32px; border-radius: 8px;">
        <h1 style="font-size: 28px; color: #E8A020; margin-bottom: 4px;">Dram Scout</h1>
        <p style="color: #8A7660; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px;">Community Bourbon Intelligence</p>
        <p style="margin: 0 0 16px;">We received a request to reset your password.</p>
        <a href="${resetUrl}" style="display: inline-block; margin: 8px 0 24px; padding: 12px 24px; background: #C8820A; color: #0D0A07; font-family: 'DM Mono', monospace; font-size: 13px; border-radius: 6px; text-decoration: none;">Reset Password</a>
        <p style="margin: 0; color: #8A7660; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  }
}
