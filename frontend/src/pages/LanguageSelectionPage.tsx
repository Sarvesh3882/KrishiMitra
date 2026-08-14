import { useNavigate } from 'react-router-dom'
import { useSetLanguage } from '../contexts/LanguageContext'

export function LanguageSelectionPage() {
  const setLanguage = useSetLanguage()
  const navigate = useNavigate()

  const handleLanguageSelect = (lang: 'en' | 'hi' | 'mr') => {
    setLanguage(lang)
    navigate('/signin')
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '40px 24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#0b5e2c',
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          Select Your Language / अपनी भाषा चुनें / आपली भाषा निवडा
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            onClick={() => handleLanguageSelect('en')}
            style={{
              minHeight: '56px',
              padding: '16px',
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: '#0b5e2c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            English
          </button>

          <button
            onClick={() => handleLanguageSelect('hi')}
            style={{
              minHeight: '56px',
              padding: '16px',
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: '#0b5e2c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            हिंदी
          </button>

          <button
            onClick={() => handleLanguageSelect('mr')}
            style={{
              minHeight: '56px',
              padding: '16px',
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: '#0b5e2c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            मराठी
          </button>
        </div>
      </div>
    </div>
  )
}
