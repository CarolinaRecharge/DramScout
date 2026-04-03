import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../supabase.js'
import StoreDashboard from './StoreDashboard.jsx'
import StoreLotteries from './StoreLotteries.jsx'
import StoreCashier from './StoreCashier.jsx'
import './store-vars.css'

const styles = `
  .portal-root {
    min-height: 100vh;
    background: var(--dark);
    display: flex;
    flex-direction: column;
    font-family: 'DM Mono', monospace;
  }

  .portal-topbar {
    background: var(--dark-2);
    border-bottom: 1px solid var(--bark);
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .portal-brand {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .portal-wordmark {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 900;
    color: var(--amber);
  }

  .portal-mode-badge {
    font-size: 8px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    border: 1px solid var(--bark);
    padding: 3px 8px;
    border-radius: 2px;
  }

  .portal-store-name {
    font-size: 11px;
    color: var(--cream-2);
    letter-spacing: 1px;
  }

  .portal-signout {
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 12px;
    text-transform: uppercase;
    transition: color 0.2s;
  }

  .portal-signout:hover { color: var(--cream); }

  .portal-nav {
    background: var(--dark-2);
    border-bottom: 1px solid var(--bark);
    padding: 0 32px;
    display: flex;
    gap: 0;
  }

  .portal-nav-item {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    padding: 14px 20px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.2s, border-color 0.2s;
    text-decoration: none;
    display: block;
  }

  .portal-nav-item:hover { color: var(--cream-2); }
  .portal-nav-item.portal-nav-active { color: var(--amber); border-bottom-color: var(--amber); }

  .portal-content {
    flex: 1;
    padding: 40px 32px;
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
  }
`

export default function StorePortal() {
  const [storeProfile, setStoreProfile] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    supabase.from('store_profiles')
      .select('*')
      .single()
      .then(({ data }) => setStoreProfile(data))
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/store/login')
  }

  const currentPath = location.pathname

  const navItems = [
    { label: 'Dashboard', path: '/store' },
    { label: 'Lotteries', path: '/store/lotteries' },
    { label: 'Cashier', path: '/store/cashier' },
  ]

  return (
    <div className="store-root">
      <style>{styles}</style>
      <div className="portal-root">
        <div className="portal-topbar">
          <div className="portal-brand">
            <span className="portal-wordmark">Dram Scout</span>
            <span className="portal-mode-badge">Store Portal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {storeProfile && (
              <span className="portal-store-name">
                {storeProfile.store_name}
                {storeProfile.store_number && ` · #${storeProfile.store_number}`}
              </span>
            )}
            <button className="portal-signout" onClick={handleSignOut}>Sign Out</button>
          </div>
        </div>

        <nav className="portal-nav">
          {navItems.map(item => (
            <span
              key={item.path}
              className={`portal-nav-item ${currentPath === item.path ? 'portal-nav-active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </span>
          ))}
        </nav>

        <div className="portal-content">
          <Routes>
            <Route index element={<StoreDashboard storeProfile={storeProfile} />} />
            <Route path="lotteries" element={<StoreLotteries storeProfile={storeProfile} />} />
            <Route path="cashier" element={<StoreCashier storeProfile={storeProfile} />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
