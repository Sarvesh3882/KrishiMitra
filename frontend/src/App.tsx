import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { LanguageSelectionPage } from './pages/LanguageSelectionPage'
import { WhatsAroundMePage } from './pages/WhatsAroundMePage'
import { MarketLinkagePage } from './pages/MarketLinkagePage'
import { isSupabaseConfigured } from './lib/supabaseClient'

function AppRouter() {
  const [showLanguageSelection, setShowLanguageSelection] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const lang = localStorage.getItem('language')
    if (!lang) {
      setShowLanguageSelection(true)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return null
  }

  if (showLanguageSelection) {
    return <LanguageSelectionPage />
  }

  // Demo mode: Skip auth if Supabase not configured
  const DemoWrapper = ({ children }: { children: React.ReactNode }) => {
    if (!isSupabaseConfigured) {
      return <AppShell>{children}</AppShell>
    }
    return <ProtectedRoute><AppShell>{children}</AppShell></ProtectedRoute>
  }

  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/profile" element={<DemoWrapper><ProfilePage /></DemoWrapper>} />
      <Route path="/around" element={<DemoWrapper><WhatsAroundMePage /></DemoWrapper>} />
      <Route path="/market" element={<DemoWrapper><MarketLinkagePage /></DemoWrapper>} />
      <Route path="/" element={<DemoWrapper><HomePage /></DemoWrapper>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppRouter />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
