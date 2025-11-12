import { supabase } from './supabase'

// 거리 정보가 포함된 스팟 타입
export interface SpotWithDistance {
  id: string
  name: string
  category: string
  description: string
  signature_menu: string
  address: string
  latitude: number
  longitude: number
  phone: string | null
  open_time: string | null
  discount_percentage: number | null
  special_offer: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  logo_url: string | null
  images: string[] | null
  thumbnail_image: string | null
  distance: number
}

// 거리 계산 함수 (Haversine 공식)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 모든 스팟 조회 (카테고리별 필터링)
export async function getSpots(category?: string) {
  try {
    let query = supabase
      .from('spots')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('스팟 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('스팟 조회 실패:', error)
    return []
  }
}

// 위치 기반 주변 스팟 조회
export async function getNearbySpots(
  userLat: number, 
  userLng: number, 
  radiusKm: number = 10,
  category?: string
) {
  try {
    const spots = await getSpots(category)
    
    // 거리 계산하여 필터링 및 정렬
    const nearbySpots = spots
      .map((spot: any) => ({
        ...spot,
        distance: calculateDistance(userLat, userLng, spot.latitude, spot.longitude)
      }))
      .filter((spot: any) => spot.distance <= radiusKm)
      .sort((a: any, b: any) => a.distance - b.distance)

    return nearbySpots
  } catch (error) {
    console.error('주변 스팟 조회 실패:', error)
    return []
  }
}

// 사용자의 활성 쿠폰 조회
export async function getUserActiveCoupons(userId: string) {
  try {
    const { data, error } = await supabase
      .from('active_spot_coupons') // 뷰 사용
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('활성 쿠폰 조회 오류:', error)
      return {}
    }

    // spotId를 키로 하는 객체로 변환
    const couponsMap: {[spotId: string]: any} = {}
    data?.forEach((coupon: any) => {
      couponsMap[coupon.spot_id] = {
        ...coupon,
        // 뷰에서 가져온 스팟 정보를 정리
        spots: {
          name: coupon.spot_name,
          category: coupon.spot_category,
          signature_menu: coupon.spot_signature_menu,
          address: coupon.spot_address
        }
      }
    })

    return couponsMap
  } catch (error) {
    console.error('활성 쿠폰 조회 실패:', error)
    return {}
  }
}

// 특정 스팟의 활성 쿠폰 조회
export async function getSpotActiveCoupon(userId: string, spotId: string) {
  try {
    const { data, error } = await supabase
      .from('spot_coupons')
      .select('*')
      .eq('user_id', userId)
      .eq('spot_id', spotId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('스팟 쿠폰 조회 오류:', error)
      return null
    }

    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('스팟 쿠폰 조회 실패:', error)
    return null
  }
}

