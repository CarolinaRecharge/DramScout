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
  if (error) { console.warn('fetchSightings:', error.message); return null }
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
