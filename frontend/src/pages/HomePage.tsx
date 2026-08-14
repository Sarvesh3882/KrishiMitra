import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../i18n/useTranslation'

export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div style={{ padding: '20px' }}>
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#0b5e2c',
          marginBottom: '24px',
        }}
      >
        {t('home.title')}
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
        }}
      >
        <HomeCard
          title={t('home.whatsAroundMe')}
          description={t('home.whatsAroundMeDesc')}
          icon="📍"
          onClick={() => navigate('/around')}
        />
        <HomeCard
          title={t('home.schemesTraining')}
          description={t('home.schemesTrainingDesc')}
          icon="📋"
          onClick={() => navigate('/schemes')}
        />
        <HomeCard
          title={t('home.community')}
          description={t('home.communityDesc')}
          icon="👥"
          onClick={() => navigate('/community')}
        />
        <HomeCard
          title={t('home.askKrishiMitra')}
          description={t('home.askKrishiMitraDesc')}
          icon="💬"
          onClick={() => navigate('/ask')}
        />
      </div>
    </div>
  )
}

interface HomeCardProps {
  title: string
  description: string
  icon: string
  onClick: () => void
}

function HomeCard({ title, description, icon, onClick }: HomeCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e0e0e0',
        borderRadius: '8px',
        padding: '24px 16px',
        minHeight: '140px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{icon}</div>
      <div
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#0b5e2c',
          marginBottom: '8px',
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>{description}</div>
    </button>
  )
}
