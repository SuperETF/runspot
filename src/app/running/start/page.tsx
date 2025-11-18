'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import RunningMap from '@/components/common/RunningMap'
import NavigationGuide from '@/components/common/NavigationGuide'
import { useRunningStore } from '@/stores/runningStore'
import { getCourse } from '@/lib/courses'

// 새로운 컴포넌트들 import
import RunningHeader from './components/RunningHeader'
import StartPointGuide from './components/StartPointGuide'
import RunningStats from './components/RunningStats'
import RunningControls from './components/RunningControls'

// 커스텀 훅 import
import { useRunningSession } from '@/hooks/useRunningSession'

function RunningStartContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  
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
  
  // 네비게이션 상태
  const [navigationFunctions, setNavigationFunctions] = useState<{
    startNav: () => void
    stopNav: () => void
    isNavMode: boolean
  } | null>(null)
  
  // 실시간 네비게이션 데이터
  const [currentNavigationState, setCurrentNavigationState] = useState<any>(null)
  
  // 음성 안내 상태
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  
  // 1인칭 추적 모드 상태
  const [isFirstPersonMode, setIsFirstPersonMode] = useState(false)

  // 런닝 스토어에서 통계 가져오기
  const duration = useRunningStore((state) => state.currentStats.duration)
  const distance = useRunningStore((state) => state.currentStats.distance)
  const pace = useRunningStore((state) => state.currentStats.pace)
  const setCourseData = useRunningStore((state) => state.setCourseData)

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

  // 네비게이션 준비 콜백
  const handleNavigationReady = (functions: any) => {
    setNavigationFunctions(functions)
  }

  // 네비게이션 업데이트 콜백
  const handleNavigationUpdate = (state: any) => {
    setCurrentNavigationState(state)
    if (state?.isFirstPersonMode !== undefined) {
      setIsFirstPersonMode(state.isFirstPersonMode)
    }
  }

  // 시작점 상태 변경 콜백
  const handleStartPointStatusChange = (isAtStart: boolean, distance: number) => {
    setIsAtStartPoint(isAtStart)
    setDistanceToStart(distance)
  }

  // 런닝 시작 핸들러
  const handleStartRunning = () => {
    if (course) {
      startRunning(course)
    }
  }

  // 뒤로가기 핸들러
  const handleBack = () => {
    if (isFirstPersonMode && navigationFunctions?.stopNav) {
      navigationFunctions.stopNav()
    } else {
      router.back()
    }
  }

  // 음성 안내 토글
  const handleToggleVoice = () => {
    setVoiceEnabled(!voiceEnabled)
  }

  // 카카오맵으로 시작점까지 길찾기
  const handleNavigateToStart = () => {
    if (!course?.gps_route || course.gps_route.length === 0) {
      alert('코스 정보가 없습니다.')
      return
    }

    const startPoint = course.gps_route[0]
    
    // 모바일 앱용 카카오맵 네이티브 연동
    if (userLocation) {
      // 카카오맵 앱으로 길찾기 (출발지: 현재위치, 도착지: 시작점)
      const kakaoNavUrl = `kakaomap://route?sp=${userLocation.lat},${userLocation.lng}&ep=${startPoint.lat},${startPoint.lng}&by=FOOT`
      
      // 모바일 앱에서는 카카오맵 앱 직접 호출
      if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
        // React Native WebView 환경
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'OPEN_KAKAO_NAV',
          url: kakaoNavUrl,
          fallbackUrl: `https://map.kakao.com/link/to/런닝 시작점,${startPoint.lat},${startPoint.lng}`
        }))
      } else {
        // 웹 환경에서는 fallback URL 사용
        const fallbackUrl = `https://map.kakao.com/link/to/런닝 시작점,${startPoint.lat},${startPoint.lng}`
        window.open(fallbackUrl, '_blank')
      }
      
      console.log('🗺️ 카카오맵 네비게이션:', kakaoNavUrl)
    } else {
      // 현재 위치를 가져온 후 경로 설정
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            
            // 카카오맵 앱으로 길찾기
            const kakaoNavUrl = `kakaomap://route?sp=${currentPos.lat},${currentPos.lng}&ep=${startPoint.lat},${startPoint.lng}&by=FOOT`
            
            if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
              // React Native WebView 환경
              (window as any).ReactNativeWebView.postMessage(JSON.stringify({
                type: 'OPEN_KAKAO_NAV',
                url: kakaoNavUrl,
                fallbackUrl: `https://map.kakao.com/link/to/런닝 시작점,${startPoint.lat},${startPoint.lng}`
              }))
            } else {
              // 웹 환경에서는 fallback URL 사용
              const fallbackUrl = `https://map.kakao.com/link/to/런닝 시작점,${startPoint.lat},${startPoint.lng}`
              window.open(fallbackUrl, '_blank')
            }
            
            console.log('🗺️ 카카오맵 네비게이션 (위치 획득 후):', kakaoNavUrl)
          },
          (error) => {
            console.error('현재 위치 가져오기 실패:', error)
            // 위치를 가져올 수 없으면 도착지만 표시
            const kakaoMapUrl = `https://map.kakao.com/link/to/런닝 시작점,${startPoint.lat},${startPoint.lng}`
            window.open(kakaoMapUrl, '_blank')
          }
        )
      } else {
        // Geolocation을 지원하지 않으면 도착지만 표시
        const kakaoMapUrl = `https://map.kakao.com/link/to/런닝 시작점,${startPoint.lat},${startPoint.lng}`
        window.open(kakaoMapUrl, '_blank')
      }
    }
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
      {/* 헤더 */}
      <RunningHeader
        courseName={course.name}
        courseArea={course.area}
        voiceEnabled={voiceEnabled}
        onBack={handleBack}
        onToggleVoice={handleToggleVoice}
      />

      <div className="p-4">
        {/* 지도 */}
        <div className="mb-6">
          {isPreRunning ? (
            <RunningMap
              isRunning={false}
              userLocation={userLocation}
              showStartPoint={true}
              currentCheckpoint={0}
              passedCheckpoints={[]}
              isCompleted={false}
              onLocationUpdate={setUserLocation}
              onStartPointStatusChange={handleStartPointStatusChange}
              hideFloatingNavigation={true}
              mode="waiting"
            />
          ) : isActiveRunning ? (
            <RunningMap
              isRunning={true}
              userLocation={userLocation}
              showStartPoint={false}
              currentCheckpoint={currentCheckpoint}
              passedCheckpoints={passedCheckpoints}
              isCompleted={isCompleted}
              onNavigationReady={handleNavigationReady}
              onLocationUpdate={setUserLocation}
              onNavigationUpdate={handleNavigationUpdate}
              voiceGuidanceEnabled={voiceEnabled}
              mode="running"
            />
          ) : (
            <RunningMap
              isRunning={false}
              userLocation={userLocation}
              showStartPoint={false}
              currentCheckpoint={0}
              passedCheckpoints={[]}
              isCompleted={true}
              onLocationUpdate={setUserLocation}
              mode="preview"
            />
          )}
        </div>

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
          />
        )}

        {/* 네비게이션 가이드 */}
        {isActiveRunning && isNavigationMode && course?.gps_route && userLocation && (
          <div className="mb-6">
            <NavigationGuide
              courseRoute={course.gps_route}
              currentCheckpoint={currentCheckpoint}
              userLocation={userLocation}
              isRunning={isRunning}
              onCheckpointReached={(checkpoint) => {
                setCurrentCheckpoint(checkpoint)
                setPassedCheckpoints(prev => [...prev, checkpoint])
              }}
            />
          </div>
        )}

        {/* 런닝 컨트롤 */}
        <RunningControls
          isRunning={isRunning}
          isPaused={isPaused}
          isCompleted={isCompleted}
          onStart={handleStartRunning}
          onPause={pauseRunning}
          onResume={resumeRunning}
          onStop={stopRunning}
        />
      </div>
    </div>
  )
}

export default function RunningStartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF88]"></div>
      </div>
    }>
      <RunningStartContent />
    </Suspense>
  )
}
