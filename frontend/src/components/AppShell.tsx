import { type ReactNode, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from '../i18n/useTranslation'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#0b5e2c',
        color: '#ffffff',
        padding: '12px 16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          maxWidth: '420px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {t('app.title')}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
          }}>
            <span style={{
              display: 'inline-block',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#f5820a',
              textAlign: 'center',
              lineHeight: '24px',
              fontWeight: 'bold',
            }}>
              🏛️
            </span>
            <span>{t('app.subtitle')}</span>
          </div>
        </div>
      </header>

      {/* Offline Banner */}
      {!isOnline && (
        <div style={{
          position: 'sticky',
          top: '56px', // below header
          zIndex: 99,
          backgroundColor: '#ffa500',
          color: '#000',
          padding: '12px 16px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          {t('offline.banner')}
        </div>
      )}

      {/* Main Content */}
      <main style={{
        flex: 1,
        maxWidth: '420px',
        width: '100%',
        margin: '0 auto',
        paddingBottom: '80px', // space for bottom nav
      }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTop: '2px solid #e0e0e0',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          maxWidth: '420px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '8px 0',
        }}>
          <BottomNavItem
            to="/"
            label={t('nav.home')}
            icon="🏠"
            active={location.pathname === '/'}
          />
          <BottomNavItem
            to="/schemes"
            label={t('nav.schemes')}
            icon="📋"
            active={location.pathname === '/schemes'}
          />
          <BottomNavItem
            to="/community"
            label={t('nav.community')}
            icon="👥"
            active={location.pathname === '/community'}
          />
          <BottomNavItem
            to="/ask"
            label={t('nav.ask')}
            icon="💬"
            active={location.pathname === '/ask'}
          />
        </div>
      </nav>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f5f5f5',
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#666',
        zIndex: -1, // behind bottom nav
      }}>
        {t('app.attribution')}
      </div>
    </div>
  )
}

interface BottomNavItemProps {
  to: string
  label: string
  icon: string
  active: boolean
}

function BottomNavItem({ to, label, icon, active }: BottomNavItemProps) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '64px',
        minHeight: '48px',
        textDecoration: 'none',
        color: active ? '#0b5e2c' : '#666',
        fontWeight: active ? 'bold' : 'normal',
      }}
    >
      <span style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</span>
      <span style={{ fontSize: '12px' }}>{label}</span>
    </Link>
  )
}
