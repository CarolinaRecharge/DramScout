import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import StoreLogin from './pages/store/StoreLogin.jsx'
import StorePortal from './pages/store/StorePortal.jsx'
import StoreAuthGuard from './components/StoreAuthGuard.jsx'
import ClaimPage from './pages/ClaimPage.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
