import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'danielk.black95@gmail.com'

// Service-role client — bypasses RLS for admin operations.
// Guarded: only used after verifying the caller is the admin.
function getAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Verify the incoming JWT and assert the caller is the admin user.
async function requireAdmin(req) {
  const authHeader = req.headers.authorization
  if (!authHeader) return null

  const jwt = authHeader.replace('Bearer ', '')
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } }
  })
  const { data: { user }, error } = await anon.auth.getUser(jwt)
  if (error || !user) return null
  if (user.email !== ADMIN_EMAIL) return null
  return user
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req)
  if (!admin) return res.status(403).json({ error: 'Admin access required' })

  const supabase = getAdminClient()

  // ── GET: list all store_profiles grouped by owner store ──────────────────
  if (req.method === 'GET') {
    // Fetch all store_profiles rows
    const { data, error } = await supabase
      .from('store_profiles')
      .select('id, store_name, store_number, county, address, contact_name, contact_phone, is_active, store_role, parent_store_id, created_at')
      .order('created_at', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    // Fetch email addresses from auth.users for all profile IDs
    const ids = data.map(p => p.id)
    const emailMap = {}
    // Batch fetch in chunks of 50 to avoid URL length limits
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50)
      // Use auth.admin.listUsers and filter — or use RPC if available
      // Here we use a direct admin user lookup per ID
      await Promise.all(chunk.map(async id => {
        const { data: u } = await supabase.auth.admin.getUserById(id)
        if (u?.user) emailMap[id] = u.user.email
      }))
    }

    // Attach email to each profile row
    const profiles = data.map(p => ({ ...p, email: emailMap[p.id] || null }))

    // Group: owners (parent_store_id IS NULL) → sub-accounts
    const owners = profiles.filter(p => !p.parent_store_id)
    const subAccounts = profiles.filter(p => p.parent_store_id)

    const grouped = owners.map(owner => ({
      ...owner,
      accounts: [
        owner,
        ...subAccounts.filter(a => a.parent_store_id === owner.id)
      ]
    }))

    return res.status(200).json({ stores: grouped })
  }

  // ── POST: create a new store account ────────────────────────────────────
  // Body for new owner store:
  //   { email, password, store_name, store_number, county, address, contact_name }
  // Body for sub-account (manager/cashier):
  //   { email, password, store_role, parent_store_id }
  if (req.method === 'POST') {
    const { email, password, store_role = 'owner', parent_store_id, store_name, store_number, county, address, contact_name, contact_phone } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    // Resolve store details for sub-accounts from the parent
    let resolvedStoreName = store_name
    let resolvedStoreNumber = store_number
    let resolvedCounty = county
    let resolvedAddress = address
    let resolvedContactName = contact_name
    let resolvedContactPhone = contact_phone

    if (parent_store_id) {
      const { data: parent, error: parentErr } = await supabase
        .from('store_profiles')
        .select('store_name, store_number, county, address, contact_name, contact_phone, store_role')
        .eq('id', parent_store_id)
        .single()

      if (parentErr || !parent) {
        return res.status(400).json({ error: 'Parent store not found' })
      }
      if (parent.parent_store_id) {
        return res.status(400).json({ error: 'Cannot nest sub-accounts: parent must be an owner account' })
      }
      resolvedStoreName = parent.store_name
      resolvedStoreNumber = parent.store_number
      resolvedCounty = parent.county
      resolvedAddress = parent.address
      resolvedContactName = parent.contact_name
      resolvedContactPhone = parent.contact_phone
    } else {
      // Owner account requires store_name
      if (!store_name) return res.status(400).json({ error: 'store_name required for owner account' })
    }

    // 1. Create the Supabase auth user
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (createErr) {
      return res.status(400).json({ error: createErr.message })
    }

    const userId = created.user.id

    // 2. Insert the store_profiles row
    const profileRow = {
      id: userId,
      store_name: resolvedStoreName,
      store_number: resolvedStoreNumber || null,
      county: resolvedCounty || null,
      address: resolvedAddress || null,
      contact_name: resolvedContactName || null,
      contact_phone: resolvedContactPhone || null,
      is_active: true,
      store_role,
      parent_store_id: parent_store_id || null
    }

    const { error: profileErr } = await supabase
      .from('store_profiles')
      .insert(profileRow)

    if (profileErr) {
      // Roll back the auth user if profile insert fails
      await supabase.auth.admin.deleteUser(userId)
      return res.status(500).json({ error: profileErr.message })
    }

    return res.status(201).json({
      user_id: userId,
      email,
      store_role,
      parent_store_id: parent_store_id || null
    })
  }

  // ── PATCH: update store_role or is_active ────────────────────────────────
  // Body: { userId, store_role?, is_active? }
  if (req.method === 'PATCH') {
    const { userId, store_role, is_active } = req.body
    if (!userId) return res.status(400).json({ error: 'userId required' })

    const updates = {}
    if (store_role !== undefined) {
      if (!['owner', 'manager', 'cashier'].includes(store_role)) {
        return res.status(400).json({ error: 'Invalid store_role' })
      }
      updates.store_role = store_role
    }
    if (is_active !== undefined) updates.is_active = Boolean(is_active)

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' })
    }

    const { error } = await supabase
      .from('store_profiles')
      .update(updates)
      .eq('id', userId)

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
