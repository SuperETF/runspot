'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import RunningMap from '@/components/common/RunningMap'
import NavigationGuide from '@/components/common/NavigationGuide'
import { useRunningSession } from '@/hooks/useRunningSession'
import { useRunningStore } from '@/stores/runningStore'
import { backgroundGPSTracker, type TrackingSession } from '@/services/backgroundGPSTracker'
import { verifyGPSSession, type VerificationResult } from '@/services/gpsVerification'
import { generateKakaoBicycleNavUrl, generateKakaoWebFallbackUrl, getRouteInfo } from '@/services/routeOptimization'
import { getCourse } from '@/lib/courses'
import RunningHeader from './components/RunningHeader'
import StartPointGuide from './components/StartPointGuide'
import RunningStats from './components/RunningStats'
import RunningControls from './components/RunningControls'
import ScreenshotVerification from './components/ScreenshotVerification'

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

  // 백그라운드 GPS 추적 상태
  const [backgroundTracking, setBackgroundTracking] = useState<{
    isActive: boolean
    sessionId: string | null
    session: TrackingSession | null
  }>({
    isActive: false,
    sessionId: null,
    session: null
  })

  // 검증 결과 상태
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [showVerificationUI, setShowVerificationUI] = useState(false)
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)
  
  // 카카오맵 네비게이션 상태
  const [kakaoNavActive, setKakaoNavActive] = useState(false)

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

  // 페이지 로드 시 기존 GPS 세션 복구
  useEffect(() => {
    const recoverGPSSession = () => {
      const recoveredSession = backgroundGPSTracker.recoverSession()
      
      if (recoveredSession && recoveredSession.isActive) {
        setBackgroundTracking({
          isActive: true,
          sessionId: recoveredSession.id,
          session: recoveredSession
        })
        console.log('🔄 GPS 세션 복구:', recoveredSession.id)
      }
    }

    recoverGPSSession()
  }, [])

  // 네비게이션 준비 콜백
  const handleNavigationReady = (startNav: () => void, stopNav: () => void, isNavMode: boolean) => {
    setNavigationFunctions({
      startNav,
      stopNav,
      isNavMode
    })
    console.log('🎯 네비게이션 함수 준비 완료:', { startNav: !!startNav, stopNav: !!stopNav, isNavMode })
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
    
    console.log('🎯 메인 페이지 시작점 상태 업데이트:', {
      시작점도착: isAtStart,
      거리: `${(distance * 1000).toFixed(0)}m`
    })
  }

  // 런닝 시작 핸들러
  const handleStartRunning = async () => {
    if (!course) return

    // 시작점 조건 재확인
    if (!isAtStartPoint) {
      alert('시작점에서 50m 이내에 있어야 런닝을 시작할 수 있습니다.')
      return
    }

    startRunning(course)
    
    // 백그라운드 GPS 추적 시작 (카카오맵 사용을 위해)
    try {
      const sessionId = await backgroundGPSTracker.startTracking(course.id)
      setBackgroundTracking({
        isActive: true,
        sessionId,
        session: null
      })
      console.log('🎯 런닝 시작: 백그라운드 GPS 추적 시작:', sessionId)
    } catch (error) {
      console.error('백그라운드 GPS 추적 시작 실패:', error)
    }

    // 전체 GPX 경로를 카카오맵 자전거 네비게이션으로 실행
    if (course.gps_route && course.gps_route.length > 0 && userLocation) {
      // 경로 정보 출력
      const routeInfo = getRouteInfo(course.gps_route)
      console.log('🗺️ 경로 정보:', {
        총거리: `${(routeInfo.totalDistance / 1000).toFixed(2)}km`,
        예상시간: `${routeInfo.estimatedDuration}분`,
        포인트수: routeInfo.waypointCount
      })
      
      // 전체 GPX 경로를 포함한 카카오맵 네비게이션 URL 생성
      const fullRouteNavUrl = generateKakaoBicycleNavUrl(userLocation, course.gps_route, true)
      const fallbackUrl = generateKakaoWebFallbackUrl(course.gps_route)
      
      console.log('🚴‍♂️ 전체 경로 카카오맵 네비게이션 실행:', fullRouteNavUrl)
      
      // 모바일 앱에서는 카카오맵 앱 직접 호출
      if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
        // React Native WebView 환경
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'OPEN_KAKAO_NAV',
          url: fullRouteNavUrl,
          fallbackUrl: fallbackUrl
        }))
      } else {
        // 웹 환경에서는 새 창으로 열기
        window.open(fullRouteNavUrl, '_blank')
      }
      
      // 카카오맵 네비게이션 활성화 상태 설정
      setKakaoNavActive(true)
    }
    
    // RunSpot 내부 1인칭 네비게이션 모드도 활성화 (백업용)
    setTimeout(() => {
      if (navigationFunctions?.startNav) {
        navigationFunctions.startNav()
        console.log('🎯 RunSpot 1인칭 네비게이션 모드 활성화')
      }
    }, 1000)
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


  // 스크린샷 인증 완료 처리
  const handleScreenshotVerificationComplete = (result: any) => {
    console.log('📸 스크린샷 인증 완료:', result)
    
    // 성공한 경우 런닝 완료 처리
    if (result.verified) {
      // TODO: 실제 런닝 완료 로직 구현
      alert(`완주 인증 완료!\n거리: ${result.extractedData.distance}\n시간: ${result.extractedData.duration}`)
      
      // 모달 닫기
      setShowScreenshotModal(false)
      setShowVerificationUI(false)
      
      // 홈으로 이동 또는 결과 페이지로 이동
      // router.push('/running/result')
    }
  }

  // 백그라운드 GPS 추적 중단 및 데이터 수집
  const handleStopBackgroundTracking = () => {
    if (!backgroundTracking.isActive) return null

    const completedSession = backgroundGPSTracker.stopTracking()
    
    setBackgroundTracking({
      isActive: false,
      sessionId: null,
      session: completedSession
    })

    console.log('🛑 백그라운드 GPS 추적 중단:', completedSession)
    return completedSession
  }

  // 앱으로 돌아왔을 때 자동 완주 검증 시도
  const attemptAutoVerification = (session: TrackingSession) => {
    if (!session || !course) return false

    console.log('🔍 자동 완주 검증 시도:', {
      sessionId: session.id,
      pointCount: session.gpsPoints.length,
      duration: session.endTime ? session.endTime - session.startTime : 0
    })

    // GPS 데이터 검증 실행
    const verification = verifyGPSSession(session, course)
    setVerificationResult(verification)
    
    console.log('📊 검증 결과:', {
      confidence: verification.confidence,
      recommendation: verification.recommendation,
      issues: verification.issues,
      metrics: verification.metrics
    })

    // 검증 결과에 따른 처리
    switch (verification.recommendation) {
      case 'AUTO_APPROVE':
        console.log('✅ 자동 인증 성공')
        setShowVerificationUI(true)
        return true
        
      case 'MANUAL_REVIEW':
        console.log('⚠️ 수동 검토 필요')
        setShowVerificationUI(true)
        return false
        
      case 'SCREENSHOT_REQUIRED':
        console.log('❌ 스크린샷 인증 필요')
        setShowVerificationUI(true)
        return false
        
      default:
        return false
    }
  }

  // 카카오맵으로 시작점까지 길찾기
  const handleNavigateToStart = async () => {
    if (!course?.gps_route || course.gps_route.length === 0) {
      alert('코스 정보가 없습니다.')
      return
    }

    const startPoint = course.gps_route[0]
    
    // 백그라운드 GPS 추적 시작
    try {
      const sessionId = await backgroundGPSTracker.startTracking(course.id)
      setBackgroundTracking({
        isActive: true,
        sessionId,
        session: null
      })
      console.log('🎯 백그라운드 GPS 추적 시작:', sessionId)
    } catch (error) {
      console.error('백그라운드 GPS 추적 시작 실패:', error)
      // GPS 추적 실패해도 카카오맵은 열어줌
    }
    
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

        {/* 카카오맵 네비게이션 상태 */}
        {kakaoNavActive && isRunning && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-green-800">🚴‍♂️ 카카오맵 네비게이션 진행 중</p>
                <p className="text-xs text-green-600">전체 GPX 경로로 네비게이션이 실행되었습니다</p>
              </div>
            </div>
          </div>
        )}

        {/* 백그라운드 GPS 추적 상태 */}
        {backgroundTracking.isActive && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-blue-800">백그라운드 GPS 추적 중</p>
                <p className="text-xs text-blue-600">카카오맵에서 런닝 후 돌아오면 자동으로 기록됩니다</p>
              </div>
              <button
onClick={() => {
                  const session = handleStopBackgroundTracking()
                  if (session) {
                    attemptAutoVerification(session)
                    setKakaoNavActive(false) // 네비게이션 상태도 종료
                  }
                }}
                className="ml-auto text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg"
              >
                완주 확인
              </button>
            </div>
          </div>
        )}

        {/* 검증 결과 UI */}
        {showVerificationUI && verificationResult && (
          <div className="mb-6">
            {verificationResult.recommendation === 'AUTO_APPROVE' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h3 className="text-lg font-bold text-green-800 mb-2">완주 인증 완료!</h3>
                  <p className="text-sm text-green-600 mb-4">
                    GPS 데이터 분석 결과 완주가 확인되었습니다
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-600">거리</p>
                      <p className="font-bold text-green-700">{verificationResult.metrics.distance.toFixed(2)}km</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-600">신뢰도</p>
                      <p className="font-bold text-green-700">{(verificationResult.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {verificationResult.recommendation === 'MANUAL_REVIEW' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-bold text-yellow-800 mb-2">검토 중</h3>
                  <p className="text-sm text-yellow-600 mb-4">
                    GPS 데이터에 일부 문제가 있어 검토가 필요합니다
                  </p>
                  <div className="text-xs text-yellow-700 mb-4">
                    <p className="font-medium mb-2">발견된 문제:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {verificationResult.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    onClick={() => setShowScreenshotModal(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    스크린샷으로 인증하기
                  </button>
                </div>
              </div>
            )}

            {verificationResult.recommendation === 'SCREENSHOT_REQUIRED' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📸</span>
                  </div>
                  <h3 className="text-lg font-bold text-red-800 mb-2">스크린샷 인증 필요</h3>
                  <p className="text-sm text-red-600 mb-4">
                    GPS 데이터만으로는 완주를 확인할 수 없습니다
                  </p>
                  <div className="text-xs text-red-700 mb-4">
                    <p className="font-medium mb-2">문제점:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {verificationResult.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    onClick={() => setShowScreenshotModal(true)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    카카오맵 완주 화면 업로드
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
          onPause={pauseRunning}
          onResume={resumeRunning}
          onStop={stopRunning}
        />

        {/* 스크린샷 인증 모달 */}
        {showScreenshotModal && (
          <ScreenshotVerification
            onClose={() => setShowScreenshotModal(false)}
            onVerificationComplete={handleScreenshotVerificationComplete}
          />
        )}
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
