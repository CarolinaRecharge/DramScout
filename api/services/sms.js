/**
 * SMS service abstraction.
 *
 * Switch providers by setting SMS_PROVIDER in your environment:
 *   console     (default) — logs the code server-side, no cost, no package needed
 *   twilio      — requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *   messagebird — requires MESSAGEBIRD_API_KEY, MESSAGEBIRD_ORIGINATOR
 *
 * Dynamic imports ensure unused provider packages are never loaded.
 */

const providers = {
  console: async (phone, code) => {
    console.log(`[SMS console provider] → ${phone}: verification code is ${code}`)
  },

  twilio: async (phone, code) => {
    const { default: twilio } = await import('twilio')
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    await client.messages.create({
      body: `Your DramScout verification code is: ${code}`,
      from: process.env.TWILIO_FROM_NUMBER,
      to: phone,
    })
  },

  messagebird: async (phone, code) => {
    const { default: initMessageBird } = await import('messagebird')
    const client = initMessageBird(process.env.MESSAGEBIRD_API_KEY)
    await new Promise((resolve, reject) => {
      client.messages.create({
        originator: process.env.MESSAGEBIRD_ORIGINATOR || 'DramScout',
        recipients: [phone],
        body: `Your DramScout verification code is: ${code}`,
      }, (err) => (err ? reject(err) : resolve()))
    })
  },
}

/**
 * Send a verification SMS.
 * @param {string} phone  E.164-formatted phone number (e.g. +12025551234)
 * @param {string} code   The 6-digit OTP code
 */
export async function sendVerificationSMS(phone, code) {
  const providerName = process.env.SMS_PROVIDER ?? 'console'
  const provider = providers[providerName]
  if (!provider) throw new Error(`Unknown SMS_PROVIDER: "${providerName}". Valid options: ${Object.keys(providers).join(', ')}`)
  await provider(phone, code)
}
