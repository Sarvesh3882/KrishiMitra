import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

// ── Farmer profile shape (mirrors DB columns) ─────────────────────────────
export interface FarmerProfile {
  id: string
  user_id: string
  full_name: string | null
  phone_number: string | null
  aadhaar_last4: string | null   // last 4 digits only — never full Aadhaar
  state: string | null
  district: string | null
  taluka: string | null
  village: string | null
  enterprise_type: string | null
  primary_crop: string | null
  preferred_language: 'en' | 'hi' | 'mr'
  created_at: string
  updated_at: string
}

export type EnterpriseType =
  | 'dairy' | 'poultry' | 'fisheries' | 'goat'
  | 'apiculture' | 'mushroom' | 'vermicompost'

// ── Context shape ──────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null
  session: Session | null
  profile: FarmerProfile | null
  loading: boolean               // initial session load
  profileLoading: boolean        // profile fetch in progress
  isProfileComplete: boolean     // has farmer completed onboarding?

  // Phone OTP flow
  sendOtp: (phone: string) => Promise<{ error: string | null }>
  verifyOtp: (phone: string, token: string) => Promise<{ error: string | null; isNewUser: boolean }>

  // Profile management
  saveProfile: (data: Partial<FarmerProfile>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>

  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ── Helper: format Indian phone to E.164 ──────────────────────────────────
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Already has country code
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`
  // 10-digit Indian number
  if (digits.length === 10) return `+91${digits}`
  return `+${digits}`
}

// ── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                     = useState<User | null>(null)
  const [session, setSession]               = useState<Session | null>(null)
  const [profile, setProfile]               = useState<FarmerProfile | null>(null)
  const [loading, setLoading]               = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // ── Derived: profile is complete if farmer filled in name + village ──
  const isProfileComplete = !!(profile?.full_name && profile?.village)

  // ── Fetch profile for current user ────────────────────────────────────
  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) return
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!error && data) setProfile(data as FarmerProfile)
      else setProfile(null)
    } catch {
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  // ── Bootstrap: get existing session ───────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else setProfile(null)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // ── Phone OTP: step 1 — send ───────────────────────────────────────────
  const sendOtp = async (phone: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) {
      // Demo mode — pretend OTP sent
      return { error: null }
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: toE164(phone),
      })
      return { error: error?.message ?? null }
    } catch (e: any) {
      return { error: e?.message ?? 'Failed to send OTP' }
    }
  }

  // ── Phone OTP: step 2 — verify ────────────────────────────────────────
  const verifyOtp = async (
    phone: string,
    token: string
  ): Promise<{ error: string | null; isNewUser: boolean }> => {
    if (!isSupabaseConfigured) {
      // Demo mode — accept any 6-digit token
      if (token.length === 6) return { error: null, isNewUser: false }
      return { error: 'Invalid OTP', isNewUser: false }
    }
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: toE164(phone),
        token,
        type: 'sms',
      })
      if (error) return { error: error.message, isNewUser: false }

      // Check if profile exists → determines if new farmer or returning
      const userId = data.user?.id
      if (!userId) return { error: 'Verification failed', isNewUser: false }

      const { data: existing } = await supabase
        .from('farmer_profiles')
        .select('id, full_name')
        .eq('user_id', userId)
        .maybeSingle()

      const isNewUser = !existing?.full_name
      return { error: null, isNewUser }
    } catch (e: any) {
      return { error: e?.message ?? 'Verification failed', isNewUser: false }
    }
  }

  // ── Save / upsert farmer profile ──────────────────────────────────────
  const saveProfile = async (
    data: Partial<FarmerProfile>
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' }
    if (!isSupabaseConfigured) {
      // Demo mode — just update local state
      setProfile((prev) => ({ ...(prev ?? {} as FarmerProfile), ...data }))
      return { error: null }
    }
    try {
      const { error } = await supabase
        .from('farmer_profiles')
        .upsert(
          { ...data, user_id: user.id, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
      if (error) return { error: error.message }
      await fetchProfile(user.id)
      return { error: null }
    } catch (e: any) {
      return { error: e?.message ?? 'Failed to save profile' }
    }
  }

  // ── Sign out ───────────────────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile,
      loading, profileLoading, isProfileComplete,
      sendOtp, verifyOtp,
      saveProfile, refreshProfile,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hooks ─────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
