'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Clock, Phone, Navigation, X, CheckCircle, AlertCircle, Heart, ChevronLeft, ChevronRight, Coffee, Utensils, ShoppingBag, Dumbbell, Wrench, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getSpots, getNearbySpots, getUserActiveCoupons, getSpotActiveCoupon, createSpotCoupon, cleanupExpiredCoupons, getUserCouponHistory, type SpotWithDistance } from '@/lib/spots'
import type { Spot } from '@/types/database'
import { getGuestUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// 이미지 슬라이더 컴포넌트
function ImageSlider({ images, spotName }: { images: string[], spotName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (!images || images.length === 0) return null

  return (
    <div className="relative w-full h-48 bg-muted rounded-xl overflow-hidden">
      <img
        src={images[currentIndex]}
        alt={`${spotName} 전경 ${currentIndex + 1}`}
        className="w-full h-full object-cover"
      />
      
      {images.length > 1 && (
        <>
          {/* 이전 버튼 */}
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          
          {/* 다음 버튼 */}
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
          
          {/* 인디케이터 */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function SpotsPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(true)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)
  const [couponData, setCouponData] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeCoupons, setActiveCoupons] = useState<{[spotId: string]: any}>({}) // 활성 쿠폰들 (spotId별로 관리)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailSpot, setDetailSpot] = useState<Spot | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [couponHistory, setCouponHistory] = useState<any[]>([])
  const [spotsWithDistance, setSpotsWithDistance] = useState<SpotWithDistance[]>([])

  // 카테고리 필터
  const categories = [
    { id: 'all', name: '전체', icon: '🏪' },
    { id: 'cafe', name: '카페', icon: '☕' },
    { id: 'restaurant', name: '음식점', icon: '🍽️' },
    { id: 'shop', name: '상점', icon: '🛍️' },
    { id: 'fitness', name: '피트니스', icon: '💪' }
  ]

  useEffect(() => {
    // 사용자 ID 설정
    setUserId(getGuestUserId())
    loadSpots()
    getCurrentLocation()
  }, [selectedCategory])

  useEffect(() => {
    if (userId) {
      loadActiveCoupons()
      loadCouponHistory()
    }
  }, [userId])

  // 스팟 로드 후 활성 쿠폰도 다시 로드
  useEffect(() => {
    if (userId && spots.length > 0) {
      loadActiveCoupons()
    }
  }, [spots, userId])

  // 실시간 시간 업데이트 및 만료된 쿠폰 정리
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      cleanExpiredCoupons() // 만료된 쿠폰 정리
    }, 1000) // 1초마다 업데이트

    return () => clearInterval(timer)
  }, [activeCoupons])

  // 거리 계산 함수 (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
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

  // 스팟에 거리 정보 추가
  const addDistanceToSpots = (spots: Spot[]): SpotWithDistance[] => {
    if (!userLocation) {
      return spots.map(spot => ({ ...spot, distance: null }))
    }
    
    return spots.map(spot => ({
      ...spot,
      distance: spot.latitude && spot.longitude 
        ? calculateDistance(userLocation.lat, userLocation.lng, spot.latitude, spot.longitude)
        : null
    })).sort((a, b) => {
      // 거리순으로 정렬 (거리 정보가 없는 것은 마지막에)
      if (a.distance === null && b.distance === null) return 0
      if (a.distance === null) return 1
      if (b.distance === null) return -1
      return a.distance - b.distance
    })
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(newLocation)
          
          // 위치 업데이트 후 스팟에 거리 정보 추가
          if (spots.length > 0) {
            const spotsWithDist = addDistanceToSpots(spots)
            setSpotsWithDistance(spotsWithDist)
          }
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error)
        }
      )
    }
  }

  const loadSpots = async () => {
    setLoading(true)
    try {
      let spotsData
      if (selectedCategory === 'all') {
        // 전체 선택 시 위치와 관계없이 모든 스팟 조회
        spotsData = await getSpots()
      } else if (userLocation) {
        // 특정 카테고리 + 위치가 있으면 주변 스팟 조회
        spotsData = await getNearbySpots(
          userLocation.lat, 
          userLocation.lng, 
          3, // 3km 반경
          selectedCategory
        )
      } else {
        // 특정 카테고리 + 위치 없으면 전체 스팟에서 카테고리 필터링
        spotsData = await getSpots(selectedCategory)
      }
      
      console.log('로딩된 스팟 데이터:', spotsData)
      console.log('선택된 카테고리:', selectedCategory)
      setSpots(spotsData as any)
      
      // 거리 정보 추가
      const spotsWithDist = addDistanceToSpots(spotsData as Spot[])
      setSpotsWithDistance(spotsWithDist)
    } catch (error) {
      console.error('스팟 로딩 오류:', error)
      setSpots([])
    } finally {
      setLoading(false)
    }
  }

  const loadActiveCoupons = async () => {
    if (!userId) return
    
    try {
      const coupons = await getUserActiveCoupons(userId)
      console.log('로드된 활성 쿠폰들:', coupons) // 디버깅용
      
      // 각 쿠폰을 정규화하여 저장
      const normalizedCoupons: {[spotId: string]: any} = {}
      Object.keys(coupons).forEach(spotId => {
        const coupon = coupons[spotId]
        if (coupon) {
          const expiryDate = coupon.expires_at
          const now = currentTime
          if (expiryDate && now >= new Date(expiryDate)) {
            console.log(`스팟 ${spotId} 쿠폰 만료됨, 제거합니다`)
          } else {
            normalizedCoupons[spotId] = {
              ...coupon,
              expiresAt: new Date(coupon.expires_at),
              issuedAt: new Date(coupon.issued_at || coupon.created_at),
              discount: coupon.discount_info
            }
          }
        }
      })
      
      setActiveCoupons(normalizedCoupons)
    } catch (error) {
      console.error('활성 쿠폰 로딩 오류:', error)
    }
  }

  const loadCouponHistory = async () => {
    if (!userId) return
    
    try {
      const history = await getUserCouponHistory(userId, 10) // 최근 10개
      setCouponHistory(history)
    } catch (error) {
      console.error('쿠폰 이력 로딩 오류:', error)
    }
  }


  // 완주 인증 확인 (테스트용 - 항상 성공)
  const checkRunCompletion = (spot: any) => {
    // 테스트용: 항상 완주 성공으로 처리
    return { 
      isValid: true, 
      completedAt: new Date(Date.now() - 10 * 60 * 1000) // 10분 전 완주했다고 가정
    }

    /* 실제 로직 (테스트 후 복원)
    if (!userLocation) {
      alert('위치 정보를 확인할 수 없습니다.')
      return { isValid: false }
    }

    // 샘플 완주 코스 위치 (여의도 기준)
    const sampleCompletedRuns = [
      { lat: 37.5285, lng: 126.9367, completedAt: new Date(Date.now() - 30 * 60 * 1000) }, // 30분 전 완주
    ]

    // 스팟 위치 파싱 (실제로는 DB에서 가져올 좌표)
    const spotCoords = getSpotCoordinates(spot.address)
    
    // 5km 반경 내 완주 기록 확인
    for (const run of sampleCompletedRuns) {
      const distanceToSpot = calculateDistance(run.lat, run.lng, spotCoords.lat, spotCoords.lng)
      if (distanceToSpot <= 5) {
        return { isValid: true, completedAt: run.completedAt }
      }
    }

    return { isValid: false }
    */
  }

  // 스팟 주소를 좌표로 변환 (샘플)
  const getSpotCoordinates = (address: string) => {
    // 실제로는 지오코딩 API 사용
    const sampleCoords: { [key: string]: { lat: number, lng: number } } = {
      '서울시 강남구 테헤란로 123': { lat: 37.5665, lng: 126.9780 },
      '서울시 송파구 올림픽로 456': { lat: 37.5145, lng: 127.1066 },
      '서울시 마포구 홍대입구역 789': { lat: 37.5563, lng: 126.9236 },
      '서울시 용산구 이태원로 321': { lat: 37.5347, lng: 126.9947 }
    }
    return sampleCoords[address] || { lat: 37.5665, lng: 126.9780 }
  }

  // 쿠폰 생성
  const generateCoupon = (spot: any, completedAt: Date) => {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2시간 후 만료
    
    return {
      id: `COUPON_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 고유 ID 생성
      spotName: spot.name,
      discount: spot.discount,
      issuedAt: now,
      expiresAt: expiresAt,
      completedAt: completedAt,
      isValid: true
    }
  }

  // 활성 쿠폰 저장
  const saveActiveCoupon = (spotId: string, coupon: any) => {
    setActiveCoupons(prev => ({
      ...prev,
      [spotId]: coupon
    }))
    // 로컬스토리지에도 저장
    localStorage.setItem('runspot_active_coupons', JSON.stringify({
      ...activeCoupons,
      [spotId]: coupon
    }))
  }

  // 활성 쿠폰 확인
  const getActiveCoupon = (spotId: string) => {
    return activeCoupons[spotId]
  }

  // 만료된 쿠폰 정리
  const cleanExpiredCoupons = () => {
    const now = new Date()
    const validCoupons: {[key: string]: any} = {}
    
    Object.entries(activeCoupons).forEach(([spotId, coupon]) => {
      if (coupon && now < new Date(coupon.expiresAt)) {
        validCoupons[spotId] = coupon
      }
    })
    
    setActiveCoupons(validCoupons)
    localStorage.setItem('runspot_active_coupons', JSON.stringify(validCoupons))
  }

  // 뛰어가기 버튼 클릭 (카카오맵 길찾기)
  const handleRunToSpot = (spot: Spot | SpotWithDistance) => {
    if (!spot.latitude || !spot.longitude) {
      alert('스팟의 위치 정보가 없습니다.')
      return
    }
    
    // 카카오맵 길찾기 URL 생성
    const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(spot.name)},${spot.latitude},${spot.longitude}`
    
    // 새 창에서 카카오맵 열기
    window.open(kakaoMapUrl, '_blank')
  }

  // 혜택 받기 버튼 클릭
  const handleGetBenefit = async (spot: any) => {
    if (!userId) {
      alert('사용자 정보를 확인할 수 없습니다.')
      return
    }

    try {
      // 기존 활성 쿠폰이 있는지 확인
      const existingCoupon = await getSpotActiveCoupon(userId, spot.id)
      
      if (existingCoupon && (existingCoupon as any).expires_at && currentTime < new Date((existingCoupon as any).expires_at)) {
        // 기존 쿠폰이 아직 유효하면 그것을 다시 표시
        setSelectedSpot(spot)
        setCouponData(existingCoupon)
        setShowCouponModal(true)
        return
      }

      // 인증 가능한 완주 기록 확인
      const { data: validRunningLog, error: runningLogError } = await (supabase as any)
        .from('running_logs')
        .select('*')
        .eq('user_id', userId)
        .not('expires_at', 'is', null)
        .gt('expires_at', new Date().toISOString()) // 아직 만료되지 않은 것
        .lt('authentication_count', 2) // 아직 2곳에서 인증하지 않은 것
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      if (runningLogError || !validRunningLog) {
        // 인증 가능한 완주 기록이 없는 경우
        alert('🏃‍♂️ 런닝을 먼저 완주해주세요!\n\n제휴 스팟 인증을 위해서는:\n• 최근 2시간 내 코스 완주 필요\n• 완주당 최대 2곳에서 인증 가능\n\n런닝 페이지에서 코스를 선택해 달려보세요!')
        return
      }

      // 새 쿠폰 생성 (running_log_id 전달)
      const newCoupon = await createSpotCoupon(
        userId,
        spot.id,
        validRunningLog.id, // running_log_id 전달
        userLocation?.lat || 37.5665,
        userLocation?.lng || 126.9780
      )

      // authentication_count는 createSpotCoupon 내부에서 자동 증가됨

      // 필드명 통일을 위한 정규화
      const couponData = newCoupon as any
      const normalizedNewCoupon = {
        ...couponData,
        expiresAt: new Date(couponData.expires_at),
        issuedAt: new Date(couponData.issued_at),
        discount: couponData.discount_info
      }

      // 활성 쿠폰 목록 업데이트 (즉시 반영)
      setActiveCoupons(prev => ({
        ...prev,
        [spot.id]: normalizedNewCoupon
      }))

      // 쿠폰 이력도 즉시 새로고침
      await loadCouponHistory()

      setSelectedSpot(spot)
      setCouponData(normalizedNewCoupon)
      setShowCouponModal(true)

      // 상태 강제 업데이트를 위한 리렌더링
      setTimeout(() => {
        setActiveCoupons(prev => ({
          ...prev,
          [spot.id]: normalizedNewCoupon
        }))
      }, 100)
    } catch (error) {
      console.error('인증 처리 오류:', error)
      alert('인증 처리 중 오류가 발생했습니다.')
    }
  }

  // 쿠폰 유효성 확인
  const isCouponValid = (coupon: any) => {
    if (!coupon) return false
    const expiryDate = coupon.expiresAt || coupon.expires_at
    if (!expiryDate) return false
    return new Date() < new Date(expiryDate)
  }

  // 남은 시간 계산 (실시간)
  const getRemainingTime = (expiresAt: Date) => {
    const remaining = new Date(expiresAt).getTime() - currentTime.getTime()
    
    if (remaining <= 0) return '만료됨'
    
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
    
    return `${hours}시간 ${minutes}분 ${seconds}초`
  }

  // 쿠폰 유효성 확인 (실시간)
  const isCouponValidRealtime = (coupon: any) => {
    if (!coupon) return false
    const expiryDate = coupon.expiresAt || coupon.expires_at
    if (!expiryDate) return false
    
    const expiry = new Date(expiryDate)
    const now = currentTime
    const isValid = now < expiry
    
    console.log(`쿠폰 유효성 상세:`, {
      현재시간: now.toISOString(),
      만료시간: expiry.toISOString(),
      유효함: isValid
    })
    
    return isValid
  }

  // 스팟의 인증 상태 확인
  const getSpotAuthStatus = (spotId: string) => {
    const activeCoupon = activeCoupons[spotId]
    console.log(`스팟 ${spotId} 인증 상태 확인:`, activeCoupon) // 디버깅용
    
    if (!activeCoupon) return 'none' // 인증 없음
    
    const isValid = isCouponValidRealtime(activeCoupon)
    console.log(`스팟 ${spotId} 쿠폰 유효성:`, isValid) // 디버깅용
    return isValid ? 'active' : 'expired' // 활성 또는 만료
  }

  // 버튼 텍스트 가져오기
  const getButtonText = (spotId: string) => {
    const status = getSpotAuthStatus(spotId)
    return status === 'active' ? '인증 완료' : '인증하기'
  }


  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cafe': return <Coffee className="w-4 h-4" />
      case 'restaurant': return <Utensils className="w-4 h-4" />
      case 'shop': return <ShoppingBag className="w-4 h-4" />
      case 'fitness': return <Heart className="w-4 h-4" />
      default: return <MapPin className="w-4 h-4" />
    }
  }

  // 운영시간을 한글로 변환
  const formatOperatingTime = (timeString: string | null | undefined) => {
    if (!timeString) return '운영시간 미정'
    
    // ' - ' 또는 '-'로 분리 시도
    const parts = timeString.includes(' - ') ? timeString.split(' - ') : timeString.split('-')
    if (parts.length !== 2) return timeString // 형식이 맞지 않으면 원본 반환
    
    const [startTime, endTime] = parts.map(t => t.trim())
    
    const formatTime = (time: string) => {
      if (!time || !time.includes(':')) return time
      
      const [hour, minute] = time.split(':')
      const hourNum = parseInt(hour)
      
      if (isNaN(hourNum)) return time
      
      if (hourNum === 0) return '자정'
      if (hourNum === 12) return '정오'
      if (hourNum < 12) return `오전 ${hourNum}시`
      if (hourNum === 24) return '자정'
      return `저녁 ${hourNum - 12}시`
    }
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 상단 헤더 - 모바일 알림창 피하기 */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">제휴 스팟</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 헤더 섹션 */}
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏪</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">런 - 스팟</h2>
          <p className="text-muted-foreground">러너들을 위한 혜택을 제공하는 파트너 매장들</p>
        </div>


        {/* 카테고리 필터 */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-card text-black font-medium'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* 스팟 목록 */}
        <div>
          <p className="text-muted-foreground text-sm mb-4">
            {loading ? '로딩 중...' : `${spots.length}개의 제휴 스팟`}
          </p>

          {loading ? (
            // 로딩 스켈레톤
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-card/80 glass rounded-2xl p-4 border border-border animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-muted/80 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted/80 rounded mb-2"></div>
                      <div className="h-3 bg-muted/80 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted/80 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : spotsWithDistance.length > 0 ? (
            <div className="space-y-3">
              {spotsWithDistance.map((spot, index) => (
                <div 
                  key={spot.id}
                  onClick={() => {
                    setDetailSpot(spot)
                    setShowDetailModal(true)
                  }}
                  className="bg-card/80 glass rounded-2xl p-4 border border-border hover:border-gray-700 transition-all duration-300 animate-fade-in-up cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {/* 로고 */}
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                      {(spot as any).logo_url ? (
                        <img 
                          src={(spot as any).logo_url} 
                          alt={`${spot.name} 로고`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getCategoryIcon(spot.category)
                      )}
                    </div>
                    
                    {/* 스팟 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground">{spot.name}</h3>
                        {spot.distance !== null ? (
                          <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span className="text-sm font-medium text-primary">
                              {spot.distance.toFixed(1)}km
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">거리 정보 없음</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-foreground">{spot.signature_menu}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRunToSpot(spot)
                          }}
                          className="flex items-center justify-center gap-1 bg-muted/80 hover:bg-muted/70 text-foreground hover:text-foreground py-1 px-2 rounded-lg transition-colors text-xs ml-auto"
                        >
                          <Play className="w-3 h-3" />
                          뛰어가기
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap break-words">{spot.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="bg-card/10 border border-gray-900/20 rounded-lg px-3 py-1">
                      <p className="text-muted-foreground text-sm font-medium">
                        🎁 완주시 {spot.special_offer || `${spot.discount_percentage}% 할인`}
                      </p>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleGetBenefit(spot)
                      }}
                      className={`font-medium py-2 px-4 rounded-xl transition-colors text-sm ${
                        getSpotAuthStatus(spot.id) === 'active'
                          ? 'bg-green-100 text-green-800 cursor-default border border-green-200'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      }`}
                    >
                      {getButtonText(spot.id)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 빈 상태
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-foreground/70 mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">해당 카테고리의 제휴 스팟이 없습니다</p>
              <p className="text-sm text-foreground/60">다른 카테고리를 확인해보세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-20"></div>

      {/* 쿠폰 모달 */}
      {showCouponModal && couponData && selectedSpot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl p-6 max-w-sm w-full border border-border relative overflow-hidden">
            {/* 배경 패턴 */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 to-transparent"></div>
            </div>
            
            {/* 닫기 버튼 */}
            <button 
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-xl transition-colors z-50"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="relative z-10">
              {isCouponValidRealtime(couponData) ? (
                <>
                  {/* 성공 아이콘 */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <CheckCircle className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">인증 완료!</h3>
                    <p className="text-muted-foreground text-sm">완주 인증이 성공적으로 완료되었습니다</p>
                  </div>

                  {/* 쿠폰 정보 */}
                  <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-2xl p-4 mb-4">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-foreground mb-1">{selectedSpot.name}</h4>
                      <p className="text-primary font-medium text-lg mb-3">{couponData.discount}</p>
                      
                      {/* 유효시간 강조 */}
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground">발급일시</p>
                          <p className="text-xs text-foreground">
                            {couponData.issuedAt.toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs text-muted-foreground">만료시간</p>
                          <p className="text-xs text-foreground">
                            {couponData.expiresAt.toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">유효시간</p>
                          <p className="text-primary font-bold text-xl">
                            {getRemainingTime(couponData.expiresAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* 사용 안내 */}
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground text-center">
                      매장에서 이 화면을 보여주세요<br/>
                      2시간 후 자동으로 만료됩니다<br/>
                      <span className="text-foreground/60">스크린샷은 인정되지 않습니다</span>
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 하단 여백 */}
      <div className="h-20"></div>

      {/* 스팟 상세 모달 */}
      {showDetailModal && detailSpot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl p-6 max-w-md w-full border border-border relative max-h-[80vh] overflow-y-auto scrollbar-hide">
            {/* 닫기 버튼 */}
            <button 
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-xl transition-colors z-10"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="text-center">
              {/* 헤더 */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 text-2xl overflow-hidden">
                  {(detailSpot as any).logo_url ? (
                    <img 
                      src={(detailSpot as any).logo_url} 
                      alt={`${detailSpot.name} 로고`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getCategoryIcon(detailSpot.category)
                  )}
                </div>
                <h2 className="text-xl font-bold text-foreground mb-1">{detailSpot.name}</h2>
                <p className="text-muted-foreground">{detailSpot.signature_menu}</p>
              </div>

              {/* 전경사진 슬라이더 */}
              {(detailSpot as any).images && (detailSpot as any).images.length > 0 && (
                <div className="mb-6">
                  <ImageSlider images={(detailSpot as any).images} spotName={detailSpot.name} />
                </div>
              )}

              {/* 기본 정보 */}
              <div className="space-y-4 mb-6 text-left">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">소개</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap break-words">{detailSpot.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">위치 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{detailSpot.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Navigation className="w-4 h-4" />
                      <span>{(detailSpot as any).distance || '0'}km 거리</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">운영 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatOperatingTime(detailSpot.open_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{detailSpot.phone || '전화번호 미등록'}</span>
                    </div>
                  </div>
                </div>

                {/* 혜택 정보 */}
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <h3 className="text-primary font-medium mb-2">🎁 런스팟 혜택</h3>
                  <p className="text-foreground">
                    완주시 {detailSpot.special_offer || `${detailSpot.discount_percentage}% 할인`}
                  </p>
                </div>
              </div>

              {/* 액션 버튼 */}
              <button 
                onClick={() => {
                  setShowDetailModal(false)
                  handleGetBenefit(detailSpot)
                }}
                className={`w-full font-bold py-3 px-4 rounded-xl transition-colors ${
                  getSpotAuthStatus(detailSpot.id) === 'active'
                    ? 'bg-green-100 text-green-800 cursor-default border border-green-200'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {getSpotAuthStatus(detailSpot.id) === 'active' ? '인증 완료' : '완주 인증하기'}
              </button>
            </div>
          </div>
        </div>
      )}

{/* 쿠폰 모달 */}
{showCouponModal && couponData && selectedSpot && (
<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="bg-card rounded-3xl p-6 max-w-sm w-full border border-border relative overflow-hidden">
    {/* 배경 패턴 */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary to-transparent"></div>
    </div>
    
    {/* 닫기 버튼 */}
    <button 
      onClick={() => {
        setShowCouponModal(false)
        // 모달 닫을 때 활성 쿠폰 상태 새로고침
        if (selectedSpot && couponData) {
          setActiveCoupons(prev => ({
            ...prev,
            [selectedSpot.id]: couponData
          }))
        }
      }}
      className="absolute top-4 right-4 p-2 hover:bg-muted rounded-xl transition-colors z-50"
    >
      <X className="w-5 h-5 text-muted-foreground" />
    </button>

    <div className="relative z-10">
      {isCouponValidRealtime(couponData) ? (
        <>
          {/* 성공 아이콘 */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CheckCircle className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">인증 완료!</h3>
            <p className="text-muted-foreground text-sm">완주 인증이 성공적으로 완료되었습니다</p>
          </div>

          {/* 쿠폰 정보 */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-2xl p-4 mb-4">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-foreground mb-1">{selectedSpot.name}</h4>
              <p className="text-primary font-medium text-lg mb-3">{couponData.discount}</p>
              
              {/* 유효시간 강조 */}
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">발급일시</p>
                  <p className="text-xs text-foreground">
                    {couponData.issuedAt.toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground">만료시간</p>
                  <p className="text-xs text-foreground">
                    {couponData.expiresAt.toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">유효시간</p>
                  <p className="text-primary font-bold text-xl">
                    {getRemainingTime(couponData.expiresAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* 사용 안내 */}
          <div className="bg-muted/50 rounded-xl p-3 mb-4">
            <p className="text-xs text-muted-foreground text-center">
              이 화면을 매장에서 보여주세요<br/>
              스크린샷은 인정되지 않습니다
            </p>
          </div>

          {/* 히스토리 보기 버튼 */}
          <button 
            onClick={() => {
              setShowCouponModal(false)
              router.push('/spots/history')
            }}
            className="w-full bg-primary hover:bg-primary/90 text-black font-medium py-3 px-4 rounded-xl transition-colors"
          >
            인증 완료 내역 보기
          </button>
        </>
      ) : (
        <>
          {/* 만료된 쿠폰 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-foreground" />
            </div>
            <h3 className="text-xl font-bold text-red-400 mb-2">만료된 인증입니다</h3>
            <p className="text-muted-foreground text-sm mb-4">이 쿠폰은 유효시간이 지났습니다</p>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 text-sm">
                만료 시간: {couponData.expiresAt.toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
</div>
)}

      {/* 하단 탭 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-bottom">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group">
            <MapPin className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xs text-primary font-medium">스팟</span>
          </button>
          <button 
            onClick={() => router.push('/spots/history')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group"
          >
            <Clock className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">인증 내역</span>
          </button>
        </div>
      </div>

      {/* 하단 여백 (탭 네비게이션 높이만큼) */}
      <div className="h-20"></div>
    </div>
  )
}
