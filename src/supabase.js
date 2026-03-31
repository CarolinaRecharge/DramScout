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

// Update an existing event (admin or owner)
export async function updateEvent(eventId, payload) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', eventId)
    .select()
    .single()
  if (error) { console.warn('updateEvent:', error.message); return null }
  return data
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

// ── Push Notifications ────────────────────────────────────────────────────────

export async function fetchNotificationPrefs(userId) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase
    .from('notification_prefs')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) { if (error.code !== 'PGRST116') console.warn('fetchNotificationPrefs:', error.message); return null }
  return data
}

export async function upsertNotificationPrefs(userId, prefs) {
  if (!supabase || !userId) return false
  const { error } = await supabase
    .from('notification_prefs')
    .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) { console.warn('upsertNotificationPrefs:', error.message); return false }
  return true
}

export async function savePushSubscription(userId, subscription) {
  if (!supabase || !userId) return false
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: userId, endpoint: subscription.endpoint, p256dh: subscription.p256dh, auth: subscription.auth },
      { onConflict: 'endpoint' }
    )
  if (error) { console.warn('savePushSubscription:', error.message); return false }
  return true
}

export async function deletePushSubscription(endpoint) {
  if (!supabase || !endpoint) return false
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
  if (error) { console.warn('deletePushSubscription:', error.message); return false }
  return true
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

// ── User roles ────────────────────────────────────────────────────────────────

// Fetch a user's role from the user_roles table (null = drinker/default)
export async function fetchUserRole(userId) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()
  if (error) return null
  return data?.role || null
}

// Upsert a role — used to seed the admin and by admin management panel
export async function upsertUserRole(userId, role) {
  if (!supabase || !userId) return false
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id' })
  if (error) { console.warn('upsertUserRole:', error.message); return false }
  return true
}

// Upsert profile row so admins can search users by email
export async function upsertProfile(userId, email, displayName) {
  if (!supabase || !userId) return
  await supabase
    .from('profiles')
    .upsert({ user_id: userId, email, display_name: displayName }, { onConflict: 'user_id' })
}

// Fetch all profiles with their roles merged in (admin use)
export async function fetchAllProfilesWithRoles() {
  if (!supabase) return []
  const [{ data: profiles, error: pe }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('user_id, email, display_name').order('email'),
    supabase.from('user_roles').select('user_id, role'),
  ])
  if (pe) { console.warn('fetchAllProfilesWithRoles:', pe.message); return [] }
  const roleMap = {}
  if (roles) roles.forEach(r => { roleMap[r.user_id] = r.role })
  return (profiles || []).map(p => ({ ...p, role: roleMap[p.user_id] || 'scout' }))
}

// Search profiles by email (admin use)
export async function searchProfiles(query) {
  if (!supabase || !query.trim()) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, display_name')
    .ilike('email', `%${query.trim()}%`)
    .limit(8)
  if (error) return []
  return data || []
}

// Fetch role for a specific user_id (admin panel lookup)
export async function fetchRoleForUser(userId) {
  if (!supabase || !userId) return 'scout'
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()
  return data?.role || 'scout'
}

// ── Sighting comments ─────────────────────────────────────────────────────
export async function fetchComments(sightingId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('sighting_comments')
    .select('*')
    .eq('sighting_id', sightingId)
    .order('created_at', { ascending: true })
  if (error) { console.warn('fetchComments:', error.message); return [] }
  return data || []
}

export async function postComment(sightingId, userId, handle, body, parentId = null) {
  if (!supabase) return null
  const payload = { sighting_id: sightingId, user_id: userId, handle, body }
  if (parentId) payload.parent_id = parentId
  const { data, error } = await supabase
    .from('sighting_comments')
    .insert(payload)
    .select()
    .single()
  if (error) { console.warn('postComment:', error.message); return null }
  return data
}

