import { supabase } from '@/lib/supabase'

// 현재 사용자 정보 가져오기
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error && error.message !== 'Auth session missing!') {
      console.error('사용자 정보 조회 실패:', error)
      return null
    }
    
    // 더미 유저 반환 로직 제거 - 실제 인증된 사용자만 반환
    
    return user
  } catch (error) {
    console.error('사용자 정보 조회 중 오류:', error)
    return null
  }
}

// UUID v4 생성 함수
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// UUID 형식 검증 함수
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// 게스트 사용자 ID 생성 (로그인하지 않은 경우)
export function getGuestUserId(): string {
  // 로컬 스토리지에서 게스트 ID 확인
  if (typeof window !== 'undefined') {
    let guestId = localStorage.getItem('runspot_guest_id')
    
    // 기존 ID가 없거나 UUID 형식이 아니면 새로 생성
    if (!guestId || !isValidUUID(guestId)) {
      guestId = generateUUID()
      localStorage.setItem('runspot_guest_id', guestId)
    }
    
    return guestId
  }
  
  // 서버 사이드에서는 UUID 형식 임시 ID 반환
  return generateUUID()
}

// 현재 사용자 ID 가져오기 (로그인 사용자 또는 게스트)
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser()
  
  if (user) {
    return user.id
  }
  
  return getGuestUserId()
}

// 로그아웃 함수
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('로그아웃 실패:', error)
      return { success: false, error: error.message }
    }
    
    // 게스트 ID와 게스트 모드 플래그 제거
    if (typeof window !== 'undefined') {
      localStorage.removeItem('runspot_guest_id')
      localStorage.removeItem('runspot_guest_mode')
    }
    
    return { success: true }
  } catch (error) {
    console.error('로그아웃 중 오류:', error)
    return { success: false, error: '로그아웃 중 오류가 발생했습니다.' }
  }
}
