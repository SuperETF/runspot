'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import KakaoMapWrapper from '@/components/common/KakaoMapWrapper'
import NavigationGuide from '@/components/common/NavigationGuide'

// RunningMap Advanced 버전을 dynamic import로 처리
const RunningMap = dynamic(() => import('@/components/common/RunningMapAdvanced'), {
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
import { useRunningSession } from '@/hooks/useRunningSession'
import { useRunningStore } from '@/stores/runningStore'
// 카카오맵 외부 연동 제거 - 순수 웹 내 위치 추적만 사용
import { 
  checkCompletion,
  type RunningRecord,
  type RunningProgress
} from '@/utils/runningNavigation'
import { saveRunningLog } from '@/lib/runningLogs'
import { useAuthStore } from '@/stores/authStore'
import { getCourse } from '@/lib/courses'
import RunningHeader from './components/RunningHeader'
import StartPointGuide from './components/StartPointGuide'
import RunningStats from './components/RunningStats'
import RunningControls from './components/RunningControls'

function RunningStartContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  
  // 사용자 정보
  const user = useAuthStore((state) => state.user)
  
  // 런닝 세션 관리 훅 사용
  const {
    isRunning,
    isPaused, 
    isCompleted,
    startRunning,
    pauseRunning,
    resumeRunning,
    stopRunning
  } = useRunningSession()
  
  // 위치 및 코스 상태
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isAtStartPoint, setIsAtStartPoint] = useState(false)
  const [distanceToStart, setDistanceToStart] = useState<number | null>(null)
  const [course, setCourse] = useState<any>(null)
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0)
  const [passedCheckpoints, setPassedCheckpoints] = useState<number[]>([])
  
  // 런닝 추적 상태
  const [isTrackingLocation, setIsTrackingLocation] = useState(false)
  const [trackingWatchId, setTrackingWatchId] = useState<number | null>(null)
  const [userPath, setUserPath] = useState<{lat: number, lng: number, timestamp: number}[]>([])
  
  // 카카오맵 외부 네비게이션 모달 제거
  
  // 런닝 네비게이션: 진행률 상태
  const [courseProgress, setCourseProgress] = useState<RunningProgress | null>(null)
  
  // 런닝 기록 (완주 인증용)
  const [runningRecords, setRunningRecords] = useState<RunningRecord[]>([])
  const [completionResult, setCompletionResult] = useState<{
    isCompleted: boolean
    reason?: string
    stats: any
  } | null>(null)
  
  // 전체 화면 모드 상태
  const [isFullscreenMode, setIsFullscreenMode] = useState(false)

  // 런닝 스토어에서 통계 가져오기
  const duration = useRunningStore((state) => state.currentStats.duration)
  const distance = useRunningStore((state) => state.currentStats.distance)
  const pace = useRunningStore((state) => state.currentStats.pace)
  const setCourseData = useRunningStore((state) => state.setCourseData)

  // UI 모드 계산
  const isPreRunning = !isRunning && course && !isCompleted
  const isActiveRunning = isRunning && !isCompleted

  // 코스 로드
  useEffect(() => {
    if (courseId) {
      const loadCourse = async () => {
        try {
          const courseData = await getCourse(courseId)
          setCourse(courseData)
          if (courseData) {
            setCourseData(courseData as any)
            console.log('✅ 코스 데이터를 스토어에 저장:', (courseData as any).name)
          }
        } catch (error) {
          console.error('코스 로드 실패:', error)
        }
      }
      loadCourse()
    }
  }, [courseId, setCourseData])

  // 위치 추적 시작
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation이 지원되지 않습니다')
      return
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now()
        }
        
        setUserPath(prev => [...prev, newPoint])
        
        // RunningStore에도 위치 업데이트
        const currentPos = { lat: newPoint.lat, lng: newPoint.lng }
        setUserLocation(currentPos)
        
        console.log('📍 위치 추적:', newPoint)
      },
      (error) => {
        console.error('위치 추적 오류:', error)
      },
      options
    )

    setTrackingWatchId(watchId)
    setIsTrackingLocation(true)
    console.log('🎯 백그라운드 위치 추적 시작')
  }

  // 위치 추적 중지
  const stopLocationTracking = () => {
    if (trackingWatchId) {
      navigator.geolocation.clearWatch(trackingWatchId)
      setTrackingWatchId(null)
      setIsTrackingLocation(false)
      console.log('🛑 백그라운드 위치 추적 중지')
    }
  }

  // 완주 인증 로직 (고도화된 버전)
  const checkAdvancedCompletion = () => {
    if (runningRecords.length === 0) {
      return {
        isCompleted: false,
        reason: '런닝 기록이 없습니다',
        stats: { maxProgress: 0, totalTime: 0, offCourseTime: 0, onCoursePercent: 0 }
      }
    }

    // 완주 인증 기준 설정
    const criteria = {
      minProgressPercent: 90,    // 90% 이상 진행
      maxOffCourseTime: 300,     // 최대 5분 이탈 허용
      minTotalTime: 300,         // 최소 5분 (너무 빠르면 의심)
      maxTotalTime: 7200         // 최대 2시간
    }

    const result = checkCompletion(runningRecords, criteria)
    setCompletionResult(result)
    
    if (result.isCompleted) {
      console.log('🎉 완주 인증 성공!', {
        최대진행률: `${result.stats.maxProgress.toFixed(1)}%`,
        총소요시간: `${Math.round(result.stats.totalTime / 60)}분`,
        코스준수율: `${result.stats.onCoursePercent.toFixed(1)}%`,
        총기록수: runningRecords.length
      })
    } else {
      console.log('❌완주 인증 실패:', result.reason)
    }

    return result
  }

  // 경로 총 거리 계산
  const calculateTotalPathDistance = (path: {lat: number, lng: number}[]) => {
    if (path.length < 2) return 0
    
    let totalDistance = 0
    for (let i = 1; i < path.length; i++) {
      totalDistance += calculateDistance(path[i-1], path[i])
    }
    return totalDistance
  }

  // Haversine 거리 계산 (km 단위)
  const calculateDistance = (point1: {lat: number, lng: number}, point2: {lat: number, lng: number}) => {
    const R = 6371 // 지구 반지름 (km)
    const dLat = (point2.lat - point1.lat) * Math.PI / 180
    const dLng = (point2.lng - point1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // 시작점 상태 변경 콜백
  const handleStartPointStatusChange = (isAtStart: boolean, distance: number) => {
    setIsAtStartPoint(isAtStart)
    setDistanceToStart(distance)
    
    console.log('🎯 메인 페이지 시작점 상태 업데이트:', {
      시작점도착: isAtStart,
      거리: `${(distance * 1000).toFixed(0)}m`
    })
  }

  // 전체 화면 종료 이벤트 리스너
  useEffect(() => {
    const handleExitFullscreen = () => {
      setIsFullscreenMode(false)
      console.log('📱 전체 화면 모드 종료 - 런닝 코스 페이지로 이동')
      
      // 런닝이 진행 중이면 종료 확인
      if (isRunning) {
        const confirmExit = confirm('런닝을 종료하고 코스 페이지로 이동하시겠습니까?')
        if (confirmExit) {
          stopLocationTracking()
          stopRunning()
          setTimeout(() => {
            router.push('/running')
          }, 500)
        } else {
          // 사용자가 취소하면 전체 화면 모드 다시 활성화
          setIsFullscreenMode(true)
        }
      } else {
        // 런닝이 진행 중이 아니면 바로 이동
        router.push('/running')
      }
    }

    window.addEventListener('exitFullscreen', handleExitFullscreen)
    
    return () => {
      window.removeEventListener('exitFullscreen', handleExitFullscreen)
    }
  }, [isRunning, router])

  // 런닝 시작 핸들러 (단순화)
  const handleStartRunning = async () => {
    if (!course) return

    // 시작점 조건 재확인
    if (!isAtStartPoint) {
      alert('시작점에서 50m 이내에 있어야 런닝을 시작할 수 있습니다.')
      return
    }

    if (!userLocation) {
      alert('현재 위치를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    console.log('🏃‍♂️ 런닝 시작 - 웹 내 위치 추적 모드')
    
    try {
      // 런닝 세션 시작
      startRunning(course)
      
      // 백그라운드 위치 추적 시작
      startLocationTracking()
      
      // 전체 화면 모드로 전환
      setIsFullscreenMode(true)
      
      console.log('✅ 런닝 시작 완료 - 전체 화면 네비게이션 모드')
      
      // 간단한 안내 메시지
      setTimeout(() => {
        alert('🏃‍♂️ 런닝이 시작되었습니다!\n\n• 지도 위의 초록색 라인을 따라 뛰세요\n• 우상단 X 버튼으로 전체 화면을 종료할 수 있습니다\n• 코스에서 벗어나면 알림이 표시됩니다')
      }, 500) // 전체 화면 전환 후 안내
      
    } catch (error) {
      console.error('❌ 런닝 시작 실패:', error)
      alert('런닝을 시작할 수 없습니다. 다시 시도해주세요.')
    }
  }

  // 뒤로가기 핸들러
  const handleBack = () => {
    // 전체 화면 모드일 때는 전체 화면 종료 이벤트 발생
    if (isFullscreenMode) {
      const event = new CustomEvent('exitFullscreen')
      window.dispatchEvent(event)
      return
    }
    
    // 일반 모드에서는 기존 로직
    if (isTrackingLocation) {
      stopLocationTracking()
    }
    router.back()
  }

  // 카카오맵 외부 네비게이션 실행 함수 제거

  // 런닝 종료 시 완주 인증 및 기록 저장
  const handleStopRunning = async () => {
    const completionCheck = checkAdvancedCompletion()
    
    if (completionCheck.isCompleted) {
      alert(`🎉 완주를 축하합니다!\n\n` +
            `📊 완주 통계:\n` +
            `• 진행률: ${completionCheck.stats.maxProgress.toFixed(1)}%\n` +
            `• 소요시간: ${Math.round(completionCheck.stats.totalTime / 60)}분\n` +
            `• 코스 준수율: ${completionCheck.stats.onCoursePercent.toFixed(1)}%`)
    } else {
      const confirmStop = confirm(`완주 조건을 만족하지 않았습니다.\n\n` +
                                `사유: ${completionCheck.reason}\n\n` +
                                `그래도 런닝을 종료하시겠습니까?`)
      if (!confirmStop) return
    }
    
    // 런닝 기록 저장
    if (user && course && runningRecords.length > 0) {
      try {
        const totalDistance = calculateTotalPathDistance(userPath)
        const totalDuration = completionCheck.stats.totalTime // 초 단위
        const avgSpeed = totalDistance > 0 ? (totalDistance / (totalDuration / 3600)) : 0 // km/h
        const calories = Math.round(totalDistance * 60) // 대략적인 칼로리 계산
        
        // GPS 경로 데이터 변환
        const gpsPath = userPath.map(point => ({
          lat: point.lat,
          lng: point.lng,
          timestamp: new Date(point.timestamp).toISOString()
        }))
        
        const savedLog = await saveRunningLog({
          userId: user.id,
          courseId: course.id,
          distance: totalDistance,
          duration: totalDuration,
          avgSpeed: avgSpeed,
          calories: calories,
          gpsPath: gpsPath,
          isCompleted: completionCheck.isCompleted
        })
        
        if (savedLog) {
          console.log('✅ 런닝 기록 저장 완료:', savedLog)
        } else {
          console.error('❌ 런닝 기록 저장 실패')
        }
      } catch (error) {
        console.error('❌ 런닝 기록 저장 중 오류:', error)
      }
    }
    
    // 전체 화면 모드 해제
    setIsFullscreenMode(false)
    
    stopLocationTracking()
    stopRunning()
    
    console.log('📊 런닝 종료 - 완주 인증 결과:', completionCheck)
    
    // 런닝 코스 페이지로 이동
    setTimeout(() => {
      router.push('/running')
    }, 1500) // 1.5초 후 이동 (저장 완료 후)
  }


  // 시작점까지 길찾기 (간단한 카카오맵 링크)
  const handleNavigateToStart = () => {
    if (!course?.gps_route || course.gps_route.length === 0) {
      alert('코스 정보가 없습니다.')
      return
    }

    const startPoint = course.gps_route[0]
    const kakaoMapUrl = `https://map.kakao.com/link/to/런닝 시작점,${startPoint.lat},${startPoint.lng}`
    window.open(kakaoMapUrl, '_blank')
    
    console.log('🗺️ 시작점 길찾기:', kakaoMapUrl)
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
    <KakaoMapWrapper>
      <div className="min-h-screen bg-black text-white">
      {/* 전체 화면 모드가 아닐 때만 헤더 표시 */}
      {!isFullscreenMode && (
        <RunningHeader
          courseName={course.name}
          courseArea={course.area}
          voiceEnabled={false}
          onBack={handleBack}
          onToggleVoice={() => {}}
        />
      )}

      <div className={isFullscreenMode ? "" : "p-4"}>
        {/* 지도 */}
        <div className="mb-6">
          {isPreRunning ? (
            <RunningMap
              isRunning={false}
              userLocation={userLocation}
              showStartPoint={true}
              onLocationUpdate={setUserLocation}
              onStartPointStatusChange={handleStartPointStatusChange}
              mode="waiting"
            />
          ) : isActiveRunning ? (
            <RunningMap
              isRunning={true}
              userLocation={userLocation}
              showStartPoint={false}
              onProgressUpdate={(progress) => {
                setCourseProgress(progress)
              }}
              onRecordUpdate={(record) => {
                setRunningRecords(prev => [...prev, record])
              }}
              onLocationUpdate={setUserLocation}
              onPause={pauseRunning}
              onResume={resumeRunning}
              onStop={handleStopRunning}
              isPaused={isPaused}
              mode={isFullscreenMode ? "running" : "preview"}
            />
          ) : (
            <RunningMap
              isRunning={false}
              userLocation={userLocation}
              showStartPoint={false}
              isCompleted={true}
              onLocationUpdate={setUserLocation}
              mode="preview"
            />
          )}
        </div>

        {/* 전체 화면 모드가 아닐 때만 표시되는 UI 요소들 */}
        {!isFullscreenMode && (
          <>
            {/* 시작점 가이드 */}
            {isPreRunning && (
              <StartPointGuide
                isAtStartPoint={isAtStartPoint}
                distanceToStart={distanceToStart}
                onStartRunning={handleStartRunning}
                onNavigateToStart={handleNavigateToStart}
              />
            )}

            {/* 런닝 통계 */}
            {(isActiveRunning || isCompleted) && (
              <RunningStats
                duration={duration}
                distance={distance}
                pace={pace}
                courseProgress={courseProgress}
              />
            )}

            {/* 위치 추적 상태 표시 */}
            {isActiveRunning && isTrackingLocation && (
              <div className="mb-6">
                <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="text-foreground">
                      <div className="text-sm font-medium">위치 추적 중</div>
                      <div className="text-xs text-muted-foreground">
                        추적 포인트: {userPath.length}개 | 총 거리: {calculateTotalPathDistance(userPath).toFixed(2)}km
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 런닝 컨트롤 */}
            <RunningControls
              isRunning={isRunning}
              isPaused={isPaused}
              isCompleted={isCompleted}
              onPause={pauseRunning}
              onResume={resumeRunning}
              onStop={handleStopRunning}
            />
          </>
        )}

        {/* 카카오맵 외부 네비게이션 모달 제거 - 순수 웹 내 추적만 사용 */}

      </div>
      </div>
    </KakaoMapWrapper>
  )
}

export default function RunningStartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <RunningStartContent />
    </Suspense>
  )
}
