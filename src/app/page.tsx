'use client'

import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { MapPin, Play, Bookmark, User, Navigation, Home as HomeIcon, Store, Mail, X, Users } from 'lucide-react'
import { GPSCoordinate, FriendLocationData } from '@/types/database'
import { getNearbyCoursesFromLocation, getCourses } from '@/lib/courses'
import { getCurrentUser, signOut } from '@/lib/auth'
import { getUserProfile } from '@/lib/profile'
import { supabase } from '@/lib/supabase'

// 무거운 컴포넌트들을 지연 로딩
import KakaoMapWrapper from '@/components/common/KakaoMapWrapper'
const KakaoMap = dynamic(() => import('@/components/common/KakaoMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-muted rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-muted-foreground text-sm">지도 로딩 중...</p>
      </div>
    </div>
  )
})
const CourseMarkerIcon = lazy(() => import('@/components/common/CourseMarkerIcon'))
const SupabaseStatus = lazy(() => import('@/components/common/SupabaseStatus'))
const AuthenticationBanner = lazy(() => import('@/components/common/AuthenticationBanner'))
const LocationPermission = lazy(() => import('@/components/common/LocationPermission'))
const BookmarkButton = lazy(() => import('@/components/BookmarkButton'))


export default function Home() {
  const router = useRouter()
  const [nearbyCourses, setNearbyCourses] = useState<any[]>([])
  const [allCourses, setAllCourses] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<GPSCoordinate | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showSignupMessage, setShowSignupMessage] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)
  const [showLocationPermission, setShowLocationPermission] = useState(false)
  
  // 친구 위치 관련 상태 (지연 로딩)
  const [friendsLocations, setFriendsLocations] = useState<FriendLocationData[]>([])
  const [showFriendsOnMap, setShowFriendsOnMap] = useState(false)
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [friendsEnabled, setFriendsEnabled] = useState(false)

  const center = useMemo(() => ({ lat: 37.5285, lng: 126.9400 }), [])
  const [mapCenter, setMapCenter] = useState<GPSCoordinate>(center)

  // 로그인 상태 확인
  useEffect(() => {
    // 회원가입 메시지를 먼저 확인
    checkSignupMessage()
    // 그 다음 인증 상태 확인
    setTimeout(() => {
      checkAuthStatus()
    }, 100)
    // 위치 권한 자동 확인
    checkLocationPermission()
  }, [])

  // 위치 권한 자동 확인
  const checkLocationPermission = async () => {
    if (!navigator.geolocation) return
    
    try {
      // 위치 권한 상태 확인
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        if (result.state === 'granted') {
          setLocationPermissionGranted(true)
          // 자동으로 현재 위치 가져오기
          getCurrentLocationDirect()
        }
      }
    } catch (error) {
      console.log('위치 권한 확인 실패:', error)
    }
  }

  // 회원가입 완료 메시지 확인
  const checkSignupMessage = () => {
    if (typeof window !== 'undefined') {
      const showMessage = localStorage.getItem('show_signup_message')
      const email = localStorage.getItem('signup_email')
      
      console.log('회원가입 메시지 확인:', { showMessage, email })
      
      if (showMessage === 'true' && email) {
        console.log('회원가입 모달 표시')
        setShowSignupMessage(true)
        setSignupEmail(email)
        
        // 메시지 표시 후 로컬 스토리지에서 제거 (3초 후에 제거하도록 변경)
        setTimeout(() => {
          localStorage.removeItem('show_signup_message')
          localStorage.removeItem('signup_email')
        }, 3000)
      } else {
        console.log('회원가입 메시지 조건 불충족:', { showMessage, email })
      }
    }
  }

  // 인증 상태 변화 감지
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('인증 상태 변화:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          // 로그인 시 게스트 모드 해제
          if (typeof window !== 'undefined') {
            localStorage.removeItem('runspot_guest_mode')
          }
          // 사용자 프로필 다시 로드
          await loadUserProfile()
          // 친구 기능 활성화
          setFriendsEnabled(true)
        } else if (event === 'SIGNED_OUT') {
          // 로그아웃 시 상태 초기화
          setUserProfile(null)
          setFriendsLocations([])
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('토큰이 갱신되었습니다.')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [userLocation])

  // 위치 및 데이터 로드
  useEffect(() => {
    if (isConnected) {
      loadInitialData()
      loadUserProfile()
    }
  }, [isConnected])

  // 사용자 위치가 변경될 때 친구 위치 로드 (사용자가 활성화한 경우만)
  useEffect(() => {
    if (userLocation && isConnected && friendsEnabled) {
      loadFriendsLocations()
    }
  }, [userLocation, isConnected, friendsEnabled])


  const checkAuthStatus = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      const isGuestMode = typeof window !== 'undefined' && localStorage.getItem('runspot_guest_mode') === 'true'
      const hasSignupMessage = typeof window !== 'undefined' && localStorage.getItem('show_signup_message') === 'true'
      
      // 로그인된 사용자인데 게스트 모드가 설정되어 있다면 해제
      if (user && isGuestMode) {
        localStorage.removeItem('runspot_guest_mode')
        console.log('로그인된 사용자 감지 - 게스트 모드 해제')
      }
      
      if (!user && !isGuestMode && !hasSignupMessage) {
        // 로그인되지 않고 게스트 모드도 아니며 회원가입 메시지도 없는 경우 로그인 페이지로 리다이렉트
        router.push('/login')
        return
      }

      // 사용자가 있지만 이메일이 인증되지 않은 경우 체크
      if (user) {
        const { data } = await supabase.auth.getSession()
        if (data.session?.user && !data.session.user.email_confirmed_at) {
          // 이메일이 인증되지 않은 경우 로그아웃 처리
          await supabase.auth.signOut()
          alert('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.')
          router.push('/login')
          return
        }
        
        // 로그인된 사용자의 프로필 로드
        await loadUserProfile()
        setFriendsEnabled(true)
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error)
      const isGuestMode = typeof window !== 'undefined' && localStorage.getItem('runspot_guest_mode') === 'true'
      const hasSignupMessage = typeof window !== 'undefined' && localStorage.getItem('show_signup_message') === 'true'
      if (!isGuestMode && !hasSignupMessage) {
        router.push('/login')
      }
    }
  }, [])

  const loadInitialData = async () => {
    // 초기 데이터 로딩 (위치 + 코스)
    setLocationLoading(true)

    // 전체 코스 먼저 로드
    await loadAllCourses()

    // 위치 권한 확인
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        if (result.state === 'granted') {
          // 이미 권한이 있는 경우 바로 위치 가져오기
          getCurrentLocationDirect()
        } else {
          // 권한이 없거나 prompt 상태인 경우 LocationPermission 컴포넌트 표시
          setShowLocationPermission(true)
          setLocationLoading(false)
        }
      } catch (error) {
        // permissions API를 지원하지 않는 경우 LocationPermission 컴포넌트 표시
        setShowLocationPermission(true)
        setLocationLoading(false)
      }
    } else {
      // permissions API를 지원하지 않는 경우 LocationPermission 컴포넌트 표시
      setShowLocationPermission(true)
      setLocationLoading(false)
    }
  }

  const getCurrentLocationDirect = () => {
    if (!navigator.geolocation) {
      setLocationError('이 브라우저는 위치 서비스를 지원하지 않습니다.')
      setLocationLoading(false)
      return
    }

    setLocationLoading(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        console.log('📍 자동 위치 감지:', {
          위도: position.coords.latitude,
          경도: position.coords.longitude,
          정확도: position.coords.accuracy + 'm'
        })
        
        setUserLocation(location)
        setMapCenter(location)
        setLocationAccuracy(position.coords.accuracy)
        setLocationPermissionGranted(true)
        setLocationLoading(false)
        
        // 주변 코스 로드
        await loadNearbyCourses(location.lat, location.lng)
      },
      (error) => {
        console.error('위치 정보 가져오기 실패:', error)
        setLocationLoading(false)
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('위치 정보 접근이 거부되었습니다.')
            setLocationPermissionGranted(false)
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('위치 정보를 사용할 수 없습니다.')
            break
          case error.TIMEOUT:
            setLocationError('위치 정보 요청이 시간 초과되었습니다.')
            break
          default:
            setLocationError('위치 정보를 가져오는 중 오류가 발생했습니다.')
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5분
      }
    )
  }

  const loadAllCourses = useCallback(async () => {
    try {
      console.log('🗺️ 전체 코스 로딩 시작')
      const courses = await getCourses(50) // 최대 50개 코스
      console.log('✅ 전체 코스 로드 완료:', courses?.length || 0, '개')
      setAllCourses(courses || [])
    } catch (error) {
      console.error('전체 코스 로드 실패:', error)
    }
  }, [])

  const loadUserProfile = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        const profile = await getUserProfile(user.id)
        setUserProfile(profile)
      }
    } catch (error) {
      console.error('프로필 로드 실패:', error)
    }
  }, [])

  const moveToMyLocation = useCallback(() => {
    if (!locationPermissionGranted) {
      // 위치 권한이 없는 경우 LocationPermission 컴포넌트 표시
      setShowLocationPermission(true)
      return
    }

    setLocationLoading(true)

    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.')
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        console.log('📍 내 위치로 지도 이동:', {
          위도: position.coords.latitude,
          경도: position.coords.longitude,
          정확도: position.coords.accuracy + 'm',
          이전위치와차이: userLocation ? 
            Math.sqrt(
              Math.pow(position.coords.latitude - userLocation.lat, 2) + 
              Math.pow(position.coords.longitude - userLocation.lng, 2)
            ) * 111000 + 'm' : '처음'
        })
        
        setUserLocation(location)
        setMapCenter(location) // 지도 중심을 사용자 위치로 이동
        setLocationAccuracy(position.coords.accuracy)
        setLocationLoading(false)
      },
      (error) => {
        setLocationLoading(false)
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setShowLocationPermission(true)
            break
          case error.POSITION_UNAVAILABLE:
            alert('위치 정보를 사용할 수 없습니다.')
            break
          case error.TIMEOUT:
            alert('위치 정보 요청 시간이 초과되었습니다.')
            break
          default:
            alert('위치 정보를 가져오는 중 오류가 발생했습니다.')
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    )
  }, [locationPermissionGranted, userLocation])

  const loadNearbyCourses = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true)
      const courses = await getNearbyCoursesFromLocation(lat, lng, 3, 8)
      setNearbyCourses(courses)
    } catch (error) {
      console.error('주변 코스 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [])


  const getCourseEmoji = useCallback((courseType: string) => {
    switch (courseType) {
      case 'hangang': return '🌊'
      case 'mountain': return '🏔️'
      case 'park': return '🏃‍♂️'
      case 'urban': return '🏙️'
      case 'track': return '🏟️'
      default: return '🏃‍♂️'
    }
  }, [])

  const currentCenter = useMemo(() => mapCenter, [mapCenter])

  // 로그아웃 처리
  const handleSignOut = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        setShowProfileDropdown(false)
        // 로그인 페이지로 리다이렉트
        router.push('/login')
      } else {
        alert(result.error || '로그아웃에 실패했습니다.')
      }
    } catch (error) {
      console.error('로그아웃 오류:', error)
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }

  // 친구 위치 로드 (지연 로딩)
  const loadFriendsLocations = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        setFriendsLocations([])
        return
      }

      // 친구 기능 모듈을 동적으로 로드
      const { getFriendsLocations } = await import('@/lib/friends')
      
      setFriendsLoading(true)
      const result = await getFriendsLocations(userLocation || undefined)
      
      if (result.success && result.data) {
        setFriendsLocations(result.data)
      } else {
        setFriendsLocations([])
      }
    } catch (error) {
      console.error('친구 위치 로드 오류:', error)
      setFriendsLocations([])
    } finally {
      setFriendsLoading(false)
    }
  }

  // 드롭다운 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showProfileDropdown])

  // LocationPermission 콜백 함수들
  const handleLocationPermissionGranted = async (position: GeolocationPosition) => {
    const location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    }
    
    console.log('📍 위치 권한 허용됨:', {
      위도: position.coords.latitude,
      경도: position.coords.longitude,
      정확도: position.coords.accuracy + 'm'
    })
    
    setUserLocation(location)
    setMapCenter(location)
    setLocationAccuracy(position.coords.accuracy)
    setLocationPermissionGranted(true)
    setShowLocationPermission(false)
    
    // 주변 코스 로드
    await loadNearbyCourses(location.lat, location.lng)
  }

  const handleLocationPermissionDenied = () => {
    console.log('📍 위치 권한 거부됨')
    setLocationError('위치 정보 접근이 거부되었습니다.')
    setShowLocationPermission(false)
    // 기본 위치(서울)로 설정
    setMapCenter({ lat: 37.5665, lng: 126.9780 })
  }

  return (
      <KakaoMapWrapper>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* 인증 가능 알림 배너 */}
        {userProfile?.id && (
          <Suspense fallback={<div className="h-12 bg-muted animate-pulse"></div>}>
            <AuthenticationBanner userId={userProfile.id} />
          </Suspense>
        )}
      
      {/* 상단 네비게이션 */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 py-3 animate-fade-in-up">
          {/* 좌측: 로고만 */}
          <div>
            <h1 className="text-lg font-bold text-primary">RunSpot</h1>
            <p className="text-xs text-muted-foreground">Seoul</p>
          </div>
          
          {/* 우측: 프로필 */}
          <div className="flex items-center gap-3">
            {/* Supabase 연결 상태 */}
            <div className="hidden sm:block">
              <Suspense fallback={<div className="w-3 h-3 bg-muted rounded-full animate-pulse"></div>}>
                <SupabaseStatus onConnectionChange={setIsConnected} />
              </Suspense>
            </div>
            {/* 프로필 드롭다운 */}
            <div className="relative profile-dropdown">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-8 h-8 bg-primary rounded-full flex items-center justify-center neon-glow hover:scale-110 transition-transform"
              >
                <User className="w-5 h-5 text-primary-foreground" />
              </button>
              
              {/* 드롭다운 메뉴 */}
              {showProfileDropdown && (
                <div className="absolute right-0 top-12 w-48 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50 animate-fade-in-up">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false)
                        router.push('/profile')
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-foreground">프로필 보기</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 rounded-xl transition-colors text-destructive hover:text-destructive/80"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>로그아웃</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* 지도 섹션 */}
      <div className="px-4 pt-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="bg-card/90 glass rounded-3xl overflow-hidden border border-border shadow-2xl">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">내 위치 주변</h2>
                <p className="text-sm text-muted-foreground">
                  {userLocation ? `${nearbyCourses.length}개의 코스를 찾았습니다` : '위치를 확인하는 중...'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* 친구 위치 토글 - 로그인된 사용자만 */}
                {userProfile?.id && (
                  <button 
                    onClick={async () => {
                      if (!friendsEnabled) {
                        setFriendsEnabled(true)
                        setShowFriendsOnMap(true)
                      } else {
                        setShowFriendsOnMap(!showFriendsOnMap)
                      }
                    }}
                    className={`p-2 hover:bg-muted rounded-xl transition-colors ${
                      showFriendsOnMap ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    }`}
                    title={showFriendsOnMap ? '친구 위치 숨기기' : '친구 위치 보기'}
                  >
                    <Users className="w-5 h-5" />
                  </button>
                )}
                
                <button 
                  onClick={moveToMyLocation}
                  disabled={locationLoading}
                  className={`p-2 hover:bg-muted rounded-xl transition-colors ${
                    locationLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {locationLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  ) : (
                    <Navigation className="w-5 h-5 text-primary" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="relative">
            {showLocationPermission ? (
              <div className="p-4">
                <Suspense fallback={<div className="p-4 bg-muted animate-pulse rounded-2xl"></div>}>
                  <LocationPermission
                    onPermissionGranted={handleLocationPermissionGranted}
                    onPermissionDenied={handleLocationPermissionDenied}
                  />
                </Suspense>
              </div>
            ) : (
              <KakaoMap
                center={currentCenter}
                zoom={3}
                height="300px"
                userLocation={userLocation}
                userProfile={userProfile}
                locationAccuracy={locationAccuracy || undefined}
                courses={nearbyCourses}
                friendsLocations={friendsLocations}
                showFriendsOnMap={showFriendsOnMap}
                onCourseClick={(course) => {
                  console.log('코스 클릭:', course)
                  router.push(`/running/start?courseId=${course.id}&courseName=${encodeURIComponent(course.name)}`)
                }}
              >
              </KakaoMap>
            )}
            
            {/* 지도 위 오버레이 정보 */}
            {userLocation && (
              <div className="absolute top-3 left-3 bg-background/70 backdrop-blur-md rounded-2xl px-3 py-2 z-10">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary font-semibold">
                    {nearbyCourses.length}개 코스
                  </span>
                  {showFriendsOnMap && friendsLocations.length > 0 && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-green-600 font-semibold">
                        {friendsLocations.length}명 친구
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    3km 반경
                  </span>
                  {locationAccuracy && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className={`text-xs ${
                        locationAccuracy < 20 ? 'text-green-400' : 
                        locationAccuracy < 100 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        ±{Math.round(locationAccuracy)}m
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 주변 코스 섹션 */}
      <div className="px-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">내 주변 코스</h3>
          <button 
            onClick={() => router.push('/running')}
            className="text-primary text-sm font-medium hover:text-primary/80 transition-colors"
          >
            전체보기
          </button>
        </div>
        
        <div className="space-y-3">
          {loading ? (
            // 로딩 스켈레톤
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-card/80 glass rounded-2xl p-4 border border-border animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                  <div className="w-10 h-10 bg-muted rounded-xl"></div>
                </div>
              </div>
            ))
          ) : nearbyCourses.length > 0 ? (
            nearbyCourses.map((course: any, index: number) => (
              <div 
                key={course.id} 
                className="bg-card/80 glass rounded-2xl p-4 border border-border hover:border-border/70 transition-all duration-300 hover:transform hover:scale-[1.02] animate-fade-in-up"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Suspense fallback={<div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>}>
                      <CourseMarkerIcon 
                        courseType={course.course_type} 
                        size={48}
                        className="hover:scale-110 transition-transform duration-200"
                      />
                    </Suspense>
                  </div>
                  <div className="flex-1">
                    <div className="mb-1">
                      <h4 className="font-semibold text-foreground">{course.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">{course.area}</span>
                      <span className="text-primary font-medium">{course.distance}km</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Suspense fallback={<div className="w-10 h-10 bg-muted rounded-xl animate-pulse"></div>}>
                      <BookmarkButton courseId={course.id} />
                    </Suspense>
                    <button 
                      onClick={() => router.push(`/running/start?courseId=${course.id}&courseName=${encodeURIComponent(course.name)}`)}
                      className="p-3 bg-muted/80 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
                    >
                      <Play className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // 주변에 코스가 없을 때
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">주변에 등록된 코스가 없습니다.</p>
              <p className="text-sm text-muted-foreground/70">다른 지역의 코스를 탐색해보세요!</p>
              <button 
                onClick={() => router.push('/running')}
                className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                코스 탐색하기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-bottom">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group">
            <HomeIcon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xs text-primary font-medium">홈</span>
          </button>
          <button 
            onClick={() => router.push('/running')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group"
          >
            <div className="relative">
              <Play className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">런닝</span>
          </button>
          <button 
            onClick={() => router.push('/spots')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group"
          >
            <Store className="w-6 h-6 text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-all" />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">스팟</span>
          </button>
          <button 
            onClick={() => router.push('/saved')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group"
          >
            <Bookmark className="w-6 h-6 text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-all" />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">저장</span>
          </button>
          <button 
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group"
          >
            <User className="w-6 h-6 text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-all" />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">프로필</span>
          </button>
        </div>
      </div>

      {/* 하단 여백 (네비게이션 바 높이만큼) */}
      <div className="h-20"></div>

      {/* 회원가입 완료 안내 모달 */}
      {showSignupMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-3xl w-full max-w-sm border border-border shadow-2xl animate-fade-in-up relative">
            {/* 닫기 버튼 */}
            <button
              onClick={() => {
                setShowSignupMessage(false)
                router.push('/login')
              }}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <div className="p-6 text-center">

              {/* 아이콘 */}
              <div className="mb-4">
                <Mail className="w-16 h-16 text-primary mx-auto" />
              </div>

              {/* 제목 */}
              <h3 className="text-xl font-bold text-foreground mb-2">
                회원가입이 완료되었습니다!
              </h3>

              {/* 메시지 */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                <span className="text-primary font-medium">{signupEmail}</span>로<br />
                인증 이메일이 전송됩니다.<br />
                인증 후 로그인이 가능합니다.
              </p>

              {/* 확인 버튼 */}
              <button
                onClick={() => {
                  setShowSignupMessage(false)
                  router.push('/login')
                }}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-2xl hover:bg-primary/90 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </KakaoMapWrapper>
  )
}
