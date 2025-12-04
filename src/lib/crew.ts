import { supabase } from './supabase'

// =============================================
// 타입 정의
// =============================================

export interface Crew {
  id: string
  name: string
  description: string | null
  short_description: string | null
  logo_url: string | null
  instagram_url: string | null
  kakao_url: string | null
  created_at: string
  updated_at: string
}

export interface CrewMember {
  id: string
  crew_id: string
  user_id: string | null
  name: string
  role: string
  pace: string | null
  main_distance: string | null
  profile_image: string | null
  link_url: string | null
  is_active: boolean
  joined_at: string
  created_at: string
}

export interface CrewSchedule {
  id: string
  crew_id: string
  title: string
  description: string | null
  schedule_date: string | null
  schedule_day: string | null
  time: string
  location: string
  distance: string | null
  pace: string | null
  max_participants: number | null
  is_regular: boolean
  is_completed: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  participants_count?: number
}

export interface CrewGalleryItem {
  id: string
  crew_id: string
  image_url: string
  caption: string | null
  instagram_url: string | null
  likes_count: number
  uploaded_by: string | null
  created_at: string
}

export interface CrewStats {
  totalMembers: number
  totalDistance: number
  averagePace: string
}

// =============================================
// 크루 정보 조회
// =============================================

const FRC_CREW_ID = 'frc-001'

export async function getCrewInfo(): Promise<Crew | null> {
  const { data, error } = await (supabase as any)
    .from('crews')
    .select('*')
    .eq('id', FRC_CREW_ID)
    .single()

  if (error) {
    return null
  }

  return data
}

// =============================================
// 크루 멤버 조회
// =============================================

export async function getCrewMembers(): Promise<CrewMember[]> {
  const { data, error } = await (supabase as any)
    .from('crew_members')
    .select('*')
    .eq('is_active', true)
    .order('role', { ascending: true })
    .order('joined_at', { ascending: true })

  if (error) {
    return []
  }

  // 역할 순서 정렬: 크루장 > 페이서 > 멤버
  const roleOrder: Record<string, number> = { '크루장': 0, '페이서': 1, '멤버': 2 }
  return (data || []).sort((a, b) => {
    const orderA = roleOrder[a.role] ?? 99
    const orderB = roleOrder[b.role] ?? 99
    return orderA - orderB
  })
}

// =============================================
// 런닝 일정 조회
// =============================================

export async function getCrewSchedules(): Promise<CrewSchedule[]> {
  const { data, error } = await (supabase as any)
    .from('crew_schedules')
    .select(`
      *,
      crew_schedule_participants(count)
    `)
    .eq('is_active', true)
    .order('is_regular', { ascending: false })
    .order('schedule_date', { ascending: true })

  if (error) {
    return []
  }

  return (data || []).map((schedule: any) => ({
    ...schedule,
    participants_count: schedule.crew_schedule_participants?.[0]?.count || 0
  }))
}

export async function getNextSchedule(): Promise<CrewSchedule | null> {
  const schedules = await getUpcomingSchedules(1)
  return schedules[0] || null
}

// 다가오는 일정 여러 개 가져오기
export async function getUpcomingSchedules(limit: number = 5): Promise<CrewSchedule[]> {
  const today = new Date().toISOString().split('T')[0]
  
  // 특별 런닝 (날짜가 오늘 이후)
  const { data: specialData } = await (supabase as any)
    .from('crew_schedules')
    .select(`
      *,
      crew_schedule_participants(count)
    `)
    .eq('is_active', true)
    .eq('is_completed', false)
    .eq('is_regular', false)
    .gte('schedule_date', today)
    .order('schedule_date', { ascending: true })
    .limit(limit)

  // 정기 런닝
  const { data: regularData } = await (supabase as any)
    .from('crew_schedules')
    .select(`
      *,
      crew_schedule_participants(count)
    `)
    .eq('is_active', true)
    .eq('is_completed', false)
    .eq('is_regular', true)
    .limit(limit)

  const specials = (specialData || []).map((s: any) => ({
    ...s,
    participants_count: s.crew_schedule_participants?.[0]?.count || 0
  }))

  const regulars = (regularData || []).map((s: any) => ({
    ...s,
    participants_count: s.crew_schedule_participants?.[0]?.count || 0
  }))

  // 특별 런닝 먼저, 그 다음 정기 런닝
  return [...specials, ...regulars].slice(0, limit)
}

