'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Play, Bookmark, User, Bell } from 'lucide-react'
import KakaoMap from '@/components/common/KakaoMap'
import CoursePolyline from '@/components/common/CoursePolyline'
import CourseMarker from '@/components/common/CourseMarker'
import SupabaseStatus from '@/components/common/SupabaseStatus'
import { GPSCoordinate, Course } from '@/types/database'
import { getPopularCourses, getCourses } from '@/lib/courses'

export default function Home() {
  const router = useRouter()
  const [selectedPoint, setSelectedPoint] = useState<GPSCoordinate | null>(null)
  const [popularCourses, setPopularCourses] = useState<Course[]>([])
  const [featuredCourse, setFeaturedCourse] = useState<Course | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

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

  // 실제 데이터 로드
  useEffect(() => {
    loadData()
  }, [isConnected])

  const loadData = async () => {
    if (!isConnected) return

    try {
      setLoading(true)
      
      // 인기 코스 가져오기
      const courses = await getPopularCourses(5)
      setPopularCourses(courses)
      
      // 첫 번째 코스를 추천 코스로 설정
      if (courses.length > 0) {
        setFeaturedCourse(courses[0])
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 난이도 한글 변환
  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '초급'
      case 'medium': return '중급'
      case 'hard': return '고급'
      default: return '초급'
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

  // 현재 표시할 코스 경로 (실제 데이터 또는 샘플)
  const currentRoute = featuredCourse?.gps_route || sampleRoute
  const currentCenter = featuredCourse?.gps_route?.[0] || center

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* 상단 네비게이션 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800 safe-top">
        <div className="flex items-center justify-between px-4 py-3 animate-fade-in-up">
          {/* 좌측: 로고만 */}
          <div>
            <h1 className="text-lg font-bold text-[#00FF88]">RunSpot</h1>
            <p className="text-xs text-gray-400">Seoul</p>
          </div>
          
          {/* 우측: 알림 + 프로필 */}
          <div className="flex items-center gap-3">
            {/* Supabase 연결 상태 */}
            <div className="hidden sm:block">
              <SupabaseStatus onConnectionChange={setIsConnected} />
            </div>
            <button className="p-1 hover:bg-gray-800 rounded-lg transition-colors relative">
              <Bell className="w-6 h-6 text-gray-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </button>
            <button className="w-8 h-8 bg-[#00FF88] rounded-full flex items-center justify-center neon-glow hover:scale-110 transition-transform">
              <User className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* 검색 바 */}
      <div className="px-4 py-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors" />
          <input
            type="text"
            placeholder="코스 검색..."
            className="w-full bg-gray-900/80 glass border border-gray-700 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00FF88] focus:ring-2 focus:ring-[#00FF88]/20 transition-all duration-300"
          />
        </div>
      </div>

      {/* 지도 섹션 */}
      <div className="px-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="bg-gray-900/90 glass rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
          <div className="p-4 border-b border-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {loading ? '로딩 중...' : (featuredCourse ? '추천 코스' : '샘플 코스')}
                </h2>
                <p className="text-sm text-gray-400">
                  {loading ? '데이터를 불러오는 중...' : (featuredCourse?.name || '한강공원 여의도')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
                  <Bookmark className="w-5 h-5 text-gray-400 hover:text-[#00FF88] transition-colors" />
                </button>
                <button className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
                  <MapPin className="w-5 h-5 text-[#00FF88]" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <KakaoMap
              center={center}
              zoom={4}
              height="300px"
              onClick={(coord) => setSelectedPoint(coord)}
            >
              <CoursePolyline 
                path={sampleRoute}
                strokeColor="#00FF88"
                strokeWeight={4}
              />
              <CourseMarker
                position={sampleRoute[0]}
                type="start"
                title="시작점"
                content="한강공원 여의도 시작점"
              />
              <CourseMarker
                position={sampleRoute[sampleRoute.length - 1]}
                type="end"
                title="종료점"
                content="한강공원 여의도 종료점"
              />
              {selectedPoint && (
                <CourseMarker
                  position={selectedPoint}
                  type="waypoint"
                  title="선택한 지점"
                  content={`위도: ${selectedPoint.lat.toFixed(6)}, 경도: ${selectedPoint.lng.toFixed(6)}`}
                />
              )}
            </KakaoMap>
            
            {/* 지도 위 오버레이 정보 */}
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md rounded-2xl px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#00FF88] font-semibold">
                  {featuredCourse ? `${featuredCourse.distance}km` : '5.2km'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-300">
                  {featuredCourse ? `${featuredCourse.duration}분` : '35분'}
                </span>
                <span className="text-gray-300">•</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  featuredCourse?.difficulty === 'easy' 
                    ? 'bg-green-500/20 text-green-400'
                    : featuredCourse?.difficulty === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {featuredCourse ? getDifficultyText(featuredCourse.difficulty) : '초급'}
                </span>
              </div>
            </div>

            {/* 런닝 시작 버튼 */}
            <div className="absolute bottom-4 right-4">
              <button className="bg-[#00FF88] hover:bg-[#00E077] text-black font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-2xl neon-glow transition-all duration-300 transform hover:scale-105 active:scale-95">
                <Play className="w-5 h-5 fill-current" />
                런닝 시작
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 인기 코스 섹션 */}
      <div className="px-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">인기 코스</h3>
          <button className="text-[#00FF88] text-sm font-medium hover:text-[#00E077] transition-colors">
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
          ) : popularCourses.length > 0 ? (
            popularCourses.map((course, index) => (
              <div 
                key={course.id} 
                className="bg-gray-900/80 glass rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:transform hover:scale-[1.02] animate-fade-in-up"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl animate-pulse">{getCourseEmoji(course.course_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-white">{course.name}</h4>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400 animate-pulse">★</span>
                        <span className="text-sm text-gray-300">{course.rating_avg?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{course.area}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-[#00FF88] font-medium">{course.distance}km</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-300">{course.duration}분</span>
                      <span className="text-gray-400">•</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        course.difficulty === 'easy' 
                          ? 'bg-green-500/20 text-green-400'
                          : course.difficulty === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {getDifficultyText(course.difficulty)}
                      </span>
                    </div>
                  </div>
                  <button className="p-3 bg-gray-800/80 rounded-xl hover:bg-[#00FF88] hover:text-black transition-all duration-300 group">
                    <Play className="w-4 h-4 text-[#00FF88] group-hover:text-black transition-colors" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            // 데이터가 없을 때
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">아직 등록된 코스가 없습니다.</p>
              <p className="text-sm text-gray-500">샘플 데이터를 확인해보세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-gray-800/50 safe-bottom">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center gap-1 p-3 hover:bg-gray-800/50 rounded-xl transition-all duration-200 group">
            <MapPin className="w-6 h-6 text-[#00FF88] group-hover:scale-110 transition-transform" />
            <span className="text-xs text-[#00FF88] font-medium">홈</span>
          </button>
          <button 
            onClick={() => router.push('/explore')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-gray-800/50 rounded-xl transition-all duration-200 group"
          >
            <Search className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all" />
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors">탐색</span>
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
    </div>
  )
}
