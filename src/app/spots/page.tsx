'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Clock, Star, Phone, ExternalLink, Coffee, Utensils, ShoppingBag, Heart, CheckCircle, X, Timer, Calendar, Navigation, Play, History } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getSpots, getNearbySpots, getUserActiveCoupons, getSpotActiveCoupon, createSpotCoupon, cleanupExpiredCoupons, getUserCouponHistory, type SpotWithDistance } from '@/lib/spots'
import type { Spot } from '@/types/database'
import { getGuestUserId } from '@/lib/auth'

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

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
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
      if (userLocation) {
        // 위치가 있으면 주변 스팟 조회
        spotsData = await getNearbySpots(
          userLocation.lat, 
          userLocation.lng, 
          10, // 10km 반경
          selectedCategory === 'all' ? undefined : selectedCategory
        )
      } else {
        // 위치가 없으면 전체 스팟 조회
        spotsData = await getSpots(selectedCategory === 'all' ? undefined : selectedCategory)
      }
      
      setSpots(spotsData as any)
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

  // 거리 계산 함수 (Haversine 공식)
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
        // 기존 쿠폰이 아직 유효하면 그것을 다시 표시 (필드명 통일)
        const coupon = existingCoupon as any
        const normalizedCoupon = {
          ...coupon,
          expiresAt: new Date(coupon.expires_at),
          issuedAt: new Date(coupon.issued_at),
          discount: coupon.discount_info
        }
        setSelectedSpot(spot)
        setCouponData(normalizedCoupon)
        setShowCouponModal(true)
        return
      }

      // 새로운 인증 확인 (테스트용 - 거리 제한 없음)
      if (!userLocation) {
        // 위치가 없어도 기본 위치로 설정
        setUserLocation({ lat: 37.5665, lng: 126.9780 }) // 서울 기본 좌표
      }

      // 새 쿠폰 생성
      const runningCompletedAt = new Date(Date.now() - 30 * 60 * 1000) // 30분 전 완주했다고 가정
      const newCoupon = await createSpotCoupon(
        userId,
        spot.id,
        runningCompletedAt,
        userLocation?.lat || 37.5665,
        userLocation?.lng || 126.9780
      )

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

  // 스팟으로 러닝 네비게이션 시작
  const handleRunToSpot = (spot: Spot) => {
    if (!userLocation) {
      alert('현재 위치를 확인할 수 없습니다.')
      return
    }

    // 러닝 페이지로 이동하면서 스팟 정보 전달
    const runningData = {
      type: 'spot_navigation',
      destination: {
        name: spot.name,
        latitude: spot.latitude,
        longitude: spot.longitude,
        address: spot.address
      },
      start: {
        latitude: userLocation.lat,
        longitude: userLocation.lng
      }
    }

    // 세션 스토리지에 러닝 데이터 저장
    sessionStorage.setItem('runspot_navigation_data', JSON.stringify(runningData))
    
    // 러닝 페이지로 이동
    router.push('/running')
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
  const formatOperatingTime = (timeString: string) => {
    const [startTime, endTime] = timeString.split(' - ')
    
    const formatTime = (time: string) => {
      const [hour, minute] = time.split(':')
      const hourNum = parseInt(hour)
      
      if (hourNum === 0) return '자정'
      if (hourNum === 12) return '정오'
      if (hourNum < 12) return `오전 ${hourNum}시`
      if (hourNum === 24) return '자정'
      return `저녁 ${hourNum - 12}시`
    }
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
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
          <div className="w-16 h-16 bg-[#00FF88] rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">런 - 스팟</h2>
          <p className="text-gray-400 mb-4">러너들을 위한 혜택을 제공하는 파트너 매장들</p>
          
          {/* 인증 내역 버튼 */}
          <button 
            onClick={() => router.push('/spots/history')}
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-colors"
          >
            <History className="w-4 h-4" />
            <span>인증 완료 내역</span>
          </button>
        </div>


        {/* 카테고리 필터 */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-[#00FF88] text-black font-medium'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* 스팟 목록 */}
        <div>
          <p className="text-gray-400 text-sm mb-4">
            {loading ? '로딩 중...' : `${spots.length}개의 제휴 스팟`}
          </p>

          {loading ? (
            // 로딩 스켈레톤
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-gray-900/80 glass rounded-2xl p-4 border border-gray-800 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-700 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : spots.length > 0 ? (
            <div className="space-y-3">
              {spots.map((spot, index) => (
                <div 
                  key={spot.id}
                  onClick={() => {
                    setDetailSpot(spot)
                    setShowDetailModal(true)
                  }}
                  className="bg-gray-900/80 glass rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-all duration-300 animate-fade-in-up cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{spot.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{(spot as any).distance || '0'}km</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRunToSpot(spot)
                        }}
                        className="flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white py-1 px-2 rounded-lg transition-colors text-xs"
                      >
                        <Play className="w-3 h-3" />
                        뛰어가기
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{spot.signature_menu}</span>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-3">{spot.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="bg-[#00FF88]/10 border border-[#00FF88]/20 rounded-lg px-3 py-1">
                      <p className="text-[#00FF88] text-sm font-medium">
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
                          ? 'bg-gray-600 text-gray-300 cursor-default'
                          : 'bg-[#00FF88] hover:bg-[#00E077] text-black'
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
              <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">해당 카테고리의 제휴 스팟이 없습니다</p>
              <p className="text-sm text-gray-500">다른 카테고리를 확인해보세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-20"></div>

      {/* 쿠폰 모달 */}
      {showCouponModal && couponData && selectedSpot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-gray-800 relative overflow-hidden">
            {/* 배경 패턴 */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#00FF88] to-transparent"></div>
            </div>
            
            {/* 닫기 버튼 */}
            <button 
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-xl transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="relative z-10">
              {isCouponValidRealtime(couponData) ? (
                <>
                  {/* 성공 아이콘 */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-[#00FF88] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <CheckCircle className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">인증 완료!</h3>
                    <p className="text-gray-400 text-sm">완주 인증이 성공적으로 완료되었습니다</p>
                  </div>

                  {/* 쿠폰 정보 */}
                  <div className="bg-gradient-to-r from-[#00FF88]/20 to-[#00FF88]/10 border border-[#00FF88]/30 rounded-2xl p-4 mb-4">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-white mb-1">{selectedSpot.name}</h4>
                      <p className="text-[#00FF88] font-medium text-lg mb-3">{couponData.discount}</p>
                      
                      {/* 유효시간 강조 */}
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-400">발급일시</p>
                          <p className="text-xs text-white">
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
                          <p className="text-xs text-gray-400">만료시간</p>
                          <p className="text-xs text-white">
                            {couponData.expiresAt.toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">유효시간</p>
                          <p className="text-[#00FF88] font-bold text-xl">
                            {getRemainingTime(couponData.expiresAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* 사용 안내 */}
                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 text-center">
                      매장에서 이 화면을 보여주세요<br/>
                      2시간 후 자동으로 만료됩니다<br/>
                      <span className="text-gray-500">스크린샷은 인정되지 않습니다</span>
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
          <div className="bg-gray-900 rounded-3xl p-6 max-w-md w-full border border-gray-800 relative max-h-[80vh] overflow-y-auto scrollbar-hide">
            {/* 닫기 버튼 */}
            <button 
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-xl transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="text-center">
              {/* 헤더 */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                  {getCategoryIcon(detailSpot.category)}
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{detailSpot.name}</h2>
                <p className="text-gray-400">{detailSpot.signature_menu}</p>
              </div>

              {/* 기본 정보 */}
              <div className="space-y-4 mb-6 text-left">
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">소개</h3>
                  <p className="text-gray-400">{detailSpot.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">위치 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{detailSpot.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Navigation className="w-4 h-4" />
                      <span>{(detailSpot as any).distance || '0'}km 거리</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">운영 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{formatOperatingTime(detailSpot.open_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{detailSpot.phone}</span>
                    </div>
                  </div>
                </div>

                {/* 혜택 정보 */}
                <div className="bg-[#00FF88]/10 border border-[#00FF88]/20 rounded-xl p-4">
                  <h3 className="text-[#00FF88] font-medium mb-2">🎁 런스팟 혜택</h3>
                  <p className="text-white">
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
                    ? 'bg-gray-600 text-gray-300 cursor-default'
                    : 'bg-[#00FF88] hover:bg-[#00E077] text-black'
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
  <div className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-gray-800 relative overflow-hidden">
    {/* 배경 패턴 */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#00FF88] to-transparent"></div>
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
      className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-xl transition-colors z-50"
    >
      <X className="w-5 h-5 text-gray-400" />
    </button>

    <div className="relative z-10">
      {isCouponValidRealtime(couponData) ? (
        <>
          {/* 성공 아이콘 */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#00FF88] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CheckCircle className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">인증 완료!</h3>
            <p className="text-gray-400 text-sm">완주 인증이 성공적으로 완료되었습니다</p>
          </div>

          {/* 쿠폰 정보 */}
          <div className="bg-gradient-to-r from-[#00FF88]/20 to-[#00FF88]/10 border border-[#00FF88]/30 rounded-2xl p-4 mb-4">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white mb-1">{selectedSpot.name}</h4>
              <p className="text-[#00FF88] font-medium text-lg mb-3">{couponData.discount}</p>
              
              {/* 유효시간 강조 */}
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400">발급일시</p>
                  <p className="text-xs text-white">
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
                  <p className="text-xs text-gray-400">만료시간</p>
                  <p className="text-xs text-white">
                    {couponData.expiresAt.toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">유효시간</p>
                  <p className="text-[#00FF88] font-bold text-xl">
                    {getRemainingTime(couponData.expiresAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* 사용 안내 */}
          <div className="bg-gray-800/50 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-400 text-center">
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
            className="w-full bg-[#00FF88] hover:bg-[#00E077] text-black font-medium py-3 px-4 rounded-xl transition-colors"
          >
            인증 완료 내역 보기
          </button>
        </>
      ) : (
        <>
          {/* 만료된 쿠폰 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-red-400 mb-2">만료된 인증입니다</h3>
            <p className="text-gray-400 text-sm mb-4">이 쿠폰은 유효시간이 지났습니다</p>
            
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
    </div>
  )
}
