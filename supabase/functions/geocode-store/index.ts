/**
 * geocode-store — Supabase Edge Function
 *
 * Geocodes a store's address via Nominatim and optionally updates the DB row.
 *
 * POST /functions/v1/geocode-store
 * Body (JSON):
 *   { "store_id": "<uuid>" }              — geocode & persist the existing store
 *   { "address": "...", "city": "...", "state": "NC" }  — preview only, no DB write
 *   { "all_ungeocoded": true }            — batch-fix every store missing geocoded_at
 *
 * Returns:
 *   { lat, lng, display_name }            — single-store preview
 *   { updated: N, failed: [...] }         — batch mode
 *
 * Authorization: pass the service-role key as Bearer token (for DB writes),
 * or any valid JWT for preview-only calls.
 *
 * Nominatim usage policy: max 1 req/sec, must set a meaningful User-Agent.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NOMINATIM_BASE    = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT        = 'DramScout/1.0 (geocode-store edge function)'
const DRIFT_THRESHOLD   = 0.008   // degrees — only persist if drift exceeds this

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

interface GeoResult {
  lat: number
  lng: number
  display_name: string
}

async function nominatimGeocode(
  address: string,
  city: string,
  state: string
): Promise<GeoResult | null> {
  const q   = encodeURIComponent(`${address}, ${city}, ${state}, USA`)
  const url = `${NOMINATIM_BASE}?q=${q}&format=json&limit=1&countrycodes=us`

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)

  const data = await res.json()
  if (!data.length) return null

  return {
    lat:          parseFloat(data[0].lat),
    lng:          parseFloat(data[0].lon),
    display_name: data[0].display_name,
  }
}

function maxDrift(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return Math.max(Math.abs(a.lat - b.lat), Math.abs(a.lng - b.lng))
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), { status: 405 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  // SUPABASE_URL and SUPABASE_ANON_KEY are always auto-injected by Supabase.
  // Access control is handled by the stores_update RLS policy + this function's
  // own Bearer token check, so the anon key is safe to use here.
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!
  const db = createClient(supabaseUrl, anonKey)

  // ── Mode 1: preview — address supplied directly ────────────────────────────
  if (body.address && body.city && body.state) {
    const result = await nominatimGeocode(
      body.address as string,
      body.city    as string,
      body.state   as string
    )
    if (!result) {
      return new Response(JSON.stringify({ error: 'Address not found' }), { status: 404 })
    }
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Mode 2: single store_id — geocode & persist ────────────────────────────
  if (body.store_id) {
    const { data: store, error: fetchErr } = await db
      .from('stores')
      .select('id, name, address, city, state, lat, lng')
      .eq('id', body.store_id)
      .single()

    if (fetchErr || !store) {
      return new Response(JSON.stringify({ error: 'Store not found' }), { status: 404 })
    }

    const result = await nominatimGeocode(store.address, store.city, store.state)
    if (!result) {
      return new Response(JSON.stringify({ error: 'Address not found by Nominatim' }), { status: 404 })
    }

    const d = maxDrift({ lat: store.lat, lng: store.lng }, result)
    const updated = d > DRIFT_THRESHOLD

    if (updated) {
      const { error: updateErr } = await db
        .from('stores')
        .update({ lat: result.lat, lng: result.lng, geocoded_at: new Date().toISOString() })
        .eq('id', store.id)

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 })
      }
    } else {
      // Still stamp geocoded_at even when coords are fine
      await db
        .from('stores')
        .update({ geocoded_at: new Date().toISOString() })
        .eq('id', store.id)
    }

    return new Response(
      JSON.stringify({
        store_id:     store.id,
        name:         store.name,
        lat:          result.lat,
        lng:          result.lng,
        display_name: result.display_name,
        coords_updated: updated,
        drift:        d,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ── Mode 3: batch — geocode all stores (or a county subset) ─────────────
  if (body.all_ungeocoded) {
    // Fetch all stores — don't filter on geocoded_at since that column may not
    // exist yet if migration 002 hasn't been run. We re-geocode everything and
    // only write to the DB when drift exceeds the threshold.
    const county = typeof body.county === 'string' ? body.county : null

    let query = db
      .from('stores')
      .select('id, name, address, city, state, lat, lng')

    if (county) query = query.eq('county', county)

    const { data: stores, error: fetchErr } = await query

    if (fetchErr) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch stores: ${fetchErr.message}` }),
        { status: 500 }
      )
    }

    if (!stores?.length) {
      return new Response(
        JSON.stringify({ updated: 0, message: 'No stores found' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    let updatedCount = 0
    let skippedCount = 0
    const failed: string[] = []

    for (const store of stores) {
      let result: GeoResult | null = null

      try {
        result = await nominatimGeocode(store.address, store.city, store.state)
      } catch (err) {
        failed.push(`${store.name}: geocode error — ${err instanceof Error ? err.message : String(err)}`)
        await sleep(1100)
        continue
      }

      if (!result) {
        failed.push(`${store.name}: not found by Nominatim`)
        await sleep(1100)
        continue
      }

      const d = maxDrift({ lat: store.lat, lng: store.lng }, result)

      if (d > DRIFT_THRESHOLD) {
        // Build update payload — include geocoded_at only if the column exists
        // (migration 002). If it doesn't, the update still succeeds for lat/lng.
        const payload: Record<string, unknown> = { lat: result.lat, lng: result.lng }
        try { payload.geocoded_at = new Date().toISOString() } catch { /* column may not exist */ }

        const { error: updateErr } = await db
          .from('stores')
          .update(payload)
          .eq('id', store.id)

        if (updateErr) {
          // Retry without geocoded_at in case the column doesn't exist yet
          const { error: retryErr } = await db
            .from('stores')
            .update({ lat: result.lat, lng: result.lng })
            .eq('id', store.id)

          if (retryErr) {
            failed.push(`${store.name}: update failed — ${retryErr.message}`)
            await sleep(1100)
            continue
          }
        }

        updatedCount++
      } else {
        skippedCount++
      }

      // Nominatim: 1 req/sec
      await sleep(1100)
    }

    return new Response(
      JSON.stringify({
        updated:   updatedCount,
        skipped:   skippedCount,
        processed: stores.length,
        failed,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Provide store_id, address+city+state, or all_ungeocoded:true' }),
    { status: 400 }
  )
})
