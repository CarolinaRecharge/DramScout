// DISABLED — moved here to stay within Vercel hobby plan's 12-function limit.
// To re-enable: move this file back to api/notify-sighting.js and redeploy.
// This sends Web Push notifications when a new sighting is posted.
// App.jsx calls /api/notify-sighting fire-and-forget (.catch(()=>{})),
// so disabling it has zero user-visible impact — sightings still save normally.

import webPush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webPush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { sightingId, storeName, storeId, lat, lng } = req.body

  // Fetch all enabled notification prefs
  const { data: prefs } = await supabase
    .from('notification_prefs')
    .select('user_id, enabled, radius_miles, lat, lng')
    .eq('enabled', true)

  if (!prefs || prefs.length === 0) return res.status(200).json({ sent: 0 })

  // Fetch eligible roles (admin, store, collector)
  const userIds = prefs.map(p => p.user_id)
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .in('user_id', userIds)
    .in('role', ['admin', 'store', 'collector'])

  // Fetch push subscriptions for eligible users
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  // Fetch favorite store matches (if storeId is known)
  let favoriteUsers = new Set()
  if (storeId) {
    const { data: favorites } = await supabase
      .from('store_favorites')
      .select('user_id')
      .eq('store_id', storeId)
      .in('user_id', userIds)
    favoriteUsers = new Set((favorites || []).map(f => f.user_id))
  }

  const eligibleRoles = new Set((roles || []).map(r => r.user_id))
  const subsByUser = {}
  for (const s of subs || []) {
    if (!subsByUser[s.user_id]) subsByUser[s.user_id] = []
    subsByUser[s.user_id].push(s)
  }

  const sends = []
  const staleEndpoints = []

  for (const pref of prefs) {
    if (!eligibleRoles.has(pref.user_id)) continue
    const userSubs = subsByUser[pref.user_id] || []
    if (!userSubs.length) continue

    const isFavorite = favoriteUsers.has(pref.user_id)
    const isNationwide = pref.radius_miles >= 999999
    const inRadius = lat && lng && pref.lat && pref.lng
      ? haversineDistance(pref.lat, pref.lng, lat, lng) <= pref.radius_miles
      : false

    if (!isFavorite && !isNationwide && !inRadius) continue

    const payload = JSON.stringify({
      title: 'New Sighting — DramScout',
      body: storeName ? `${storeName} just had a new bottle spotted!` : 'A new bottle was just spotted!',
      url: '/',
    })

    for (const sub of userSubs) {
      sends.push(
        webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        ).catch(err => {
          // 410 Gone means the subscription is no longer valid — remove it
          if (err.statusCode === 410) staleEndpoints.push(sub.endpoint)
        })
      )
    }
  }

  await Promise.all(sends)

  // Clean up stale subscriptions
  if (staleEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', staleEndpoints)
  }

  res.status(200).json({ sent: sends.length - staleEndpoints.length })
}
