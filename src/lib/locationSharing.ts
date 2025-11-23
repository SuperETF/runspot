import { supabase, getCurrentUser } from './supabase'

/**
 * 사용자의 현재 위치를 shared_locations 테이블에 저장
 */
export const shareCurrentLocation = async (
  latitude: number,
  longitude: number,
  accuracy?: number,
  speed?: number,
  heading?: number,
  isRunning: boolean = false,
  courseId?: string
) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.log('로그인되지 않은 사용자 - 위치 공유 불가')
      return { success: false, error: '로그인이 필요합니다.' }
    }

    console.log('위치 공유 시작:', { latitude, longitude, isRunning })

    // 기존 위치 데이터 삭제 후 새로 추가 (upsert 대신)
    await supabase
      .from('shared_locations')
      .delete()
      .eq('user_id', currentUser.id)

    const { data, error } = await supabase
      .from('shared_locations')
      .insert({
        user_id: currentUser.id,
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy || 0,
        speed: speed || 0,
        heading: heading || 0,
        is_running: isRunning,
        course_id: courseId || null,
        shared_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1시간 후 만료
      })
      .select()

    if (error) {
      console.error('위치 공유 실패:', error)
      return { success: false, error: '위치 공유에 실패했습니다.' }
    }

    console.log('위치 공유 성공:', data)
    return { success: true, data }
  } catch (error) {
    console.error('위치 공유 중 오류:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

/**
 * 사용자의 위치 공유 설정을 확인/생성
 */
export const ensureLocationSettings = async () => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // 기존 설정 확인
    const { data: existingSettings } = await supabase
      .from('user_location_settings')
      .select('*')
      .eq('user_id', currentUser.id)
      .single()

    if (!existingSettings) {
      // 설정이 없으면 기본 설정 생성
      const { data, error } = await supabase
        .from('user_location_settings')
        .insert({
          user_id: currentUser.id,
          sharing_status: 'friends_only',
          share_during_running: true,
          share_with_friends: true,
          location_update_interval: 5
        })
        .select()
        .single()

      if (error) {
        console.error('위치 설정 생성 실패:', error)
        return { success: false, error: '위치 설정 생성에 실패했습니다.' }
      }

      console.log('기본 위치 설정 생성 완료:', data)
      return { success: true, data }
    }

    return { success: true, data: existingSettings }
  } catch (error) {
    console.error('위치 설정 확인 중 오류:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}
