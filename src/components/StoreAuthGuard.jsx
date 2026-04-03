import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'

export default function StoreAuthGuard({ children }) {
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/store/login')
        return
      }

      const { data: profile } = await supabase
        .from('store_profiles')
        .select('id, store_name, is_active')
        .eq('id', session.user.id)
        .single()

      if (!profile || !profile.is_active) {
        await supabase.auth.signOut()
        navigate('/store/login?error=unauthorized')
        return
      }

      setAuthorized(true)
      setChecking(false)
    }
    check()
  }, [])

  if (checking) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0D0A07', color: '#8A7660',
        fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '2px'
      }}>
        VERIFYING STORE ACCESS...
      </div>
    )
  }

  return authorized ? children : null
}
