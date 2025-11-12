'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Play, Bookmark, User, Navigation, Clock, Home as HomeIcon, Store, Mail, X } from 'lucide-react'
import KakaoMap from '@/components/common/KakaoMap'
import CoursePolyline from '@/components/common/CoursePolyline'
import CourseMarker from '@/components/common/CourseMarker'
import SupabaseStatus from '@/components/common/SupabaseStatus'
import AuthenticationBanner from '@/components/common/AuthenticationBanner'
import BookmarkButton from '@/components/BookmarkButton'
import { GPSCoordinate, Course } from '@/types/database'
import { getNearbyCoursesFromLocation } from '@/lib/courses'
import { getCurrentUser, signOut } from '@/lib/auth'
import { getUserProfile } from '@/lib/profile'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [nearbyCourses, setNearbyCourses] = useState<any[]>([])
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

  // 샘플 코스 데이터 (한강공원 여의도) - 백업용
  const sampleRoute: GPSCoordinate[] = [
    { lat: 37.5285, lng: 126.9367 },
    { lat: 37.5290, lng: 126.9380 },
    { lat: 37.5295, lng: 126.9390 },
    { lat: 37.5300, lng: 126.9400 },
    { lat: 37.5305, lng: 126.9410 },
    { lat: 37.5300, lng: 126.9420 },
    { lat: 37.5295, lng: 126.9430 },
    { lat: 37.5290, lng: 126.9440 },
    { lat: 37.5285, lng: 126.9450 },
    { lat: 37.5280, lng: 126.9440 },
    { lat: 37.5275, lng: 126.9430 },
    { lat: 37.5270, lng: 126.9420 },
    { lat: 37.5275, lng: 126.9410 },
    { lat: 37.5280, lng: 126.9400 },
    { lat: 37.5285, lng: 126.9390 },
    { lat: 37.5285, lng: 126.9367 }
  ]

  const center = { lat: 37.5285, lng: 126.9400 }
  const [mapCenter, setMapCenter] = useState<GPSCoordinate>(center)

  // 로그인 상태 확인
  useEffect(() => {
    // 회원가입 메시지를 먼저 확인
    checkSignupMessage()
    // 그 다음 인증 상태 확인
    setTimeout(() => {
      checkAuthStatus()
    }, 100)
  }, [])

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

  // 위치 및 데이터 로드
  useEffect(() => {
    if (isConnected) {
      loadInitialData()
      loadUserProfile()
    }
  }, [isConnected])

  // 모달 상태 디버깅
  useEffect(() => {
    console.log('모달 상태 변경:', { showSignupMessage, signupEmail })
  }, [showSignupMessage, signupEmail])

  const checkAuthStatus = async () => {
    try {
      const user = await getCurrentUser()
      const isGuestMode = typeof window !== 'undefined' && localStorage.getItem('runspot_guest_mode') === 'true'
      const hasSignupMessage = typeof window !== 'undefined' && localStorage.getItem('show_signup_message') === 'true'
      
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
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error)
      const isGuestMode = typeof window !== 'undefined' && localStorage.getItem('runspot_guest_mode') === 'true'
      const hasSignupMessage = typeof window !== 'undefined' && localStorage.getItem('show_signup_message') === 'true'
      if (!isGuestMode && !hasSignupMessage) {
        router.push('/login')
      }
    }
  }

  const loadInitialData = async () => {
    // 초기 데이터 로딩 (위치 + 코스)
    setLocationLoading(true)

    if (!navigator.geolocation) {
      setLocationError('이 브라우저는 위치 서비스를 지원하지 않습니다.')
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        console.log('📍 위치 정보:', {
          위도: position.coords.latitude,
          경도: position.coords.longitude,
          정확도: position.coords.accuracy + 'm',
          고도: position.coords.altitude,
          방향: position.coords.heading
        })
        
        setUserLocation(location)
        setMapCenter(location)
        setLocationAccuracy(position.coords.accuracy)
        await loadNearbyCourses(location.lat, location.lng)
        setLocationLoading(false)
      },
      (error) => {
        setLocationLoading(false)
        setLocationError('위치 정보를 가져올 수 없습니다.')
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    )
  }

  const loadUserProfile = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        const profile = await getUserProfile(user.id)
        setUserProfile(profile)
      }
    } catch (error) {
      console.error('프로필 로드 실패:', error)
    }
  }

  const moveToMyLocation = () => {
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
            alert('위치 정보 접근이 거부되었습니다.')
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
        maximumAge: 10000
      }
    )
  }

  const loadNearbyCourses = async (lat: number, lng: number) => {
    try {
      setLoading(true)
      const courses = await getNearbyCoursesFromLocation(lat, lng, 3, 8)
      setNearbyCourses(courses)
    } catch (error) {
      console.error('주변 코스 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }


  // 코스 타입 이모지
  const getCourseEmoji = (courseType: string) => {
    switch (courseType) {
      case 'hangang': return '🌊'
      case 'mountain': return '🏔️'
      case 'park': return '🏃‍♂️'
      case 'urban': return '🏙️'
      case 'track': return '🏟️'
      default: return '🏃‍♂️'
    }
  }

  // 현재 표시할 지도 중심 (mapCenter 상태 사용)
  const currentCenter = mapCenter

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

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* 인증 가능 알림 배너 */}
      {userProfile?.id && (
        <AuthenticationBanner userId={userProfile.id} />
      )}
      
      {/* 상단 네비게이션 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800 safe-top">
        <div className="flex items-center justify-between px-4 py-3 animate-fade-in-up">
          {/* 좌측: 로고만 */}
          <div>
            <h1 className="text-lg font-bold text-[#00FF88]">RunSpot</h1>
            <p className="text-xs text-gray-400">Seoul</p>
          </div>
          
          {/* 우측: 프로필 */}
          <div className="flex items-center gap-3">
            {/* Supabase 연결 상태 */}
            <div className="hidden sm:block">
              <SupabaseStatus onConnectionChange={setIsConnected} />
            </div>
            {/* 프로필 드롭다운 */}
            <div className="relative profile-dropdown">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-8 h-8 bg-[#00FF88] rounded-full flex items-center justify-center neon-glow hover:scale-110 transition-transform"
              >
                <User className="w-5 h-5 text-black" />
              </button>
              
              {/* 드롭다운 메뉴 */}
              {showProfileDropdown && (
                <div className="absolute right-0 top-12 w-48 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl z-50 animate-fade-in-up">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false)
                        router.push('/profile')
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-800/50 rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4 text-[#00FF88]" />
                      <span className="text-white">프로필 보기</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-800/50 rounded-xl transition-colors text-red-400 hover:text-red-300"
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
        <div className="bg-gray-900/90 glass rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
          <div className="p-4 border-b border-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">내 위치 주변</h2>
                <p className="text-sm text-gray-400">
                  {userLocation ? `${nearbyCourses.length}개의 코스를 찾았습니다` : '위치를 확인하는 중...'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={moveToMyLocation}
                  disabled={locationLoading}
                  className={`p-2 hover:bg-gray-800 rounded-xl transition-colors ${
                    locationLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {locationLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#00FF88]"></div>
                  ) : (
                    <Navigation className="w-5 h-5 text-[#00FF88]" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <KakaoMap
              center={currentCenter}
              zoom={3}
              height="300px"
              userLocation={userLocation}
              userProfile={userProfile}
              locationAccuracy={locationAccuracy || undefined}
            >
            </KakaoMap>
            
            {/* 지도 위 오버레이 정보 */}
            {userLocation && (
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md rounded-2xl px-3 py-2 z-10">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#00FF88] font-semibold">
                    {nearbyCourses.length}개 코스
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-300">
                    3km 반경
                  </span>
                  {locationAccuracy && (
                    <>
                      <span className="text-gray-300">•</span>
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
            className="text-[#00FF88] text-sm font-medium hover:text-[#00E077] transition-colors"
          >
            전체보기
          </button>
        </div>
        
        <div className="space-y-3">
          {loading ? (
            // 로딩 스켈레톤
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-gray-900/80 glass rounded-2xl p-4 border border-gray-800 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  </div>
                  <div className="w-10 h-10 bg-gray-700 rounded-xl"></div>
                </div>
              </div>
            ))
          ) : nearbyCourses.length > 0 ? (
            nearbyCourses.map((course: any, index: number) => (
              <div 
                key={course.id} 
                className="bg-gray-900/80 glass rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:transform hover:scale-[1.02] animate-fade-in-up"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl animate-pulse">{getCourseEmoji(course.course_type)}</div>
                  <div className="flex-1">
                    <div className="mb-1">
                      <h4 className="font-semibold text-white">{course.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400">{course.area}</span>
                      <span className="text-[#00FF88] font-medium">{course.distance}km</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <BookmarkButton courseId={course.id} />
                    <button className="p-3 bg-gray-800/80 rounded-xl hover:bg-[#00FF88] hover:text-black transition-all duration-300 group">
                      <Play className="w-4 h-4 text-[#00FF88] group-hover:text-black transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // 주변에 코스가 없을 때
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">주변에 등록된 코스가 없습니다.</p>
              <p className="text-sm text-gray-500">다른 지역의 코스를 탐색해보세요!</p>
              <button 
                onClick={() => router.push('/running')}
                className="mt-3 px-4 py-2 bg-[#00FF88] text-black rounded-lg hover:bg-[#00E077] transition-colors"
              >
                코스 탐색하기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-gray-800/50 safe-bottom">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center gap-1 p-3 hover:bg-gray-800/50 rounded-xl transition-all duration-200 group">
            <HomeIcon className="w-6 h-6 text-[#00FF88] group-hover:scale-110 transition-transform" />
            <span className="text-xs text-[#00FF88] font-medium">홈</span>
          </button>
          <button 
            onClick={() => router.push('/running')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-gray-800/50 rounded-xl transition-all duration-200 group"
          >
            <div className="relative">
              <Play className="w-6 h-6 text-gray-400 group-hover:text-[#00FF88] group-hover:scale-110 transition-all" />
            </div>
            <span className="text-xs text-gray-400 group-hover:text-[#00FF88] transition-colors">런닝</span>
          </button>
          <button 
            onClick={() => router.push('/spots')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-gray-800/50 rounded-xl transition-all duration-200 group"
          >
            <Store className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all" />
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors">스팟</span>
          </button>
          <button 
            onClick={() => router.push('/saved')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-gray-800/50 rounded-xl transition-all duration-200 group"
          >
            <Bookmark className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all" />
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors">저장</span>
          </button>
          <button 
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-gray-800/50 rounded-xl transition-all duration-200 group"
          >
            <User className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all" />
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors">프로필</span>
          </button>
        </div>
      </div>

      {/* 하단 여백 (네비게이션 바 높이만큼) */}
      <div className="h-20"></div>

      {/* 회원가입 완료 안내 모달 */}
      {showSignupMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-gray-900 rounded-3xl w-full max-w-sm border border-gray-800 shadow-2xl animate-fade-in-up relative">
            {/* 닫기 버튼 */}
            <button
              onClick={() => {
                setShowSignupMessage(false)
                router.push('/login')
              }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            
            <div className="p-6 text-center">

              {/* 아이콘 */}
              <div className="mb-4">
                <Mail className="w-16 h-16 text-[#00FF88] mx-auto" />
              </div>

              {/* 제목 */}
              <h3 className="text-xl font-bold text-white mb-2">
                회원가입이 완료되었습니다!
              </h3>

              {/* 메시지 */}
              <p className="text-gray-400 mb-6 leading-relaxed">
                <span className="text-[#00FF88] font-medium">{signupEmail}</span>로<br />
                인증 이메일이 전송됩니다.<br />
                인증 후 로그인이 가능합니다.
              </p>

              {/* 확인 버튼 */}
              <button
                onClick={() => {
                  setShowSignupMessage(false)
                  router.push('/login')
                }}
                className="w-full bg-[#00FF88] text-black font-semibold py-3 rounded-2xl hover:bg-[#00E077] transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
