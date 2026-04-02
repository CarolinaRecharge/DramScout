#!/usr/bin/env node
/**
 * geocode-stores.js
 *
 * One-time script to verify and fix store coordinates using the Nominatim
 * geocoding API (OpenStreetMap, free, no API key required).
 *
 * Usage:
 *   node scripts/geocode-stores.js              # dry-run, prints report + patch SQL
 *   node scripts/geocode-stores.js --apply      # also writes patches directly to Supabase
 *   node scripts/geocode-stores.js --patch-seed # also rewrites supabase/seeds/001_stores.sql
 *
 * Required env vars:
 *   SUPABASE_URL              - your project URL (https://xxxx.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY - service role key (bypasses RLS)
 *
 * Nominatim rate limit: 1 request per second (enforced below).
 * Please set NOMINATIM_USER_AGENT to something identifying your app.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL              = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const NOMINATIM_USER_AGENT      = process.env.NOMINATIM_USER_AGENT || 'DramScout/1.0 (store-geocode-script)'

// Flag a coordinate pair as needing a fix when it drifts more than this many
// decimal degrees from Nominatim's result (~0.5 miles at NC latitudes).
const DRIFT_THRESHOLD_DEG = 0.008

const APPLY      = process.argv.includes('--apply')
const PATCH_SEED = process.argv.includes('--patch-seed')

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Geocode a single address via Nominatim.
 * Returns { lat, lng } or null if not found.
 */
async function geocode(address, city, state) {
  const query = encodeURIComponent(`${address}, ${city}, ${state}, USA`)
  const url   = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`

  const res = await fetch(url, {
    headers: { 'User-Agent': NOMINATIM_USER_AGENT },
  })

  if (!res.ok) {
    throw new Error(`Nominatim HTTP ${res.status} for: ${address}, ${city}`)
  }

  const data = await res.json()
  if (!data.length) return null

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  }
}

function drift(a, b) {
  return Math.max(Math.abs(a.lat - b.lat), Math.abs(a.lng - b.lng))
}

function fmtCoord(n) {
  return n.toFixed(4)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Fetch all stores
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, address, city, state, lat, lng')
    .order('state')
    .order('city')
    .order('name')

  if (error) {
    console.error('Failed to fetch stores:', error.message)
    process.exit(1)
  }

  console.log(`Fetched ${stores.length} stores. Beginning geocode (1 req/sec)...\n`)

  const patches   = []   // { id, name, old, fresh }
  const notFound  = []   // stores Nominatim couldn't locate
  const ok        = []   // stores within threshold

  for (let i = 0; i < stores.length; i++) {
    const s = stores[i]
    process.stdout.write(`[${String(i + 1).padStart(3)}/${stores.length}] ${s.name.padEnd(40)}`)

    let fresh
    try {
      fresh = await geocode(s.address, s.city, s.state)
    } catch (err) {
      console.log(`  ERROR: ${err.message}`)
      notFound.push(s)
      await sleep(1200)
      continue
    }

    if (!fresh) {
      console.log('  NOT FOUND')
      notFound.push(s)
      await sleep(1200)
      continue
    }

    const old  = { lat: s.lat, lng: s.lng }
    const d    = drift(old, fresh)

    if (d > DRIFT_THRESHOLD_DEG) {
      console.log(
        `  PATCH  (${fmtCoord(old.lat)},${fmtCoord(old.lng)}) → (${fmtCoord(fresh.lat)},${fmtCoord(fresh.lng)})  drift=${d.toFixed(4)}°`
      )
      patches.push({ id: s.id, name: s.name, address: s.address, city: s.city, state: s.state, old, fresh })
    } else {
      console.log(`  OK     drift=${d.toFixed(4)}°`)
      ok.push(s)
    }

    // Nominatim rate limit: 1 req/sec
    await sleep(1100)
  }

  // ── Report ──────────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════')
  console.log(`  SUMMARY`)
  console.log(`  OK        : ${ok.length}`)
  console.log(`  PATCHED   : ${patches.length}`)
  console.log(`  NOT FOUND : ${notFound.length}`)
  console.log('══════════════════════════════════════════════════════\n')

  if (notFound.length) {
    console.log('Stores not found by Nominatim (manual review needed):')
    notFound.forEach(s => console.log(`  - ${s.name} | ${s.address}, ${s.city}, ${s.state}`))
    console.log()
  }

  if (!patches.length) {
    console.log('No coordinate patches needed.')
    return
  }

  // ── Generate SQL patch file ─────────────────────────────────────────────────

  const patchLines = [
    '-- Auto-generated by scripts/geocode-stores.js',
    `-- Generated: ${new Date().toISOString()}`,
    `-- ${patches.length} stores with coordinate drift > ${DRIFT_THRESHOLD_DEG}°`,
    '',
  ]

  for (const p of patches) {
    patchLines.push(`-- ${p.name} | ${p.address}, ${p.city}`)
    patchLines.push(`--   was: (${fmtCoord(p.old.lat)}, ${fmtCoord(p.old.lng)})`)
    patchLines.push(`--   now: (${fmtCoord(p.fresh.lat)}, ${fmtCoord(p.fresh.lng)})`)
    patchLines.push(
      `UPDATE stores SET lat = ${p.fresh.lat}, lng = ${p.fresh.lng}, geocoded_at = NOW() WHERE id = '${p.id}';`
    )
    patchLines.push('')
  }

  const patchPath = join(__dirname, 'store-coordinate-patches.sql')
  writeFileSync(patchPath, patchLines.join('\n'))
  console.log(`Patch SQL written to: ${patchPath}`)
  console.log('Run it in the Supabase SQL Editor, or re-run with --apply to apply automatically.\n')

  // ── Apply patches via Supabase client ──────────────────────────────────────

  if (APPLY) {
    console.log('Applying patches to Supabase...')
    let applied = 0
    for (const p of patches) {
      const { error: updateErr } = await supabase
        .from('stores')
        .update({ lat: p.fresh.lat, lng: p.fresh.lng })
        .eq('id', p.id)

      if (updateErr) {
        console.error(`  FAILED ${p.name}: ${updateErr.message}`)
      } else {
        console.log(`  APPLIED ${p.name}`)
        applied++
      }
    }
    console.log(`\nApplied ${applied}/${patches.length} patches.`)
  }

  // ── Optionally rewrite the seed file ──────────────────────────────────────

  if (PATCH_SEED) {
    const seedPath = join(__dirname, '../supabase/seeds/001_stores.sql')
    let seed = readFileSync(seedPath, 'utf8')

    let seedPatched = 0
    for (const p of patches) {
      // Match the coordinate pair for this store's address in the seed SQL.
      // Pattern: the two numbers after the last comma before the closing paren on the line.
      const escapedAddr = p.address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(
        `(${escapedAddr}[^)]+?)[\\s,]+([-\\d.]+),\\s*([-\\d.]+)(\\s*\\))`,
        'g'
      )
      const updated = seed.replace(re, (_, prefix, _oldLat, _oldLng, suffix) => {
        return `${prefix}  ${p.fresh.lat},  ${p.fresh.lng}${suffix}`
      })
      if (updated !== seed) {
        seed = updated
        seedPatched++
      }
    }

    writeFileSync(seedPath, seed)
    console.log(`\nSeed file updated: ${seedPatched} entries patched in supabase/seeds/001_stores.sql`)
  }
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