export async function deleteComment(commentId, userId) {
  if (!supabase) return { ok: false, error: 'No connection' }
  const { error } = await supabase
    .from('sighting_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId)
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function deleteCommentAdmin(commentId) {
  if (!supabase) return { ok: false, error: 'No connection' }
  const { error } = await supabase
    .from('sighting_comments')
    .delete()
    .eq('id', commentId)
  return error ? { ok: false, error: error.message } : { ok: true }
}

// Admin: delete any sighting (requires RLS policy allowing admin role)
export async function deleteSightingAdmin(sightingId) {
  if (!supabase) return { ok: false, error: 'No connection' }
  const { error } = await supabase
    .from('sightings')
    .delete()
    .eq('id', sightingId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// Admin: delete any event (requires RLS policy allowing admin role)
export async function deleteEventAdmin(eventId) {
  if (!supabase) return { ok: false, error: 'No connection' }
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// ── Forum ─────────────────────────────────────────────────────────────────────

export async function fetchForumCategories() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('forum_categories')
    .select('*')
    .order('sort_order')
  if (error) { console.warn('fetchForumCategories:', error.message); return [] }
  return data || []
}

export async function fetchForumThreads(categoryId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('forum_threads')
    .select('*')
    .eq('category_id', categoryId)
    .order('pinned', { ascending: false })
    .order('last_post_at', { ascending: false })
  if (error) { console.warn('fetchForumThreads:', error.message); return [] }
  return data || []
}

export async function fetchForumPosts(threadId, page = 0, pageSize = 20) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .range(page * pageSize, page * pageSize + pageSize - 1)
  if (error) { console.warn('fetchForumPosts:', error.message); return [] }
  return data || []
}

export async function fetchForumReactions(postIds) {
  if (!supabase || !postIds?.length) return []
  const { data, error } = await supabase
    .from('forum_reactions')
    .select('*')
    .in('post_id', postIds)
  if (error) { console.warn('fetchForumReactions:', error.message); return [] }
  return data || []
}

export async function postForumThread(categoryId, userId, handle, title, body) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('forum_threads')
    .insert({ category_id: categoryId, user_id: userId, handle, title, body })
    .select()
    .single()
  if (error) { console.warn('postForumThread:', error.message); return null }
  return data
}

export async function postForumPost(threadId, userId, handle, body) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('forum_posts')
    .insert({ thread_id: threadId, user_id: userId, handle, body })
    .select()
    .single()
  if (error) { console.warn('postForumPost:', error.message); return null }
  return data
}

export async function deleteForumPost(postId, userId) {
  if (!supabase) return false
  const { error } = await supabase
    .from('forum_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId)
  if (error) { console.warn('deleteForumPost:', error.message); return false }
  return true
}

export async function deleteForumPostAdmin(postId) {
  if (!supabase) return false
  const { error } = await supabase
    .from('forum_posts')
    .delete()
    .eq('id', postId)
  if (error) { console.warn('deleteForumPostAdmin:', error.message); return false }
  return true
}

export async function deleteForumThread(threadId, userId) {
  if (!supabase) return false
  const { error } = await supabase
    .from('forum_threads')
    .delete()
    .eq('id', threadId)
    .eq('user_id', userId)
  if (error) { console.warn('deleteForumThread:', error.message); return false }
  return true
}

export async function deleteForumThreadAdmin(threadId) {
  if (!supabase) return false
  const { error } = await supabase
    .from('forum_threads')
    .delete()
    .eq('id', threadId)
  if (error) { console.warn('deleteForumThreadAdmin:', error.message); return false }
  return true
}

export async function toggleForumReaction(postId, userId, emoji) {
  if (!supabase) return false
  const { data: existing } = await supabase
    .from('forum_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle()
  if (existing) {
    const { error } = await supabase
      .from('forum_reactions')
      .delete()
      .eq('id', existing.id)
    return !error
  } else {
    const { error } = await supabase
      .from('forum_reactions')
      .insert({ post_id: postId, user_id: userId, emoji })
    return !error
  }
}

export function subscribeToForumPosts(threadId, onInsert) {
  if (!supabase) return null
  return supabase
    .channel(`forum-${threadId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'forum_posts', filter: `thread_id=eq.${threadId}` },
      payload => onInsert(payload.new)
    )
    .subscribe()
}
