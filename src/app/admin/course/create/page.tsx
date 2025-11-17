'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Play, Pause, Square, Save, Trash2, X, Search, MapPin } from 'lucide-react'
import KakaoMap from '@/components/common/KakaoMap'
import { MapMarker, Polyline } from 'react-kakao-maps-sdk'
import { supabase } from '@/lib/supabase'

interface CoursePoint {
  id: string
  lat: number
  lng: number
  order: number
  type: 'start' | 'checkpoint' | 'turn' | 'finish'
  description?: string
}

interface CourseData {
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: CoursePoint[]
  distance: number
  estimatedTime: number
}

interface SearchResult {
  place_name: string
  address_name: string
  road_address_name: string
  x: string // longitude
  y: string // latitude
}

function CreateCourseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'hybrid'
  
  const [courseData, setCourseData] = useState<CourseData>({
    name: '',
    description: '',
    difficulty: 'medium',
    points: [],
    distance: 0,
    estimatedTime: 0
  })
  
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentMode, setCurrentMode] = useState<'click' | 'gps'>('click')
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 })
  const [mapZoom, setMapZoom] = useState(15)
  const [saving, setSaving] = useState(false)
  const [showMobileInfo, setShowMobileInfo] = useState(false)
  
  // 주소 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  const watchIdRef = useRef<number | null>(null)

  // 주소 검색 함수 (카카오맵 JavaScript SDK 사용)
  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    
    try {
      // 카카오맵 SDK가 로드되었는지 확인
      if (!(window as any).kakao?.maps?.services) {
        throw new Error('카카오맵 서비스가 로드되지 않았습니다.')
      }

      const places = new (window as any).kakao.maps.services.Places()
      
      places.keywordSearch(query, (data: any[], status: any) => {
        if (status === (window as any).kakao.maps.services.Status.OK) {
          const results = data.map(item => ({
            place_name: item.place_name,
            address_name: item.address_name,
            road_address_name: item.road_address_name,
            x: item.x,
            y: item.y
          }))
          setSearchResults(results)
          setShowSearchResults(true)
        } else {
          setSearchResults([])
          setShowSearchResults(true)
        }
        setIsSearching(false)
      })
    } catch (error) {
      console.error('주소 검색 오류:', error)
      alert('주소 검색 중 오류가 발생했습니다. 카카오맵이 로드되었는지 확인해주세요.')
      setIsSearching(false)
    }
  }

  // 검색 결과 선택
  const selectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.y)
    const lng = parseFloat(result.x)
    
    setMapCenter({ lat, lng })
    setMapZoom(3) // 더 가깝게 확대 (카카오맵은 숫자가 작을수록 가까움)
    setShowSearchResults(false)
    setSearchQuery('')
    
    // 클릭 모드일 때만 자동으로 포인트 추가
    if (currentMode === 'click') {
      const newPoint: CoursePoint = {
        id: `search-${Date.now()}`,
        lat: lat,
        lng: lng,
        order: courseData.points.length,
        type: courseData.points.length === 0 ? 'start' : 'checkpoint',
        description: result.place_name
      }

      setCourseData(prev => ({
        ...prev,
        points: [...prev.points, newPoint]
      }))
    }
  }

  // GPS 추적 시작
  const startGPSTracking = () => {
    if (!navigator.geolocation) {
      alert('GPS를 지원하지 않는 브라우저입니다.')
      return
    }

    setIsRecording(true)
    setIsPaused(false)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (!isPaused) {
          const coursePoint: CoursePoint = {
            id: `gps-${Date.now()}`,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            order: courseData.points.length,
            type: courseData.points.length === 0 ? 'start' : 'checkpoint'
          }
          
          setCourseData(prev => ({
            ...prev,
            points: [...prev.points, coursePoint]
          }))

          // 지도 중심을 현재 위치로 업데이트
          setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude })
        }
      },
      (error) => {
        console.error('GPS 오류:', error)
        alert('GPS 추적 중 오류가 발생했습니다.')
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
    )
  }

  // GPS 추적 중지
  const stopGPSTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    
    setIsRecording(false)
    setIsPaused(false)
    
    if (courseData.points.length > 0) {
      setCourseData(prev => ({
        ...prev,
        points: prev.points.map((point, index) => 
          index === prev.points.length - 1 
            ? { ...point, type: 'finish' }
            : point
        )
      }))
    }
    
    calculateCourseStats()
  }

  // 지도 클릭 핸들러
  const handleMapClick = (coord: { lat: number, lng: number }) => {
    if (currentMode !== 'click') return

    const newPoint: CoursePoint = {
      id: `click-${Date.now()}`,
      lat: coord.lat,
      lng: coord.lng,
      order: courseData.points.length,
      type: courseData.points.length === 0 ? 'start' : 'checkpoint'
    }

    setCourseData(prev => ({
      ...prev,
      points: [...prev.points, newPoint]
    }))

    // 첫 번째 포인트일 경우 지도 중심을 해당 위치로 이동
    if (courseData.points.length === 0) {
      setMapCenter({ lat: coord.lat, lng: coord.lng })
    }
  }

  // 포인트 삭제
  const deletePoint = (pointId: string) => {
    setCourseData(prev => ({
      ...prev,
      points: prev.points
        .filter(p => p.id !== pointId)
        .map((p, index) => ({ ...p, order: index }))
    }))
  }

  // 코스 통계 계산
  const calculateCourseStats = () => {
    if (courseData.points.length < 2) return

    let totalDistance = 0
    for (let i = 1; i < courseData.points.length; i++) {
      const prev = courseData.points[i - 1]
      const curr = courseData.points[i]
      totalDistance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng)
    }

    const estimatedTime = Math.round(totalDistance * 6)

    setCourseData(prev => ({
      ...prev,
      distance: Math.round(totalDistance * 100) / 100,
      estimatedTime
    }))
  }

  // 거리 계산
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // 코스 저장
  const saveCourse = async () => {
    if (!courseData.name.trim()) {
      alert('코스명을 입력해주세요.')
      return
    }

    if (courseData.points.length < 2) {
      alert('최소 2개 이상의 포인트가 필요합니다.')
      return
    }

    setSaving(true)

    try {
      console.log('🚀 코스 저장 시작:', courseData)

      // 시작점과 끝점 좌표
      const startPoint = courseData.points[0]
      const endPoint = courseData.points[courseData.points.length - 1]

      // GPS 경로 데이터 생성
      const gpsRoute = courseData.points.map(point => ({
        lat: point.lat,
        lng: point.lng,
        order: point.order,
        type: point.type
      }))

      const courseToInsert = {
        name: courseData.name || 'Untitled Course', // 기본값 설정
        description: courseData.description || '', // 빈 문자열 기본값
        course_type: 'running', // course_type 필드 추가
        difficulty: courseData.difficulty,
        distance: Math.max(0, courseData.distance || 0), // 음수 방지
        estimated_time: Math.max(0, courseData.estimatedTime || 0), // 음수 방지
        duration: Math.max(0, courseData.estimatedTime || 0), // duration 필드 추가 (음수 방지)
        start_latitude: startPoint.lat,
        start_longitude: startPoint.lng,
        end_latitude: endPoint.lat,
        end_longitude: endPoint.lng,
        gps_route: gpsRoute, // GPS 경로 데이터 추가
        is_active: true, // 활성 상태
        created_by: '550e8400-e29b-41d4-a716-446655440001' // 임시 사용자 ID
      }

      console.log('📝 코스 데이터:', courseToInsert)

      const { data: course, error: courseError } = await (supabase as any)
        .from('courses')
        .insert(courseToInsert)
        .select()
        .single()

      if (courseError) {
        console.error('❌ 코스 저장 오류:', courseError)
        throw courseError
      }

      console.log('✅ 코스 저장 성공:', course)

      const pointsToInsert = courseData.points.map(point => ({
        course_id: course.id,
        latitude: point.lat,
        longitude: point.lng,
        point_order: point.order,
        point_type: point.type,
        description: point.description || ''
      }))

      console.log('📍 포인트 데이터:', pointsToInsert)

      const { error: pointsError } = await (supabase as any)
        .from('course_points')
        .insert(pointsToInsert)

      if (pointsError) {
        console.error('❌ 포인트 저장 오류:', pointsError)
        throw pointsError
      }

      console.log('✅ 포인트 저장 성공')

      // 실제 저장 확인
      const { data: savedCourse, error: checkError } = await (supabase as any)
        .from('courses')
        .select('*, course_points(*)')
        .eq('id', course.id)
        .single()

      if (checkError) {
        console.error('❌ 저장 확인 오류:', checkError)
      } else {
        console.log('🔍 저장된 코스 확인:', savedCourse)
      }

      alert(`코스가 성공적으로 저장되었습니다!\n코스 ID: ${course.id}\n포인트 수: ${pointsToInsert.length}개`)
      router.push('/admin')

    } catch (error: any) {
      console.error('💥 코스 저장 실패:', error)
      
      let errorMessage = '코스 저장 중 오류가 발생했습니다.'
      
      if (error.message?.includes('relation "courses" does not exist')) {
        errorMessage = '데이터베이스 테이블이 생성되지 않았습니다. SQL 스크립트를 실행해주세요.'
      } else if (error.message?.includes('permission denied')) {
        errorMessage = '데이터베이스 권한이 없습니다. RLS 정책을 확인해주세요.'
      } else if (error.message) {
        errorMessage = `오류: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    calculateCourseStats()
  }, [courseData.points])

  // 검색 결과 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearchResults])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 헤더 */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="mr-2 sm:mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-sm sm:text-xl font-bold">
                <span className="hidden sm:inline">코스 등록</span>
                <span className="sm:hidden">코스 등록</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowMobileInfo(true)}
                className="sm:hidden p-2 bg-gray-800 rounded-lg"
              >
                📊
              </button>
              <button
                onClick={saveCourse}
                disabled={saving || courseData.points.length < 2}
                className="flex items-center px-3 py-2 sm:px-4 text-sm bg-[#00FF88] text-black rounded-lg hover:bg-[#00E077] transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{saving ? '저장 중...' : '저장'}</span>
                <span className="sm:hidden">저장</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* 모바일 레이아웃 */}
        <div className="block lg:hidden space-y-4">
          {/* 주소 검색 */}
          <div className="bg-gray-900 rounded-2xl p-4">
            <div className="relative search-container">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchAddress(searchQuery)}
                    className="w-full px-3 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                    placeholder="주소를 검색하세요"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                <button
                  onClick={() => searchAddress(searchQuery)}
                  disabled={isSearching}
                  className="px-4 py-2 bg-[#00FF88] text-black rounded-lg hover:bg-[#00E077] transition-colors disabled:opacity-50 text-sm"
                >
                  {isSearching ? '검색 중...' : '검색'}
                </button>
              </div>
              
              {/* 검색 결과 */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => selectSearchResult(result)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-[#00FF88] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {result.place_name}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {result.road_address_name || result.address_name}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center">
                      검색 결과가 없습니다
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 모드 선택 */}
          <div className="bg-gray-900 rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCurrentMode('click')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentMode === 'click' ? 'bg-[#00FF88] text-black' : 'bg-gray-800 text-white'
                }`}
              >
                클릭 모드
              </button>
              <button
                onClick={() => setCurrentMode('gps')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentMode === 'gps' ? 'bg-[#00FF88] text-black' : 'bg-gray-800 text-white'
                }`}
              >
                GPS 모드
              </button>
            </div>
          </div>

          {/* 지도 */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <div className="h-80">
              <KakaoMap
                center={mapCenter}
                zoom={mapZoom}
                width="100%"
                height="100%"
                onClick={handleMapClick}
              >
                {/* 코스 포인트 마커들 */}
                {courseData.points.map((point, index) => (
                  <MapMarker
                    key={point.id}
                    position={{ lat: point.lat, lng: point.lng }}
                    title={`${point.type === 'start' ? '시작점' : 
                            point.type === 'finish' ? '도착점' : 
                            `체크포인트 ${index + 1}`}`}
                    image={{
                      src: point.type === 'start' ? 
                           'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMEZGODgiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHBhdGggZD0iTTggMkw2IDZIMTBMOCAyWiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+Cjwvc3ZnPgo=' :
                           point.type === 'finish' ?
                           'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGRjAwMDAiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo=' :
                           'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMDdCRkYiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjQiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4K',
                      size: { width: 32, height: 32 },
                      options: { offset: { x: 16, y: 32 } }
                    }}
                    onClick={() => {
                      if (confirm('이 포인트를 삭제하시겠습니까?')) {
                        deletePoint(point.id)
                      }
                    }}
                  />
                ))}

                {/* 코스 경로 라인 */}
                {courseData.points.length > 1 && (
                  <Polyline
                    path={courseData.points.map(point => ({ lat: point.lat, lng: point.lng }))}
                    strokeWeight={4}
                    strokeColor="#00FF88"
                    strokeOpacity={0.8}
                    strokeStyle="solid"
                  />
                )}
              </KakaoMap>
            </div>
          </div>

          {/* GPS 컨트롤 */}
          {currentMode === 'gps' && (
            <div className="bg-gray-900 rounded-2xl p-4">
              <div className="flex justify-center space-x-4">
                {!isRecording ? (
                  <button
                    onClick={startGPSTracking}
                    className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl transition-colors font-semibold"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    GPS 추적 시작
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-xl transition-colors"
                    >
                      {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                      {isPaused ? '재개' : '일시정지'}
                    </button>
                    <button
                      onClick={stopGPSTracking}
                      className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-xl transition-colors"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      완료
                    </button>
                  </>
                )}
              </div>
              {isRecording && (
                <div className="mt-4 text-center">
                  <div className="text-red-500 font-semibold">
                    🔴 GPS 추적 중... {isPaused && '(일시정지됨)'}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    포인트: {courseData.points.length}개 | 거리: {courseData.distance.toFixed(2)}km
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 코스 정보 입력 */}
          <div className="bg-gray-900 rounded-2xl p-4">
            <h3 className="text-base font-semibold mb-4">코스 정보</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={courseData.name}
                onChange={(e) => setCourseData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                placeholder="코스명"
              />
              <textarea
                value={courseData.description}
                onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                rows={2}
                placeholder="코스 설명"
              />
              <select
                value={courseData.difficulty}
                onChange={(e) => setCourseData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
              >
                <option value="easy">쉬움</option>
                <option value="medium">보통</option>
                <option value="hard">어려움</option>
              </select>
            </div>
          </div>
        </div>

        {/* 데스크톱 레이아웃 */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="bg-gray-900 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">코스 경로</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentMode('click')}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          currentMode === 'click' ? 'bg-[#00FF88] text-black' : 'bg-gray-800 text-white'
                        }`}
                      >
                        클릭 모드
                      </button>
                      <button
                        onClick={() => setCurrentMode('gps')}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          currentMode === 'gps' ? 'bg-[#00FF88] text-black' : 'bg-gray-800 text-white'
                        }`}
                      >
                        GPS 모드
                      </button>
                    </div>
                  </div>
                  
                  {/* 주소 검색 */}
                  <div className="relative search-container">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && searchAddress(searchQuery)}
                          className="w-full px-3 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                          placeholder="주소를 검색하세요"
                        />
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      </div>
                      <button
                        onClick={() => searchAddress(searchQuery)}
                        disabled={isSearching}
                        className="px-4 py-2 bg-[#00FF88] text-black rounded-lg hover:bg-[#00E077] transition-colors disabled:opacity-50 text-sm"
                      >
                        {isSearching ? '검색 중...' : '검색'}
                      </button>
                    </div>
                    
                    {/* 검색 결과 */}
                    {showSearchResults && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {searchResults.length > 0 ? (
                          searchResults.map((result, index) => (
                            <button
                              key={index}
                              onClick={() => selectSearchResult(result)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                            >
                              <div className="flex items-start space-x-2">
                                <MapPin className="w-4 h-4 text-[#00FF88] mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white truncate">
                                    {result.place_name}
                                  </div>
                                  <div className="text-xs text-gray-400 truncate">
                                    {result.road_address_name || result.address_name}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-400 text-center">
                            검색 결과가 없습니다
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="h-96">
                  <KakaoMap
                    center={mapCenter}
                    zoom={mapZoom}
                    width="100%"
                    height="100%"
                    onClick={handleMapClick}
                  >
                    {/* 코스 포인트 마커들 */}
                    {courseData.points.map((point, index) => (
                      <MapMarker
                        key={point.id}
                        position={{ lat: point.lat, lng: point.lng }}
                        title={`${point.type === 'start' ? '시작점' : 
                                point.type === 'finish' ? '도착점' : 
                                `체크포인트 ${index + 1}`}`}
                        image={{
                          src: point.type === 'start' ? 
                               'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMEZGODgiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHBhdGggZD0iTTggMkw2IDZIMTBMOCAyWiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+Cjwvc3ZnPgo=' :
                               point.type === 'finish' ?
                               'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGRjAwMDAiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo=' :
                               'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMDdCRkYiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjQiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4K',
                          size: { width: 32, height: 32 },
                          options: { offset: { x: 16, y: 32 } }
                        }}
                        onClick={() => {
                          if (confirm('이 포인트를 삭제하시겠습니까?')) {
                            deletePoint(point.id)
                          }
                        }}
                      />
                    ))}

                    {/* 코스 경로 라인 */}
                    {courseData.points.length > 1 && (
                      <Polyline
                        path={courseData.points.map(point => ({ lat: point.lat, lng: point.lng }))}
                        strokeWeight={5}
                        strokeColor="#00FF88"
                        strokeOpacity={0.8}
                        strokeStyle="solid"
                      />
                    )}
                  </KakaoMap>
                </div>

                {currentMode === 'gps' && (
                  <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center justify-center space-x-4">
                      {!isRecording ? (
                        <button
                          onClick={startGPSTracking}
                          className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          GPS 추적 시작
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsPaused(!isPaused)}
                            className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                          >
                            {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                            {isPaused ? '재개' : '일시정지'}
                          </button>
                          <button
                            onClick={stopGPSTracking}
                            className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Square className="w-4 h-4 mr-2" />
                            추적 완료
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-900 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">코스 정보</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={courseData.name}
                    onChange={(e) => setCourseData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                    placeholder="코스명을 입력하세요"
                  />
                  <textarea
                    value={courseData.description}
                    onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                    rows={3}
                    placeholder="코스 설명을 입력하세요"
                  />
                  <select
                    value={courseData.difficulty}
                    onChange={(e) => setCourseData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  >
                    <option value="easy">쉬움</option>
                    <option value="medium">보통</option>
                    <option value="hard">어려움</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-900 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">코스 통계</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">총 거리</span>
                    <span className="font-semibold">{courseData.distance.toFixed(2)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">예상 시간</span>
                    <span className="font-semibold">{courseData.estimatedTime}분</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">포인트 수</span>
                    <span className="font-semibold">{courseData.points.length}개</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 정보 모달 */}
      {showMobileInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">코스 통계</h3>
              <button
                onClick={() => setShowMobileInfo(false)}
                className="p-1 hover:bg-gray-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">총 거리</span>
                <span className="font-semibold">{courseData.distance.toFixed(2)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">예상 시간</span>
                <span className="font-semibold">{courseData.estimatedTime}분</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">포인트 수</span>
                <span className="font-semibold">{courseData.points.length}개</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CreateCoursePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black text-white">로딩 중...</div>}>
      <CreateCourseContent />
    </Suspense>
  )
}
