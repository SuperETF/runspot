'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { ArrowLeft, Play, Pause, Square, CheckCircle, Navigation, Heart, Clock, Zap } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import RunningMap from '@/components/common/RunningMap'
import RunningNavigation from '@/components/common/RunningNavigation'
import NavigationGuide from '@/components/common/NavigationGuide'
import { useRunningStore } from '@/stores/runningStore'
import { getCourse } from '@/lib/courses'

function RunningStartContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  
  // 기본 런닝 상태
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  
  // 위치 및 코스 상태
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isAtStartPoint, setIsAtStartPoint] = useState(false)
  const [distanceToStart, setDistanceToStart] = useState<number | null>(null)
  const [course, setCourse] = useState<any>(null)
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0)
  const [passedCheckpoints, setPassedCheckpoints] = useState<number[]>([])
  
  // 네비게이션 상태
  const [navigationFunctions, setNavigationFunctions] = useState<{
    startNav: () => void
    stopNav: () => void
    isNavMode: boolean
  } | null>(null)

  // 런닝 스토어에서 통계 가져오기 (개별적으로 가져와서 무한 루프 방지)
  const duration = useRunningStore((state) => state.currentStats.duration)
  const distance = useRunningStore((state) => state.currentStats.distance)
  const pace = useRunningStore((state) => state.currentStats.pace)
  
  // duration을 time으로 사용
  const time = duration

  const startTracking = useRunningStore((state) => state.startTracking)
  const pauseTrackingStore = useRunningStore((state) => state.pauseTracking)
  const resumeTrackingStore = useRunningStore((state) => state.resumeTracking)
  const stopTrackingStore = useRunningStore((state) => state.stopTracking)

  // UI 모드 계산
  const isNavigationMode = navigationFunctions?.isNavMode || false
  const isPreRunning = !isRunning && course && !isCompleted
  const isActiveRunning = isRunning && !isCompleted

  // 코스 로드
  useEffect(() => {
    if (courseId) {
      const loadCourse = async () => {
        try {
          const courseData = await getCourse(courseId)
          setCourse(courseData)
        } catch (error) {
          console.error('코스 로드 실패:', error)
        }
      }
      loadCourse()
    }
  }, [courseId])

  // 거리 계산 함수
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // 위치 추적
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(newLocation)
          
          // 시작점 도착 확인
          if (course?.gps_route?.[0] && !isRunning) {
            const startPoint = course.gps_route[0]
            const distance = calculateDistance(
              newLocation.lat, newLocation.lng,
              startPoint.lat, startPoint.lng
            )
            setDistanceToStart(distance)
            setIsAtStartPoint(distance <= 0.05) // 50m 이내
          }
        },
        (error) => console.error('위치 추적 오류:', error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [course, isRunning])

  // 런닝 시작
  const startRunning = useCallback(() => {
    if (!isAtStartPoint || !course) return
    
    setIsRunning(true)
    setIsPaused(false)
    
    if (course) {
      startTracking(course)
    }
  }, [isAtStartPoint, course, startTracking])

  // 런닝 일시정지/재개
  const pauseRunning = useCallback(() => {
    setIsPaused(!isPaused)
    if (!isPaused) {
      pauseTrackingStore()
    } else {
      resumeTrackingStore()
    }
  }, [isPaused, pauseTrackingStore, resumeTrackingStore])

  // 런닝 종료
  const stopRunning = useCallback(() => {
    if (confirm('런닝을 종료하시겠습니까?')) {
      setIsRunning(false)
      setIsPaused(false)
      setIsCompleted(true)
      stopTrackingStore()
    }
  }, [stopTrackingStore])

  // 네비게이션 함수 핸들러
  const handleNavigationReady = useCallback((startNav: () => void, stopNav: () => void, isNavMode: boolean) => {
    setNavigationFunctions({ startNav, stopNav, isNavMode })
  }, [])

  // 시간 포맷
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF88] mx-auto mb-4"></div>
          <p className="text-gray-400">코스 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 헤더 (네비게이션 모드가 아닐 때만) */}
      {!isNavigationMode && (
        <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-semibold">{course.name}</h1>
              <p className="text-xs text-gray-400">{course.area}</p>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <main className={isNavigationMode ? "" : "px-4 py-6 space-y-6"}>
        
        {/* 지도 (항상 표시) */}
        <div className={isNavigationMode ? "" : "mb-6"}>
          <RunningMap
            isRunning={isRunning}
            userLocation={userLocation}
            showStartPoint={true}
            currentCheckpoint={currentCheckpoint}
            passedCheckpoints={passedCheckpoints}
            isCompleted={isCompleted}
            onNavigationReady={handleNavigationReady}
            runningStats={{ time, distance, pace }}
            onPause={pauseRunning}
            onStop={stopRunning}
            isPaused={isPaused}
            onStartPointStatusChange={(isAtStart, distanceToStart) => {
              setIsAtStartPoint(isAtStart)
              setDistanceToStart(distanceToStart)
            }}
            hideFloatingNavigation={true}
            isFullScreen={isNavigationMode}
          />
        </div>

        {/* 네비게이션 모드가 아닐 때만 표시되는 UI */}
        {!isNavigationMode && (
          <>
            {/* 시작점 가이드 */}
            {isPreRunning && (
              <div className="mb-6">
                <div className={`bg-gray-900/80 rounded-2xl p-6 border transition-all duration-300 ${
                  isAtStartPoint ? 'border-[#00FF88] bg-[#00FF88]/10' : 'border-orange-500 bg-orange-500/10'
                }`}>
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      isAtStartPoint ? 'bg-[#00FF88] animate-pulse' : 'bg-orange-500'
                    }`}>
                      {isAtStartPoint ? (
                        <CheckCircle className="w-8 h-8 text-black" />
                      ) : (
                        <Navigation className="w-8 h-8 text-white" />
                      )}
                    </div>
                    
                    {isAtStartPoint ? (
                      <div>
                        <h3 className="text-lg font-bold text-[#00FF88] mb-2">시작점 도착 완료!</h3>
                        <p className="text-gray-300 text-sm mb-4">런닝을 시작할 수 있습니다</p>
                        <button
                          onClick={startRunning}
                          className="bg-[#00FF88] hover:bg-[#00E077] text-black font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          런닝 시작
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-bold text-orange-400 mb-2">시작점으로 이동하세요</h3>
                        <p className="text-gray-300 text-sm mb-2">
                          시작점까지 {distanceToStart ? `${(distanceToStart * 1000).toFixed(0)}m` : '계산 중...'}
                        </p>
                        <p className="text-gray-400 text-xs">시작점에서 50m 이내에 있어야 런닝을 시작할 수 있습니다</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 체크포인트 가이드 (네비게이션 모드일 때만) */}
            {isActiveRunning && isNavigationMode && course?.gps_route && userLocation && (
              <div className="mb-6">
                <NavigationGuide
                  courseRoute={course.gps_route}
                  currentCheckpoint={currentCheckpoint}
                  isRunning={isRunning && !isPaused}
                  userLocation={userLocation}
                  inline={true}
                  runningStats={{ time, distance, pace }}
                  onCheckpointReached={(checkpoint) => {
                    setCurrentCheckpoint(checkpoint)
                    setPassedCheckpoints(prev => [...prev, checkpoint])
                    
                    if (checkpoint === course.gps_route.length - 1) {
                      setIsCompleted(true)
                    }
                  }}
                  onStartNavigation={navigationFunctions?.startNav}
                  onStopNavigation={navigationFunctions?.stopNav}
                  isNavigationMode={isNavigationMode}
                />
              </div>
            )}

            {/* 네비게이션 시작 버튼 */}
            {isActiveRunning && (
              <div className="mb-6">
                <RunningNavigation
                  isNavigationActive={isNavigationMode}
                  currentDistance={distance}
                  remainingDistance={0}
                  estimatedTime={0}
                  nextDirection="코스를 따라 직진하세요"
                  nextDistance={0.1}
                  isRunning={isRunning}
                  isAtStartPoint={isAtStartPoint}
                  inline={true}
                  onStartNavigation={() => {
                    if (navigationFunctions?.startNav) {
                      navigationFunctions.startNav()
                    }
                  }}
                  onStopNavigation={() => {
                    if (navigationFunctions?.stopNav) {
                      navigationFunctions.stopNav()
                    }
                  }}
                />
              </div>
            )}

            {/* 런닝 통계 */}
            {isActiveRunning && (
              <div className="text-center mb-8">
                {/* 시간 */}
                <div className="mb-6">
                  <div className="text-6xl font-bold text-[#00FF88] mb-2 font-mono tracking-wider">
                    {formatTime(time)}
                  </div>
                  <p className="text-gray-400 text-sm">경과 시간</p>
                </div>

                {/* 거리 */}
                <div className="mb-6">
                  <div className="text-4xl font-bold text-white mb-1">
                    {distance.toFixed(2)} <span className="text-2xl text-gray-400">km</span>
                  </div>
                  <p className="text-gray-400 text-sm">거리</p>
                </div>

                {/* 런닝 상태 메시지 */}
                <div className="text-center py-4">
                  {isCompleted ? (
                    <div>
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-green-400 font-bold">🎉 완주 성공!</p>
                    </div>
                  ) : isPaused ? (
                    <div>
                      <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Pause className="w-8 h-8 text-black" />
                      </div>
                      <p className="text-yellow-400">런닝이 일시정지되었습니다</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-16 h-16 bg-[#00FF88] rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                        <div className="w-4 h-4 bg-black rounded-full animate-ping"></div>
                      </div>
                      <p className="text-[#00FF88]">런닝 중입니다! 화이팅! 💪</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 런닝 컨트롤 */}
            {isActiveRunning && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button 
                  onClick={pauseRunning}
                  className={`${
                    isPaused ? 'bg-[#00FF88] text-black' : 'bg-yellow-500 text-black'
                  } font-bold px-6 py-4 rounded-2xl flex items-center gap-2 transition-all duration-300`}
                >
                  {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
                  {isPaused ? '재개' : '일시정지'}
                </button>
                
                <button 
                  onClick={stopRunning}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-4 rounded-2xl flex items-center gap-2 transition-all duration-300"
                >
                  <Square className="w-5 h-5" />
                  종료
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default function RunningStartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    }>
      <RunningStartContent />
    </Suspense>
  )
}
