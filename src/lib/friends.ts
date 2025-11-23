import { supabase, getCurrentUser } from './supabase'
import type { 
  Friendship, 
  FriendshipInsert, 
  FriendWithDetails, 
  FriendRequest,
  User,
  UserLocationSettings,
  SharedLocation,
  FriendLocationData
} from '@/types/database'
import { calculateDistance } from '@/utils/mapUtils'
import { getOptimalUpdateInterval, type RunningContext } from '@/utils/locationOptimizer'

/**
 * 친구 관리 서비스
 * 기존 RunSpot 코드베이스 스타일과 일관성 유지
 */

// 친구 요청 보내기
export const sendFriendRequest = async (addresseeId: string): Promise<{ success: boolean; data?: Friendship; error?: string }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // 자기 자신에게 친구 요청 방지
    if (currentUser.id === addresseeId) {
      return { success: false, error: '자기 자신에게는 친구 요청을 보낼 수 없습니다.' }
    }

    // 기존 친구 관계 확인
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${currentUser.id})`)
      .single()

    if (existingFriendship) {
      return { success: false, error: '이미 친구 관계가 존재합니다.' }
    }

    // 친구 요청 생성
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: currentUser.id,
        addressee_id: addresseeId,
        status: 'pending'
      } as any)
      .select()
      .single()

    if (error) {
      console.error('친구 요청 전송 실패:', error)
      return { success: false, error: '친구 요청 전송에 실패했습니다.' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('sendFriendRequest error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// 친구 요청 수락
export const acceptFriendRequest = async (friendshipId: string): Promise<{ success: boolean; data?: Friendship; error?: string }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' } as any)
      .eq('id', friendshipId)
      .eq('addressee_id', currentUser.id) // 요청받은 사람만 수락 가능
      .eq('status', 'pending') // pending 상태만 수락 가능
      .select()
      .single()

    if (error) {
      console.error('친구 요청 수락 실패:', error)
      return { success: false, error: '친구 요청 수락에 실패했습니다.' }
    }

    if (!data) {
      return { success: false, error: '유효하지 않은 친구 요청입니다.' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('acceptFriendRequest error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// 친구 요청 거절/친구 삭제
export const rejectFriendRequest = async (friendshipId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)

    if (error) {
      console.error('친구 요청 거절/삭제 실패:', error)
      return { success: false, error: '작업에 실패했습니다.' }
    }

    return { success: true }
  } catch (error) {
    console.error('rejectFriendRequest error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// 친구 목록 조회
export const getFriends = async (): Promise<{ success: boolean; data?: FriendWithDetails[]; error?: string }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        created_at,
        requester:users!friendships_requester_id_fkey(id, name, profile_image, total_distance, total_runs, created_at),
        addressee:users!friendships_addressee_id_fkey(id, name, profile_image, total_distance, total_runs, created_at)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('친구 목록 조회 실패:', error)
      return { success: false, error: '친구 목록을 불러오는데 실패했습니다.' }
    }

    // 친구 정보 변환
    const friends: FriendWithDetails[] = data.map((friendship: any) => {
      const isRequester = friendship.requester_id === currentUser.id
      const friend = isRequester ? friendship.addressee : friendship.requester
      
      return {
        ...friend,
        friendship_id: friendship.id,
        friendship_status: friendship.status,
        friendship_created_at: friendship.created_at,
        is_requester: isRequester
      }
    })

    return { success: true, data: friends }
  } catch (error) {
    console.error('getFriends error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// 받은 친구 요청 목록 조회
export const getPendingFriendRequests = async (): Promise<{ success: boolean; data?: FriendRequest[]; error?: string }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        requester:users!friendships_requester_id_fkey(id, name, profile_image, total_distance, total_runs, created_at),
        addressee:users!friendships_addressee_id_fkey(id, name, profile_image, total_distance, total_runs, created_at)
      `)
      .eq('addressee_id', currentUser.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('친구 요청 목록 조회 실패:', error)
      return { success: false, error: '친구 요청 목록을 불러오는데 실패했습니다.' }
    }

    const requests: FriendRequest[] = data.map((friendship: any) => ({
      id: friendship.id,
      requester: friendship.requester,
      addressee: friendship.addressee,
      status: friendship.status,
      created_at: friendship.created_at
    }))

    return { success: true, data: requests }
  } catch (error) {
    console.error('getPendingFriendRequests error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// 사용자 검색 (친구 추가용) - 이름 또는 이메일로 검색
export const searchUsers = async (query: string): Promise<{ success: boolean; data?: User[]; error?: string }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    if (query.trim().length < 2) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, profile_image, total_distance, total_runs, created_at')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .neq('id', currentUser.id) // 자기 자신 제외
      .limit(20)

    if (error) {
      console.error('사용자 검색 실패:', error)
      return { success: false, error: '사용자 검색에 실패했습니다.' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('searchUsers error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// 이메일로 정확한 사용자 찾기
export const findUserByEmail = async (email: string): Promise<{ success: boolean; data?: User; error?: string; friendshipStatus?: string }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, profile_image, total_distance, total_runs, created_at')
      .eq('email', email.trim().toLowerCase())
      .neq('id', currentUser.id)
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        return { success: false, error: '해당 이메일의 사용자를 찾을 수 없습니다.' }
      }
      console.error('사용자 조회 실패:', userError)
      return { success: false, error: '사용자 조회에 실패했습니다.' }
    }

    // 기존 친구 관계 확인
    const { data: friendshipData } = await supabase
      .from('friendships')
      .select('status')
      .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${userData.id}),and(requester_id.eq.${userData.id},addressee_id.eq.${currentUser.id})`)
      .single()

    return { 
      success: true, 
      data: userData, 
      friendshipStatus: friendshipData?.status || null 
    }
  } catch (error) {
    console.error('findUserByEmail error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// 사용자 위치 공유 설정 조회
export const getLocationSettings = async (): Promise<{ success: boolean; data?: UserLocationSettings; error?: string }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const { data, error } = await supabase
      .from('user_location_settings')
      .select('*')
      .eq('user_id', currentUser.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows returned
      console.error('위치 설정 조회 실패:', error)
      return { success: false, error: '위치 설정을 불러오는데 실패했습니다.' }
    }

    // 설정이 없으면 기본값 생성
    if (!data) {
      const { data: newSettings, error: insertError } = await supabase
        .from('user_location_settings')
        .insert({
          user_id: currentUser.id,
          sharing_status: 'disabled',
          share_during_running: false,
          share_with_friends: false,
          location_update_interval: 30
        } as any)
        .select()
        .single()

      if (insertError) {
        console.error('기본 위치 설정 생성 실패:', insertError)
        return { success: false, error: '위치 설정 생성에 실패했습니다.' }
      }

      return { success: true, data: newSettings }
    }

    return { success: true, data }
  } catch (error) {
    console.error('getLocationSettings error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// 사용자 위치 공유 설정 업데이트
export const updateLocationSettings = async (settings: Partial<UserLocationSettings>): Promise<{ success: boolean; data?: UserLocationSettings; error?: string }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const { data, error } = await supabase
      .from('user_location_settings')
      .update(settings as any)
      .eq('user_id', currentUser.id)
      .select()
      .single()

    if (error) {
      console.error('위치 설정 업데이트 실패:', error)
      return { success: false, error: '위치 설정 업데이트에 실패했습니다.' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('updateLocationSettings error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// 현재 위치 공유 (동적 최적화 적용)
export const shareLocation = async (
  latitude: number, 
  longitude: number, 
  options?: {
    accuracy?: number
    speed?: number
    heading?: number
    isRunning?: boolean
    courseId?: string
    runningContext?: RunningContext
  }
): Promise<{ success: boolean; data?: SharedLocation; error?: string; recommendedInterval?: number }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // 위치 공유 설정 확인
    const settingsResult = await getLocationSettings()
    if (!settingsResult.success || !settingsResult.data) {
      return { success: false, error: '위치 공유 설정을 확인할 수 없습니다.' }
    }

    const settings = settingsResult.data

    // 위치 공유가 비활성화된 경우
    if (settings.sharing_status === 'disabled') {
      return { success: false, error: '위치 공유가 비활성화되어 있습니다.' }
    }

    // 런닝 중에만 공유하는 설정인데 런닝 중이 아닌 경우
    if (settings.sharing_status === 'running_only' && !options?.isRunning) {
      return { success: false, error: '런닝 중에만 위치를 공유할 수 있습니다.' }
    }

    // 동적 업데이트 주기 최적화
    const runningContext: RunningContext = {
      speed: options?.speed || 0,
      isRacing: options?.runningContext?.isRacing || false,
      isGroupRun: options?.runningContext?.isGroupRun || false,
      batteryLevel: options?.runningContext?.batteryLevel || 100,
      friendsNearby: options?.runningContext?.friendsNearby || 0,
      networkQuality: options?.runningContext?.networkQuality || 'good'
    }

    const optimalConfig = getOptimalUpdateInterval(runningContext)

    const { data, error } = await supabase
      .from('shared_locations')
      .insert({
        user_id: currentUser.id,
        latitude,
        longitude,
        accuracy: options?.accuracy || null,
        speed: options?.speed || null,
        heading: options?.heading || null,
        is_running: options?.isRunning || false,
        course_id: options?.courseId || null,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1시간 후 만료
      } as any)
      .select()
      .single()

    if (error) {
      console.error('위치 공유 실패:', error)
      return { success: false, error: '위치 공유에 실패했습니다.' }
    }

    return { 
      success: true, 
      data,
      recommendedInterval: optimalConfig.interval
    }
  } catch (error) {
    console.error('shareLocation error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// 친구들의 현재 위치 조회
export const getFriendsLocations = async (userLocation?: { lat: number; lng: number }): Promise<{ success: boolean; data?: FriendLocationData[]; error?: string }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // 친구 목록과 최신 위치 정보 조회
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        requester_id,
        addressee_id,
        requester:users!friendships_requester_id_fkey(id, name, profile_image, total_distance, total_runs, created_at),
        addressee:users!friendships_addressee_id_fkey(id, name, profile_image, total_distance, total_runs, created_at)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)

    if (error) {
      console.error('친구 목록 조회 실패:', error)
      return { success: false, error: '친구 목록을 불러오는데 실패했습니다.' }
    }

    // 친구들의 ID 추출
    const friendIds = data.map((friendship: any) => {
      return friendship.requester_id === currentUser.id 
        ? friendship.addressee_id 
        : friendship.requester_id
    })

    if (friendIds.length === 0) {
      return { success: true, data: [] }
    }

    // 친구들의 최신 위치 정보 조회
    const { data: locations, error: locationError } = await supabase
      .from('shared_locations')
      .select(`
        *,
        user:users(id, name, profile_image, total_distance, total_runs, created_at),
        course:courses(id, name, area, difficulty, distance)
      `)
      .in('user_id', friendIds)
      .gt('expires_at', new Date().toISOString())
      .order('shared_at', { ascending: false })

    if (locationError) {
      console.error('친구 위치 조회 실패:', locationError)
      return { success: false, error: '친구 위치를 불러오는데 실패했습니다.' }
    }

    // 각 친구의 최신 위치만 추출
    const latestLocations = new Map()
    locations?.forEach((location: any) => {
      if (!latestLocations.has(location.user_id)) {
        latestLocations.set(location.user_id, location)
      }
    })

    // 결과 데이터 구성
    const friendLocationData: FriendLocationData[] = Array.from(latestLocations.values()).map((location: any) => {
      let distanceFromUser: number | undefined
      
      if (userLocation) {
        distanceFromUser = calculateDistance(
          userLocation,
          { lat: location.latitude, lng: location.longitude }
        )
      }

      return {
        friend: location.user,
        location: {
          id: location.id,
          user_id: location.user_id,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
          is_running: location.is_running,
          course_id: location.course_id,
          shared_at: location.shared_at,
          expires_at: location.expires_at
        },
        distance_from_user: distanceFromUser,
        is_running: location.is_running,
        course: location.course
      }
    })

    return { success: true, data: friendLocationData }
  } catch (error) {
    console.error('getFriendsLocations error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// QR 코드 토큰 조회 (내 QR 코드 표시용)
export const getMyQRToken = async (): Promise<{ success: boolean; data?: { qr_token: string; expires_at: string; user: User }; error?: string }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, profile_image, total_distance, total_runs, created_at, qr_token, qr_token_expires_at')
      .eq('id', currentUser.id)
      .single()

    if (error) {
      console.error('QR 토큰 조회 실패:', error)
      return { success: false, error: 'QR 코드 정보를 불러오는데 실패했습니다.' }
    }

    // QR 토큰이 만료되었으면 새로 생성
    if (!data.qr_token || new Date(data.qr_token_expires_at) <= new Date()) {
      const refreshResult = await refreshQRToken()
      if (!refreshResult.success) {
        return { success: false, error: refreshResult.error }
      }
      return refreshResult
    }

    return {
      success: true,
      data: {
        qr_token: data.qr_token,
        expires_at: data.qr_token_expires_at,
        user: {
          id: data.id,
          name: data.name,
          email: data.email,
          profile_image: data.profile_image,
          total_distance: data.total_distance,
          total_runs: data.total_runs,
          created_at: data.created_at
        }
      }
    }
  } catch (error) {
    console.error('getMyQRToken error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// QR 코드 토큰 갱신
export const refreshQRToken = async (): Promise<{ success: boolean; data?: { qr_token: string; expires_at: string; user: User }; error?: string }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        qr_token: `${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`,
        qr_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간 후
      } as any)
      .eq('id', currentUser.id)
      .select('id, name, email, profile_image, total_distance, total_runs, created_at, qr_token, qr_token_expires_at')
      .single()

    if (error) {
      console.error('QR 토큰 갱신 실패:', error)
      return { success: false, error: 'QR 코드 갱신에 실패했습니다.' }
    }

    return {
      success: true,
      data: {
        qr_token: data.qr_token,
        expires_at: data.qr_token_expires_at,
        user: {
          id: data.id,
          name: data.name,
          email: data.email,
          profile_image: data.profile_image,
          total_distance: data.total_distance,
          total_runs: data.total_runs,
          created_at: data.created_at
        }
      }
    }
  } catch (error) {
    console.error('refreshQRToken error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// QR 코드로 사용자 찾기
export const findUserByQRToken = async (qrToken: string): Promise<{ success: boolean; data?: User; error?: string; friendshipStatus?: string }> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, profile_image, total_distance, total_runs, created_at, qr_token_expires_at')
      .eq('qr_token', qrToken)
      .neq('id', currentUser.id)
      .gt('qr_token_expires_at', new Date().toISOString()) // 만료되지 않은 토큰만
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        return { success: false, error: '유효하지 않거나 만료된 QR 코드입니다.' }
      }
      console.error('QR 사용자 조회 실패:', userError)
      return { success: false, error: 'QR 코드 인식에 실패했습니다.' }
    }

    // 기존 친구 관계 확인
    const { data: friendshipData } = await supabase
      .from('friendships')
      .select('status')
      .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${userData.id}),and(requester_id.eq.${userData.id},addressee_id.eq.${currentUser.id})`)
      .single()

    return { 
      success: true, 
      data: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        profile_image: userData.profile_image,
        total_distance: userData.total_distance,
        total_runs: userData.total_runs,
        created_at: userData.created_at
      }, 
      friendshipStatus: friendshipData?.status || null 
    }
  } catch (error) {
    console.error('findUserByQRToken error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// QR 코드로 즉시 친구 추가 (pending 없이 바로 accepted)
export const addFriendByQR = async (qrToken: string): Promise<{ success: boolean; data?: Friendship; error?: string }> => {
  try {
    const userResult = await findUserByQRToken(qrToken)
    if (!userResult.success || !userResult.data) {
      return { success: false, error: userResult.error }
    }

    if (userResult.friendshipStatus) {
      return { success: false, error: '이미 친구 관계가 존재합니다.' }
    }

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // QR 코드는 즉시 친구 추가 (accepted 상태)
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: currentUser.id,
        addressee_id: userResult.data.id,
        status: 'accepted'
      } as any)
      .select()
      .single()

    if (error) {
      console.error('QR 친구 추가 실패:', error)
      return { success: false, error: '친구 추가에 실패했습니다.' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('addFriendByQR error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}

// 만료된 위치 데이터 정리 (백그라운드 작업용)
export const cleanupExpiredLocations = async (): Promise<{ success: boolean; deletedCount?: number; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('shared_locations')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('만료된 위치 데이터 정리 실패:', error)
      return { success: false, error: '위치 데이터 정리에 실패했습니다.' }
    }

    return { success: true, deletedCount: (data as any)?.length || 0 }
  } catch (error) {
    console.error('cleanupExpiredLocations error:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다.' }
  }
}
