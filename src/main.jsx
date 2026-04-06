import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import StoreLogin from './pages/store/StoreLogin.jsx'
import StorePortal from './pages/store/StorePortal.jsx'
import StoreAuthGuard from './components/StoreAuthGuard.jsx'
import ClaimPage from './pages/ClaimPage.jsx'

class ErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: 40, textAlign: 'center', color: '#fff', background: '#0e0b08', minHeight: '100dvh', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div>Something went wrong.</div>
        <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', background: 'none', border: '1px solid #666', color: '#fff', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
          RELOAD
        </button>
      </div>
    )
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/store/login" element={<StoreLogin />} />
        <Route path="/store/*" element={
          <StoreAuthGuard>
            <StorePortal />
          </StoreAuthGuard>
        } />
        <Route path="/claim/:token" element={<ClaimPage />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
    <Analytics />
    </ErrorBoundary>
  </React.StrictMode>
)

// Remove the HTML loading splash once React has painted,
// regardless of which route rendered (App.jsx only does this for itself).
requestAnimationFrame(() => {
  const splash = document.getElementById('app-loading')
  if (splash) {
    splash.style.transition = 'opacity 0.3s ease'
    splash.style.opacity = '0'
    setTimeout(() => splash.remove(), 300)
  }
})
