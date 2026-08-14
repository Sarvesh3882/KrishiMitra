import { useEffect, useState } from 'react'
import { useTranslation } from '../i18n/useTranslation'
import { WeatherCard } from '../components/WeatherCard'
import { supabase } from '../lib/supabaseClient'

export function WhatsAroundMePage() {
  const { t } = useTranslation()
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()

  useEffect(() => {
    // Try to get GPS coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude)
          setLongitude(position.coords.longitude)
        },
        async () => {
          // GPS denied or failed, fall back to profile coordinates
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase
              .from('farmer_profiles')
              .select('latitude, longitude')
              .eq('user_id', user.id)
              .single()

            if (profile?.latitude && profile?.longitude) {
              setLatitude(profile.latitude)
              setLongitude(profile.longitude)
            }
          }
        }
      )
    } else {
      // No geolocation support, fall back to profile
      ;(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('farmer_profiles')
            .select('latitude, longitude')
            .eq('user_id', user.id)
            .single()

          if (profile?.latitude && profile?.longitude) {
            setLatitude(profile.latitude)
            setLongitude(profile.longitude)
          }
        }
      })()
    }
  }, [])

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#0b5e2c',
          marginBottom: '24px',
        }}
      >
        {t('home.whatsAroundMe')}
      </h1>

      <div style={{ display: 'grid', gap: '20px' }}>
        <WeatherCard latitude={latitude} longitude={longitude} />
      </div>
    </div>
  )
}
