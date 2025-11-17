import { supabase } from './supabase'

// 사용자 프로필 정보 가져오기
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('프로필 조회 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('프로필 조회 실패:', error)
    return null
  }
}

// 사용자 최근 활동 가져오기
export async function getUserRecentActivities(userId: string, limit = 5) {
  try {
    const { data, error } = await supabase
      .from('running_logs')
      .select(`
        *,
        courses!running_logs_course_id_fkey(name, area)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('최근 활동 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('최근 활동 조회 실패:', error)
    return []
  }
}

// 사용자 통계 초기화 (첫 로그인 시)
export async function initializeUserStats(userId: string) {
  try {
    const { error } = await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        total_distance: 0,
        total_runs: 0,
        total_time: 0,
        avg_pace: 0,
        current_level: '입문 러너',
        level_progress: 0,
        next_level_target: 50
      } as any)

    if (error && error.code !== '23505') { // 23505는 unique constraint 위반 (이미 존재)
      console.error('사용자 통계 초기화 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('사용자 통계 초기화 실패:', error)
    return false
  }
}

// 사용자 설정 초기화 (첫 로그인 시)
export async function initializeUserSettings(userId: string) {
  try {
    const { error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId
      } as any)

    if (error && error.code !== '23505') { // 이미 존재하는 경우 무시
      console.error('사용자 설정 초기화 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('사용자 설정 초기화 실패:', error)
    return false
  }
}

// 시간 포맷팅 함수
export function formatTime(minutes: number): string {
  if (minutes === 0) return '0분'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}분`
  if (mins === 0) return `${hours}시간`
  return `${hours}시간 ${mins}분`
}

// 페이스 포맷팅 함수
export function formatPace(pace: number): string {
  if (pace === 0) return '0:00'
  
  const minutes = Math.floor(pace)
  const seconds = Math.round((pace - minutes) * 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// 날짜 포맷팅 함수
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '어제'
  if (diffDays === 2) return '2일 전'
  if (diffDays <= 7) return `${diffDays}일 전`
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}주 전`
  return `${Math.ceil(diffDays / 30)}개월 전`
}