// 새 쿠폰 생성
export async function createSpotCoupon(
  userId: string,
  spotId: string,
  runningCompletedAt: Date,
  authLat: number,
  authLng: number
) {
  try {
    // 스팟 정보 조회
    const { data: spotData, error: spotError } = await supabase
      .from('spots')
      .select('*')
      .eq('id', spotId)

    if (spotError || !spotData || spotData.length === 0) {
      throw new Error('스팟을 찾을 수 없습니다')
    }

    const spot = spotData[0]

    // 쿠폰 코드 생성
    const couponCode = `COUPON_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 할인 정보
    const discountInfo = (spot as any).special_offer || `${(spot as any).discount_percentage}% 할인`
    
    // 만료 시간 (2시간 후)
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)

    // 기존 활성 쿠폰이 있다면 비활성화
    await (supabase as any)
      .from('spot_coupons')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('spot_id', spotId)
      .eq('is_active', true)

    // 새 쿠폰 생성
    const { data, error } = await (supabase as any)
      .from('spot_coupons')
      .insert({
        user_id: userId,
        spot_id: spotId,
        coupon_code: couponCode,
        discount_info: discountInfo,
        expires_at: expiresAt.toISOString(),
        running_completed_at: runningCompletedAt.toISOString(),
        auth_location_lat: authLat,
        auth_location_lng: authLng
      })
      .select()

    if (error || !data || data.length === 0) {
      console.error('쿠폰 생성 오류:', error)
      throw new Error('쿠폰 생성에 실패했습니다')
    }

    // 스팟 사용 통계 업데이트
    await (supabase as any)
      .from('spots')
      .update({ 
        usage_count: ((spot as any).usage_count || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', spotId)

    return data[0]
  } catch (error) {
    console.error('쿠폰 생성 실패:', error)
    throw error
  }
}

// 쿠폰 사용 처리
export async function useCoupon(couponId: string) {
  try {
    // 쿠폰을 이력으로 이동
    const { data: couponData, error: fetchError } = await supabase
      .from('spot_coupons')
      .select('*')
      .eq('id', couponId)

    if (fetchError || !couponData || couponData.length === 0) {
      throw new Error('쿠폰을 찾을 수 없습니다')
    }

    const coupon = couponData[0] as any

    // 이력에 추가 (사용됨으로 표시)
    const { error: historyError } = await (supabase as any)
      .from('spot_coupon_history')
      .insert({
        user_id: coupon.user_id,
        spot_id: coupon.spot_id,
        coupon_id: coupon.id,
        coupon_code: coupon.coupon_code,
        discount_info: coupon.discount_info,
        issued_at: coupon.issued_at || coupon.created_at,
        expired_at: coupon.expires_at,
        used_at: new Date().toISOString(),
        running_completed_at: coupon.running_completed_at,
        auth_location_lat: coupon.auth_location_lat,
        auth_location_lng: coupon.auth_location_lng,
        status: 'used'
      })

    if (historyError) {
      console.error('쿠폰 이력 생성 오류:', historyError)
    }

    // 원본 쿠폰 비활성화 및 사용 시간 기록
    const { error: updateError } = await (supabase as any)
      .from('spot_coupons')
      .update({ 
        is_active: false,
        used_at: new Date().toISOString()
      })
      .eq('id', couponId)

    if (updateError) {
      console.error('쿠폰 비활성화 오류:', updateError)
      throw new Error('쿠폰 사용 처리에 실패했습니다')
    }

    return true
  } catch (error) {
    console.error('쿠폰 사용 실패:', error)
    throw error
  }
}

// 만료된 쿠폰 정리 (수동 구현)
export async function cleanupExpiredCoupons() {
  try {
    // 1. 만료된 활성 쿠폰 조회
    const { data: expiredCoupons, error: fetchError } = await supabase
      .from('spot_coupons')
      .select('*')
      .eq('is_active', true)
      .lt('expires_at', new Date().toISOString())

    if (fetchError) {
      console.error('만료 쿠폰 조회 오류:', fetchError)
      return
    }

    if (!expiredCoupons || expiredCoupons.length === 0) {
      return // 만료된 쿠폰이 없음
    }

    // 2. 만료된 쿠폰들을 이력 테이블로 이동
    const historyRecords = expiredCoupons.map((coupon: any) => ({
      user_id: coupon.user_id,
      spot_id: coupon.spot_id,
      coupon_id: coupon.id,
      coupon_code: coupon.coupon_code,
      discount_info: coupon.discount_info,
      issued_at: coupon.issued_at || coupon.created_at,
      expired_at: coupon.expires_at,
      used_at: null, // 사용되지 않고 만료됨
      running_completed_at: coupon.running_completed_at,
      auth_location_lat: coupon.auth_location_lat,
      auth_location_lng: coupon.auth_location_lng,
      status: 'expired'
    }))

    const { error: historyError } = await (supabase as any)
      .from('spot_coupon_history')
      .insert(historyRecords)

    if (historyError) {
      console.error('쿠폰 이력 생성 오류:', historyError)
      return
    }

    // 3. 원본 쿠폰들을 비활성화
    const expiredCouponIds = expiredCoupons.map((c: any) => c.id)
    const { error: updateError } = await (supabase as any)
      .from('spot_coupons')
      .update({ is_active: false })
      .in('id', expiredCouponIds)

    if (updateError) {
      console.error('쿠폰 비활성화 오류:', updateError)
    }

    console.log(`${expiredCoupons.length}개의 만료된 쿠폰을 이력으로 이동했습니다.`)
  } catch (error) {
    console.error('만료 쿠폰 정리 실패:', error)
  }
}

// 사용자의 쿠폰 이력 조회 (활성 쿠폰 + 히스토리)
export async function getUserCouponHistory(userId: string, limit: number = 50) {
  try {
    console.log('쿠폰 이력 조회 시작 - userId:', userId)
    
    // 1. 활성 쿠폰 조회 (뷰 사용)
    const { data: activeCoupons, error: activeError } = await supabase
      .from('active_spot_coupons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    console.log('활성 쿠폰:', activeCoupons, 'error:', activeError)

    // 2. 히스토리 조회 (사용됨/만료됨)
    const { data: historyData, error: historyError } = await supabase
      .from('spot_coupon_history')
      .select(`
        *,
        spots (
          name,
          category,
          signature_menu
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    console.log('히스토리 데이터:', historyData, 'error:', historyError)

    // 3. 데이터 통합 및 정규화
    const allRecords = []

    // 활성 쿠폰을 히스토리 형태로 변환
    if (activeCoupons) {
      activeCoupons.forEach((coupon: any) => {
        const now = new Date()
        const expiryDate = new Date(coupon.expires_at)
        const isExpired = now > expiryDate

        allRecords.push({
          id: coupon.id,
          user_id: coupon.user_id,
          spot_id: coupon.spot_id,
          coupon_id: coupon.id,
          coupon_code: coupon.coupon_code,
          discount_info: coupon.discount_info,
          issued_at: coupon.issued_at || coupon.created_at,
          expired_at: coupon.expires_at,
          used_at: coupon.used_at,
          running_completed_at: coupon.running_completed_at,
          auth_location_lat: coupon.auth_location_lat,
          auth_location_lng: coupon.auth_location_lng,
          status: coupon.used_at ? 'used' : (isExpired ? 'expired' : 'active'),
          created_at: coupon.created_at,
          spots: {
            name: coupon.spot_name,
            category: coupon.spot_category,
            signature_menu: coupon.spot_signature_menu
          }
        })
      })
    }

    // 히스토리 데이터 추가
    if (historyData) {
      allRecords.push(...historyData)
    }

    // 생성일시 기준으로 정렬하고 제한
    const sortedRecords = allRecords
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)

    console.log('통합된 쿠폰 이력:', sortedRecords)
    return sortedRecords

  } catch (error) {
    console.error('쿠폰 이력 조회 실패:', error)
    return []
  }
}