// =============================================
// 갤러리 조회
// =============================================

export async function getCrewGallery(limit: number = 4): Promise<CrewGalleryItem[]> {
  const { data, error } = await (supabase as any)
    .from('crew_gallery')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return []
  }

  return data || []
}

// =============================================
// 크루 통계 계산
// =============================================

export async function getCrewStats(): Promise<CrewStats> {
  // 멤버 수
  const { count: memberCount } = await (supabase as any)
    .from('crew_members')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // 멤버들의 페이스 평균 계산
  const { data: members } = await (supabase as any)
    .from('crew_members')
    .select('pace')
    .eq('is_active', true)
    .not('pace', 'is', null)

  let averagePace = '-'
  if (members && members.length > 0) {
    const paces = members
      .map(m => m.pace)
      .filter((p): p is string => p !== null)
      .map(p => {
        const [min, sec] = p.split(':').map(Number)
        return min * 60 + (sec || 0)
      })
    
    if (paces.length > 0) {
      const avgSeconds = paces.reduce((a, b) => a + b, 0) / paces.length
      const avgMin = Math.floor(avgSeconds / 60)
      const avgSec = Math.round(avgSeconds % 60)
      averagePace = `${avgMin}:${avgSec.toString().padStart(2, '0')}`
    }
  }

  return {
    totalMembers: memberCount || 0,
    totalDistance: 0, // 추후 런닝 기록 연동 시 계산
    averagePace
  }
}

// =============================================
// 갤러리 좋아요
// =============================================

export async function toggleGalleryLike(galleryId: string, visitorId: string): Promise<{ liked: boolean; newCount: number }> {
  // 현재 좋아요 상태 확인
  const { data: existingLike } = await (supabase as any)
    .from('crew_gallery_likes')
    .select('id')
    .eq('gallery_id', galleryId)
    .eq('user_id', visitorId)
    .single()

  if (existingLike) {
    // 좋아요 취소
    await (supabase as any)
      .from('crew_gallery_likes')
      .delete()
      .eq('id', existingLike.id)

    // 카운트 감소
    await (supabase as any).rpc('decrement_gallery_likes', { gallery_id: galleryId })
    
    const { data: gallery } = await (supabase as any)
      .from('crew_gallery')
      .select('likes_count')
      .eq('id', galleryId)
      .single()

    return { liked: false, newCount: gallery?.likes_count || 0 }
  } else {
    // 좋아요 추가
    await (supabase as any)
      .from('crew_gallery_likes')
      .insert({ gallery_id: galleryId, user_id: visitorId })

    // 카운트 증가
    await (supabase as any).rpc('increment_gallery_likes', { gallery_id: galleryId })

    const { data: gallery } = await (supabase as any)
      .from('crew_gallery')
      .select('likes_count')
      .eq('id', galleryId)
      .single()

    return { liked: true, newCount: gallery?.likes_count || 0 }
  }
}

// D-day 계산 헬퍼
export function calculateDday(dateStr: string | null): string {
  if (!dateStr) return ''
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const targetDate = new Date(dateStr)
  targetDate.setHours(0, 0, 0, 0)
  
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'D-Day'
  if (diffDays > 0) return `D-${diffDays}`
  return `D+${Math.abs(diffDays)}`
}

// 요일 기반 다음 날짜 계산 (정기 런닝용)
export function getNextDayOfWeek(dayName: string): string {
  const days: Record<string, number> = {
    '일요일': 0, '월요일': 1, '화요일': 2, '수요일': 3,
    '목요일': 4, '금요일': 5, '토요일': 6
  }
  
  const targetDay = days[dayName]
  if (targetDay === undefined) return ''
  
  const today = new Date()
  const currentDay = today.getDay()
  let daysUntil = targetDay - currentDay
  
  if (daysUntil <= 0) daysUntil += 7
  
  const nextDate = new Date(today)
  nextDate.setDate(today.getDate() + daysUntil)
  
  return nextDate.toISOString().split('T')[0]
}
