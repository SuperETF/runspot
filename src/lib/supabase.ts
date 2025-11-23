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
  try {
    // 먼저 세션을 확인하고 필요시 갱신
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('세션 확인 오류:', sessionError)
      // 세션 오류가 있으면 로그아웃 처리
      await supabase.auth.signOut()
      return null
    }

    // 세션이 만료되었거나 없는 경우
    if (!session) {
      return null
    }

    // 토큰이 곧 만료될 예정이면 갱신 시도
    const now = Math.round(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    const timeUntilExpiry = expiresAt - now
    
    // 5분 이내에 만료될 예정이면 토큰 갱신
    if (timeUntilExpiry < 300) {
      console.log('토큰 갱신 시도...')
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('토큰 갱신 실패:', refreshError)
        await supabase.auth.signOut()
        return null
      }
      
      if (refreshData.session) {
        return refreshData.session.user
      }
    }

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('사용자 정보 조회 오류:', error)
      // 인증 오류가 있으면 로그아웃 처리
      if (error.message.includes('JWT') || error.message.includes('token')) {
        await supabase.auth.signOut()
      }
      return null
    }
    
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
  } catch (error) {
    console.error('getCurrentUser 오류:', error)
    return null
  }
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const user = await getCurrentUser()
  return !!user
}
