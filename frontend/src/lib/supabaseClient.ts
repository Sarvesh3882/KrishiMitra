import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseAnonKey !== 'your_supabase_anon_key'

if (!hasValidCredentials) {
  console.warn('⚠️ Supabase credentials not configured. Using demo mode.')
  console.warn('To enable full features, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env')
}

// Create client with valid URL format even if credentials are placeholders
export const supabase = createClient(
  hasValidCredentials ? supabaseUrl : 'https://demo.supabase.co', 
  hasValidCredentials ? supabaseAnonKey : ''
)

export const isSupabaseConfigured = hasValidCredentials
