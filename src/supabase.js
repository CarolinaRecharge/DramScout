import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Returns null if env vars are missing or invalid — app falls back to mock data
function makeClient() {
  if (!url || !key) return null
  try {
    new URL(url) // throws if url is not a valid URL
    return createClient(url, key)
  } catch {
    console.warn('Dram Scout: VITE_SUPABASE_URL is not a valid URL — running in demo mode.')
    return null
  }
}
export const supabase = makeClient()

// Anonymous per-browser fingerprint for deduplication (no auth required)
export function getFingerprint() {
  let fp = localStorage.getItem('ds_fp')
  if (!fp) {
    fp = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('ds_fp', fp)
  }
  return fp
}

// Fetch all stores (called once on app load)
export async function fetchStores() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, address, city, state, county, lat, lng')
    .order('city')
  if (error) { console.warn('fetchStores:', error.message); return [] }
  return data || []
}

// Fetch sightings from the last 14 days
export async function fetchSightings() {
  if (!supabase) return null
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('sightings')
    .select('*')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchSightings:', error.message, error.code); return null }
  return data || []
}

// Fetch upcoming + recent events
export async function fetchEvents() {
  if (!supabase) return null
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', cutoff)
    .order('event_date', { ascending: true })
  if (error) { console.warn('fetchEvents:', error.message); return null }
  return data || []
}

// Post a new sighting
export async function postSighting(payload) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('sightings')
    .insert(payload)
    .select()
    .single()
  if (error) { console.warn('postSighting:', error.message); return null }
  return data
}

// Confirm a sighting (idempotent — unique constraint on sighting_id+fingerprint)
export async function confirmSighting(sightingId, fingerprint) {
  if (!supabase) return false
  const { error } = await supabase
    .from('confirmations')
    .insert({ sighting_id: sightingId, fingerprint })
  if (error && !error.message.includes('duplicate')) {
    console.warn('confirmSighting:', error.message)
    return false
  }
  // Increment the denormalized counter atomically
  await supabase.rpc('increment_confirmation', { p_sighting_id: sightingId })
  return true
}

// RSVP to an event (toggle)
export async function toggleEventRsvp(eventId, fingerprint, isCurrentlyGoing) {
  if (!supabase) return false
  if (isCurrentlyGoing) {
    const { error } = await supabase
      .from('event_rsvps')
      .delete()
      .eq('event_id', eventId)
      .eq('fingerprint', fingerprint)
    return !error
  } else {
    const { error } = await supabase
      .from('event_rsvps')
      .insert({ event_id: eventId, fingerprint })
    return !error
  }
}

// Post a new event
export async function postEvent(payload) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select()
    .single()
  if (error) { console.warn('postEvent:', error.message); return null }
  return data
}

// Fetch all queue entries for an event, ordered by join time
export async function fetchEventQueue(eventId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('event_queue')
    .select('id, event_id, user_id, handle, joined_at')
    .eq('event_id', eventId)
    .order('joined_at', { ascending: true })
  if (error) { console.warn('fetchEventQueue:', error.message); return [] }
  return data || []
}

// Join the virtual queue for an event
export async function joinEventQueue(eventId, userId, handle, fingerprint) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('event_queue')
    .insert({ event_id: eventId, user_id: userId, handle, fingerprint })
    .select()
    .single()
  if (error) { console.warn('joinEventQueue:', error.message); return null }
  return data
}

// Leave the virtual queue for an event
export async function leaveEventQueue(eventId, userId) {
  if (!supabase || !userId) return false
  const { error } = await supabase
    .from('event_queue')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)
  if (error) { console.warn('leaveEventQueue:', error.message); return false }
  return true
}

// Delete an event the user owns
export async function deleteEvent(eventId, userId) {
  if (!supabase || !userId) return { ok: false, error: 'Not authenticated' }
  const { error, count } = await supabase
    .from('events')
    .delete({ count: 'exact' })
    .eq('id', eventId)
    .eq('user_id', userId)
  if (error) return { ok: false, error: error.message }
  if (count === 0) return { ok: false, error: 'Permission denied or record not found' }
  return { ok: true }
}

// Subscribe to new sightings in real-time
export function subscribeToSightings(onInsert) {
  if (!supabase) return null
  return supabase
    .channel('sightings-live')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sightings' },
      payload => onInsert(payload.new)
    )
    .subscribe()
}

// Delete a sighting the user owns
export async function deleteSighting(sightingId, userId) {
  if (!supabase || !userId) return { ok: false, error: 'Not authenticated' }
  const { error, count } = await supabase
    .from('sightings')
    .delete({ count: 'exact' })
    .eq('id', sightingId)
    .eq('user_id', userId)
  if (error) {
    console.error('deleteSighting error:', error.message, error.code)
    return { ok: false, error: error.message }
  }
  if (count === 0) {
    console.error('deleteSighting: 0 rows deleted — RLS policy may be missing or user_id mismatch')
    return { ok: false, error: 'Permission denied or record not found' }
  }
  return { ok: true }
}

// ── User profile data ─────────────────────────────────────────────────────────

// Sightings posted by this user (all time)
export async function fetchUserSightings(userId) {
  if (!supabase || !userId) return []
  const { data, error } = await supabase
    .from('sightings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.warn('fetchUserSightings:', error.message); return [] }
  return data || []
}

// Store IDs this user has favorited
export async function fetchUserFavorites(userId) {
  if (!supabase || !userId) return []
  const { data, error } = await supabase
    .from('store_favorites')
    .select('store_id')
    .eq('user_id', userId)
  if (error) { console.warn('fetchUserFavorites:', error.message); return [] }
  return data?.map(r => r.store_id) || []
}

// Add or remove a store favorite
export async function toggleStoreFavorite(storeId, userId, isCurrentlyFavorited) {
  if (!supabase || !userId) return false
  if (isCurrentlyFavorited) {
    const { error } = await supabase
      .from('store_favorites')
      .delete()
      .eq('store_id', storeId)
      .eq('user_id', userId)
    return !error
  } else {
    const { error } = await supabase
      .from('store_favorites')
      .insert({ store_id: storeId, user_id: userId })
    return !error
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  if (!supabase) return
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) console.error('Google sign-in error:', error.message)
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function getSession() {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Returns an unsubscribe function
export function onAuthStateChange(callback) {
  if (!supabase) return () => {}
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return () => subscription.unsubscribe()
}
