import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Export createClient function for use in other files
export { createClient }

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  // 개발용: 로그인된 유저가 없으면 더미 유저 반환
  if (!user && process.env.NODE_ENV === 'development') {
    return {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'dev@runspot.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
  
  return user
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const user = await getCurrentUser()
  return !!user
}
