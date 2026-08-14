import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSetLanguage } from '../contexts/LanguageContext'
import { useTranslation } from '../i18n/useTranslation'
import { supabase } from '../lib/supabaseClient'

interface FarmerProfile {
  full_name: string
  phone: string
  state: string
  district: string
  taluka: string
  village: string
  enterprise_type: string
  primary_crop: string | null
  latitude: number | null
  longitude: number | null
  preferred_language: string
}

export function ProfilePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const setLanguage = useSetLanguage()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [profile, setProfile] = useState<FarmerProfile>({
    full_name: '',
    phone: '',
    state: '',
    district: '',
    taluka: '',
    village: '',
    enterprise_type: '',
    primary_crop: null,
    latitude: null,
    longitude: null,
    preferred_language: 'en',
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data, error: fetchError } = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (new user)
        throw fetchError
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          state: data.state || '',
          district: data.district || '',
          taluka: data.taluka || '',
          village: data.village || '',
          enterprise_type: data.enterprise_type || '',
          primary_crop: data.primary_crop,
          latitude: data.latitude,
          longitude: data.longitude,
          preferred_language: data.preferred_language || 'en',
        })

        // Sync language preference
        if (data.preferred_language) {
          setLanguage(data.preferred_language as 'en' | 'hi' | 'mr')
        }
      }
    } catch (err: any) {
      console.error('Profile load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError('')
    setSuccess(false)
    setSaving(true)

    try {
      const { error: upsertError } = await supabase
        .from('farmer_profiles')
        .upsert({
          user_id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        })

      if (upsertError) throw upsertError

      // Sync language preference
      setLanguage(profile.preferred_language as 'en' | 'hi' | 'mr')

      setSuccess(true)
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (err: any) {
      setError(err.message || t('profile.error'))
    } finally {
      setSaving(false)
    }
  }

  const requestGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setProfile({
            ...profile,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (err) => {
          console.error('GPS error:', err)
          alert(t('profile.gpsDenied'))
        }
      )
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>{t('general.loading')}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#0b5e2c',
        marginBottom: '24px',
      }}>
        {t('profile.title')}
      </h1>

      <form onSubmit={handleSave}>
        <FormField
          label={t('profile.fullName')}
          value={profile.full_name}
          onChange={(val) => setProfile({ ...profile, full_name: val })}
          required
        />

        <FormField
          label={t('profile.phone')}
          value={profile.phone}
          onChange={(val) => setProfile({ ...profile, phone: val })}
          type="tel"
          required
        />

        <FormField
          label={t('profile.state')}
          value={profile.state}
          onChange={(val) => setProfile({ ...profile, state: val })}
          required
        />

        <FormField
          label={t('profile.district')}
          value={profile.district}
          onChange={(val) => setProfile({ ...profile, district: val })}
          required
        />

        <FormField
          label={t('profile.taluka')}
          value={profile.taluka}
          onChange={(val) => setProfile({ ...profile, taluka: val })}
          required
        />

        <FormField
          label={t('profile.village')}
          value={profile.village}
          onChange={(val) => setProfile({ ...profile, village: val })}
          required
        />

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '16px',
            color: '#0b5e2c',
            marginBottom: '8px',
            fontWeight: 'bold',
          }}>
            {t('profile.enterpriseType')} *
          </label>
          <select
            value={profile.enterprise_type}
            onChange={(e) => setProfile({ ...profile, enterprise_type: e.target.value })}
            required
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          >
            <option value="">{t('profile.selectEnterprise')}</option>
            <option value="poultry">{t('enterprise.poultry')}</option>
            <option value="fisheries">{t('enterprise.fisheries')}</option>
            <option value="apiculture">{t('enterprise.apiculture')}</option>
            <option value="mushroom">{t('enterprise.mushroom')}</option>
            <option value="vermicompost">{t('enterprise.vermicompost')}</option>
            <option value="dairy">{t('enterprise.dairy')}</option>
            <option value="goat">{t('enterprise.goat')}</option>
          </select>
        </div>

        <FormField
          label={t('profile.primaryCrop')}
          value={profile.primary_crop || ''}
          onChange={(val) => setProfile({ ...profile, primary_crop: val || null })}
        />

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '16px',
            color: '#0b5e2c',
            marginBottom: '8px',
            fontWeight: 'bold',
          }}>
            {t('profile.language')} *
          </label>
          <select
            value={profile.preferred_language}
            onChange={(e) => setProfile({ ...profile, preferred_language: e.target.value })}
            required
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            onClick={requestGPS}
            style={{
              padding: '12px 16px',
              backgroundColor: '#f5820a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            {profile.latitude
              ? `${t('profile.gpsGranted')} (${profile.latitude.toFixed(4)}, ${profile.longitude?.toFixed(4)})`
              : t('profile.gpsRequest')
            }
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: '#efe',
            color: '#3c3',
            borderRadius: '4px',
            fontSize: '14px',
          }}>
            {t('profile.saved')}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            minHeight: '48px',
            backgroundColor: saving ? '#aaa' : '#0b5e2c',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : t('profile.save')}
        </button>
      </form>
    </div>
  )
}

interface FormFieldProps {
  label: string
  value: string
  onChange: (val: string) => void
  type?: string
  required?: boolean
}

function FormField({ label, value, onChange, type = 'text', required = false }: FormFieldProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '16px',
        color: '#0b5e2c',
        marginBottom: '8px',
        fontWeight: 'bold',
      }}>
        {label} {required && '*'}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          width: '100%',
          minHeight: '48px',
          padding: '12px',
          fontSize: '16px',
          border: '2px solid #e0e0e0',
          borderRadius: '4px',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
