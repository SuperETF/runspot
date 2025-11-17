'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { ArrowLeft, Play, Pause, Square, MapPin, Clock, Zap, Heart, Navigation, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import RunningMap from '@/components/common/RunningMap'
import NavigationGuide from '@/components/common/NavigationGuide'
import { useRunningStore } from '@/stores/runningStore'
import { getCourse } from '@/lib/courses'

function RunningStartContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [time, setTime] = useState(0) // 초 단위 (UI용 로컬 타이머)
  const [distance, setDistance] = useState(0) // km (runningStore와 동기화)
  const [pace, setPace] = useState(0) // 분/km (runningStore와 동기화)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isAtStartPoint, setIsAtStartPoint] = useState(false)
  const [distanceToStart, setDistanceToStart] = useState<number | null>(null)
  const [course, setCourse] = useState<any>(null)
  const [showStartPointGuide, setShowStartPointGuide] = useState(true)
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0) // 현재 체크포인트 인덱스
  const [passedCheckpoints, setPassedCheckpoints] = useState<number[]>([]) // 통과한 체크포인트들
  const [isCompleted, setIsCompleted] = useState(false) // 완주 여부
  const [completionTime, setCompletionTime] = useState<number | null>(null) // 완주 시간
  
  // 네비게이션 관련 상태
  const [navigationFunctions, setNavigationFunctions] = useState<{
    startNav: () => void
    stopNav: () => void
    isNavMode: boolean
  } | null>(null)
  
  const [isSaving, setIsSaving] = useState(false) // 저장 중 상태
  const [saveSuccess, setSaveSuccess] = useState(false) // 저장 성공 여부
  const [runningResult, setRunningResult] = useState<any>(null) // 런닝 결과 데이터
  const [showCompletionModal, setShowCompletionModal] = useState(false) // 완주 모달
  const [showResultModal, setShowResultModal] = useState(false) // 결과 모달
  const [showSaveModal, setShowSaveModal] = useState(false) // 저장 완료 모달

  const trackingState = useRunningStore((state) => state.trackingState)
  const currentStats = useRunningStore((state) => state.currentStats)
  const sessionStartTime = useRunningStore((state) => state.sessionStartTime)
  const pausedTime = useRunningStore((state) => state.pausedTime)
  const startTracking = useRunningStore((state) => state.startTracking)
  const pauseTrackingStore = useRunningStore((state) => state.pauseTracking)
  const resumeTrackingStore = useRunningStore((state) => state.resumeTracking)
  const stopTrackingStore = useRunningStore((state) => state.stopTracking)
  const completeTracking = useRunningStore((state) => state.completeTracking)
  const updatePosition = useRunningStore((state) => state.updatePosition)
  const setCourseData = useRunningStore((state) => state.setCourseData)
  const clearUserPath = useRunningStore((state) => state.clearUserPath)

  // 네비게이션 준비 콜백 (안정적인 참조를 위해 최상위에 정의)
  const handleNavigationReady = useCallback((startNav: () => void, stopNav: () => void, isNavMode: boolean) => {
    setNavigationFunctions({ startNav, stopNav, isNavMode })
  }, [])

  // 실제 경과 시간 계산 함수
  const calculateActualElapsedTime = () => {
    if (!sessionStartTime) return 0
    
    const now = new Date()
    const startTime = new Date(sessionStartTime)
    const elapsedMs = now.getTime() - startTime.getTime() - (pausedTime || 0)
    return Math.max(0, Math.floor(elapsedMs / 1000))
  }

  // 새로고침 시 런닝 상태 복원
  useEffect(() => {
    if (trackingState === 'running' || trackingState === 'paused') {
      setIsRunning(true)
      setIsPaused(trackingState === 'paused')
      
      // 실제 경과 시간 계산해서 복원
      const actualElapsedTime = calculateActualElapsedTime()
      setTime(actualElapsedTime)
      
      // 저장된 통계 복원
      if (currentStats) {
        setDistance(currentStats.distance)
        setPace(currentStats.pace)
      }
    }
  }, [trackingState, currentStats, sessionStartTime, pausedTime])

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    // 이전 경로 데이터 정리
    clearUserPath()
  }, []) // 마운트 시 한 번만 실행

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 상태 정리
      setNavigationFunctions(null)
      setCourse(null)
    }
  }, [])

  // 코스 데이터 로드
  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) return

      try {
        console.log('🔍 코스 데이터 로딩 시작:', courseId)
        
        // 실제 API에서 코스 데이터 가져오기
        const courseData = await getCourse(courseId) as any
        
        if (courseData) {
          console.log('✅ 실제 코스 데이터 로드 성공:', {
            id: courseData.id,
            name: courseData.name,
            area: courseData.area,
            startPoint: courseData.gps_route?.[0],
            totalPoints: courseData.gps_route?.length || 0
          })
          
          setCourse(courseData)
          setCourseData(courseData as any)
        } else {
          // API에서 데이터를 가져오지 못한 경우 폴백
          console.warn('⚠️ 코스 데이터를 찾을 수 없음, 폴백 데이터 사용')
          const courseName = searchParams.get('courseName')
          const fallbackCourse = {
            id: courseId,
            name: courseName ? decodeURIComponent(courseName) : '코스 정보 없음',
            area: '정보 없음',
            distance: 0,
            difficulty: 'easy',
            gps_route: [
              { lat: 37.5665, lng: 126.9780 } // 서울 시청 기본 위치
            ]
          }
          
          setCourse(fallbackCourse)
          setCourseData(fallbackCourse as any)
        }
      } catch (error) {
        console.error('❌ 코스 데이터 로드 실패:', error)
        
        // 오류 발생 시 폴백 데이터
        const courseName = searchParams.get('courseName')
        const fallbackCourse = {
          id: courseId,
          name: courseName ? decodeURIComponent(courseName) : '코스 로드 실패',
          area: '정보 없음',
          distance: 0,
          difficulty: 'easy',
          gps_route: [
            { lat: 37.5665, lng: 126.9780 } // 서울 시청 기본 위치
          ]
        }
        
        setCourse(fallbackCourse)
        setCourseData(fallbackCourse as any)
      }
    }

    loadCourseData()
  }, [courseId, searchParams, setCourseData])

  // 사용자 위치 추적 (이전 코드 방식으로 단순화)
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(newLocation)
          
          // 시작점과의 거리 계산
          if (course?.gps_route?.[0]) {
            const startPoint = course.gps_route[0]
            const distance = calculateDistance(
              newLocation.lat, newLocation.lng,
              startPoint.lat, startPoint.lng
            )
            setDistanceToStart(distance)
            
            // 50m 이내면 시작점 도착으로 간주
            setIsAtStartPoint(distance <= 0.05) // 0.05km = 50m
          }

          // 런닝 중일 때 체크포인트 통과 확인
          if (isRunning && !isPaused && course?.gps_route && !isCompleted) {
            checkCheckpoints(newLocation, course.gps_route)
          }
        },
        (error) => {
          console.error('위치 추적 오류:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
      )
      
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [course, isRunning, isPaused, isCompleted])

  // 타이머 효과 - 실제 시간 기반으로 동기화
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isRunning && !isPaused && sessionStartTime) {
      interval = setInterval(() => {
        // 실제 경과 시간으로 동기화
        const actualElapsedTime = calculateActualElapsedTime()
        setTime(actualElapsedTime)
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isRunning, isPaused, sessionStartTime, pausedTime])

  // runningStore의 통계와 로컬 UI 상태 동기화
  useEffect(() => {
    if (currentStats) {
      setDistance(currentStats.distance)
      setPace(currentStats.pace)
    }
  }, [currentStats]) // 전체 currentStats 객체만 의존

  // 페이스 계산 (runningStore에서 오는 경우 제외)
  useEffect(() => {
    if (distance > 0 && time > 0 && !currentStats) {
      const paceInMinutes = (time / 60) / distance
      setPace(paceInMinutes)
    }
  }, [distance, time, currentStats])

  // isRunning 상태 변화 추적
  useEffect(() => {
    console.log('🔄 isRunning 상태 변화:', isRunning)
    console.log('🔄 navigationFunctions?.isNavMode:', navigationFunctions?.isNavMode)
  }, [isRunning, navigationFunctions?.isNavMode])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 정리 작업
      setIsRunning(false)
      setIsPaused(false)
      setShowCompletionModal(false)
      setShowResultModal(false)
      setShowSaveModal(false)
    }
  }, [])

  // 런닝 중 페이지 이탈 방지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRunning && !isCompleted) {
        e.preventDefault()
        e.returnValue = '런닝이 진행 중입니다. 페이지를 나가시겠습니까?'
        return '런닝이 진행 중입니다. 페이지를 나가시겠습니까?'
      }
    }

    if (isRunning && !isCompleted) {
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isRunning, isCompleted])

  // GPS 위치 업데이트 콜백
  const handleLocationUpdate = useCallback((location: any) => {
    console.log('GPS 위치 업데이트:', location)
  }, [])

  // GPS 거리 업데이트 콜백
  const handleDistanceUpdate = useCallback((newDistance: number) => {
    // currentStats가 있으면 runningStore에서 관리하므로 로컬 상태 업데이트 건너뛰기
    if (!currentStats) {
      setDistance(newDistance)
    }
  }, [currentStats])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatPace = (paceMinutes: number) => {
    if (paceMinutes === 0) return "0'00\""
    const minutes = Math.floor(paceMinutes)
    const seconds = Math.round((paceMinutes - minutes) * 60)
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`
  }

  const startRunning = () => {
    if (!canStartRunning()) return
    
    console.log('🏃‍♂️ 런닝 시작 함수 호출')
    setIsRunning(true)
    setIsPaused(false)
    setShowStartPointGuide(false) // 런닝 시작 시 가이드 숨기기
    console.log('✅ isRunning 상태를 true로 설정')
    
    // 런닝 시작 음성 안내
    speakMessage('런닝을 시작합니다! 화이팅!')
    
    if (course) {
      startTracking(course)
    }
  }

  const pauseRunning = () => {
    setIsPaused(!isPaused)
    if (!isPaused) {
      pauseTrackingStore()
      speakMessage('런닝을 일시정지합니다.')
    } else {
      resumeTrackingStore()
      speakMessage('런닝을 재개합니다!')
    }
  }

  const stopRunning = () => {
    if (confirm('런닝을 종료하시겠습니까?')) {
      stopTrackingStore()
      speakMessage('런닝을 종료합니다.')
      
      // 상태 정리
      setIsRunning(false)
      setIsPaused(false)
      
      // 이전 페이지로 뒤로가기 (런닝 코스 페이지)
      router.back()
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

  // 음성 안내 함수
  const speakMessage = (message: string) => {
    if ('speechSynthesis' in window) {
      // 기존 음성 중지
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(message)
      utterance.lang = 'ko-KR' // 한국어 설정
      utterance.rate = 0.9 // 말하기 속도
      utterance.pitch = 1.0 // 음성 높이
      utterance.volume = 0.8 // 볼륨
      
      window.speechSynthesis.speak(utterance)
      console.log('🔊 음성 안내:', message)
    }
  }

  // 체크포인트 통과 확인
  const checkCheckpoints = (userLocation: {lat: number, lng: number}, routePoints: Array<{lat: number, lng: number}>) => {
    // 다음 체크포인트 확인 (순서대로)
    const nextCheckpointIndex = currentCheckpoint + 1
    
    if (nextCheckpointIndex < routePoints.length) {
      const nextPoint = routePoints[nextCheckpointIndex]
      const distanceToNext = calculateDistance(
        userLocation.lat, userLocation.lng,
        nextPoint.lat, nextPoint.lng
      )
      
      // 마지막 포인트는 50m, 나머지는 30m 이내면 체크포인트 통과로 간주
      const isLastPoint = nextCheckpointIndex === routePoints.length - 1
      const requiredDistance = isLastPoint ? 0.05 : 0.03 // 마지막: 50m, 나머지: 30m
      
      if (distanceToNext <= requiredDistance) {
        const newPassedCheckpoints = [...passedCheckpoints, nextCheckpointIndex]
        setPassedCheckpoints(newPassedCheckpoints)
        setCurrentCheckpoint(nextCheckpointIndex)
        
        console.log(`체크포인트 ${nextCheckpointIndex} 통과! ${isLastPoint ? '(완주!)' : ''}`)
        
        // 음성 안내
        if (isLastPoint) {
          speakMessage('축하합니다! 완주하셨습니다!')
          handleCompletion()
        } else {
          const remainingCheckpoints = routePoints.length - 1 - nextCheckpointIndex
          speakMessage(`체크포인트 통과! ${remainingCheckpoints}개 지점이 남았습니다.`)
        }
      }
    }
  }

  // 완주 처리
  const handleCompletion = async () => {
    setIsCompleted(true)
    setCompletionTime(time)
    setIsRunning(false)
    setIsPaused(false)
    completeTracking()
    
    // 결과 데이터 저장
    const resultData = {
      courseName: course?.name || '알 수 없는 코스',
      distance: distance,
      duration: time,
      avgSpeed: distance > 0 ? (distance / (time / 3600)) : 0,
      completedAt: new Date()
    }
    setRunningResult(resultData)
    
    // 완주 축하 모달 표시
    setTimeout(() => {
      setShowCompletionModal(true)
    }, 500)
  }

  // 기록 저장 함수
  const saveRunningRecord = async () => {
    if (!runningResult) return
    
    setIsSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { getCurrentUser } = await import('@/lib/auth')
      
      const user = await getCurrentUser()
      if (user) {
        const completedAt = runningResult.completedAt
        const expiresAt = new Date(completedAt.getTime() + 2 * 60 * 60 * 1000) // 2시간 후
        
        const runningLogData = {
          user_id: user.id,
          course_id: courseId,
          distance: runningResult.distance,
          duration: runningResult.duration,
          avg_speed: runningResult.avgSpeed,
          gps_path: [], // GPS 경로 데이터 (필요시 추가)
          completed_at: completedAt.toISOString(),
          authentication_count: 0, // 초기값 0
          expires_at: expiresAt.toISOString() // 2시간 후 만료
        }
        
        const { error } = await (supabase as any)
          .from('running_logs')
          .insert([runningLogData])
        
        if (error) {
          console.error('완주 기록 저장 오류:', error)
          alert('기록 저장 중 오류가 발생했습니다. 다시 시도해주세요.')
        } else {
          console.log('완주 기록 저장 완료!')
          setSaveSuccess(true)
          setShowSaveModal(true)
        }
      }
    } catch (error) {
      console.error('완주 처리 중 오류:', error)
      alert('기록 저장 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  // 결과 확인 함수
  const viewResults = () => {
    if (!runningResult) return
    setShowResultModal(true)
  }

  // 페이지 정리 함수
  const cleanupAndExit = () => {
    // 런닝 중이면 확인 후 종료
    if (isRunning && !isCompleted) {
      if (!confirm('런닝 중입니다. 정말 나가시겠습니까?')) {
        return
      }
    }
    
    // 네비게이션 모드 먼저 종료
    if (navigationFunctions?.stopNav) {
      navigationFunctions.stopNav()
    }
    
    // 모든 상태 정리
    setIsRunning(false)
    setIsPaused(false)
    setShowCompletionModal(false)
    setShowResultModal(false)
    setShowSaveModal(false)
    
    // 세션 스토리지 정리
    sessionStorage.removeItem('selected_course')
    
    // 이전 페이지로 뒤로가기 (런닝 코스 페이지)
    router.back()
  }

  // 시작점으로 네비게이션
  const navigateToStartPoint = () => {
    if (!course?.gps_route?.[0]) return
    
    const startPoint = course.gps_route[0]
    
    if (userLocation) {
      // 현재 위치에서 시작점으로 길찾기 (음성 안내 포함)
      const url = `https://map.kakao.com/link/route/sp/${userLocation.lat},${userLocation.lng}/ep/${startPoint.lat},${startPoint.lng}?mode=car&voice=1&tts=1`
      window.open(url, '_blank')
    } else {
      // 현재 위치를 모르면 기존 방식 (도착지만 설정, 음성 안내 포함)
      const url = `https://map.kakao.com/link/to/${encodeURIComponent(course.name + ' 시작점')},${startPoint.lat},${startPoint.lng}?voice=1&tts=1`
      window.open(url, '_blank')
    }
  }

  // 런닝 시작 가능 여부 확인
  const canStartRunning = () => {
    return isAtStartPoint && !isRunning
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
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      
      {/* 상단 헤더 (전체 화면 모드가 아닐 때만 표시) */}
      {!navigationFunctions?.isNavMode && (
        <div className="relative z-10 sticky top-0 bg-black/80 backdrop-blur-xl border-b border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={cleanupAndExit}
              className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
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

      <div className={navigationFunctions?.isNavMode ? "" : "relative z-10 px-4 py-6 space-y-6"}>

      {/* GPS 지도 */}
      <div className={navigationFunctions?.isNavMode ? "" : "mb-6"}>
        <RunningMap 
          isRunning={isRunning}
          onLocationUpdate={handleLocationUpdate}
          onDistanceUpdate={handleDistanceUpdate}
          userLocation={userLocation}
          showStartPoint={true}
          currentCheckpoint={currentCheckpoint}
          passedCheckpoints={passedCheckpoints}
          isCompleted={isCompleted}
          onNavigationReady={handleNavigationReady}
          runningStats={{
            time: time,
            distance: distance,
            pace: pace
          }}
          onPause={pauseRunning}
          onStop={stopRunning}
          isPaused={isPaused}
        />
      </div>

        {/* 네비게이션 가이드 (전체 화면 모드가 아닐 때만 표시) */}
        {!navigationFunctions?.isNavMode && course?.gps_route && userLocation && (
          <NavigationGuide
            courseRoute={course?.gps_route || []}
            currentCheckpoint={currentCheckpoint}
            isRunning={isRunning && !isPaused}
            userLocation={userLocation}
            onCheckpointReached={(checkpoint) => {
              setCurrentCheckpoint(checkpoint)
              setPassedCheckpoints(prev => [...prev, checkpoint])
              
              // 마지막 포인트 도달 시 완주 처리
              if (checkpoint === (course?.gps_route?.length || 1) - 1) {
                handleCompletion()
              }
            }}
            onStartNavigation={navigationFunctions?.startNav}
            onStopNavigation={navigationFunctions?.stopNav}
            isNavigationMode={navigationFunctions?.isNavMode || false}
          />
        )}

        {/* 시작점 도착 확인 */}
        {showStartPointGuide && !isRunning && (
          <div className="mb-6">
            <div className={`bg-gray-900/80 glass rounded-2xl p-6 border transition-all duration-300 ${
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
                  <div className="relative z-50">
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
                    <p className="text-gray-400 text-xs mb-4">시작점에서 50m 이내에 있어야 런닝을 시작할 수 있습니다</p>
                    <button
                      onClick={navigateToStartPoint}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Navigation className="w-4 h-4" />
                      시작점으로 네비게이션
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 메인 통계 */}
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
        </div>


        {/* 런닝 상태 메시지 */}
        <div className="text-center py-4">
          {isCompleted ? (
            <div>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-green-400 font-bold">🎉 완주 성공!</p>
              <p className="text-gray-400 text-sm mt-1">
                완주 시간: {completionTime ? formatTime(completionTime) : formatTime(time)}
              </p>
            </div>
          ) : !isRunning ? (
            <div>
              <div className="w-16 h-16 bg-[#00FF88] rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                <Play className="w-8 h-8 text-black fill-current" />
              </div>
              <p className="text-gray-400">런닝을 시작할 준비가 되었습니다</p>
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
              {course?.gps_route && (
                <p className="text-gray-400 text-sm mt-1">
                  {currentCheckpoint + 1 === course.gps_route.length - 1 ? 
                    '🏁 마지막 포인트까지 50m 이내로 이동하세요!' :
                    `다음 포인트까지 이동하세요 (${currentCheckpoint + 1}/${course.gps_route.length - 1})`
                  }
                </p>
              )}
            </div>
          )}
        </div>

        {/* 런닝 컨트롤 버튼 (전체 화면 모드가 아닐 때만 표시) */}
        {isRunning && !isCompleted && !navigationFunctions?.isNavMode && (
          <div className="flex items-center justify-center gap-4 mt-6 relative z-50">
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

        {/* 완주 후 결과 버튼 */}
        {isCompleted && (
          <div className="space-y-4 mt-6">
            {/* 저장 상태 표시 */}
            {saveSuccess && (
              <div className="bg-green-500/20 border border-green-500 rounded-2xl p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-bold">✅ 기록 저장 완료!</p>
                <p className="text-green-300 text-sm">2시간 동안 제휴 스팟 인증 혜택을 받을 수 있습니다</p>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={viewResults}
                className="bg-[#00FF88] hover:bg-[#00E077] text-black font-bold px-6 py-4 rounded-2xl flex items-center gap-2 transition-all duration-300"
              >
                <CheckCircle className="w-5 h-5" />
                결과 확인
              </button>
              
              <button 
                onClick={saveRunningRecord}
                disabled={isSaving || saveSuccess}
                className={`font-bold px-6 py-4 rounded-2xl flex items-center gap-2 transition-all duration-300 ${
                  saveSuccess 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : isSaving
                      ? 'bg-blue-400 text-white cursor-wait'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Heart className="w-5 h-5" />
                {isSaving ? '저장 중...' : saveSuccess ? '저장 완료' : '기록 저장'}
              </button>
            </div>
            
          </div>
        )}

        {/* 완주 축하 모달 */}
        {showCompletionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-3xl p-8 max-w-md w-full border border-gray-700">
              <div className="text-center">
                <div className="w-20 h-20 bg-[#00FF88] rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <CheckCircle className="w-10 h-10 text-black" />
                </div>
                
                <h2 className="text-2xl font-bold text-[#00FF88] mb-4">🎉 완주 성공!</h2>
                
                <div className="space-y-3 text-gray-300 mb-6">
                  <div className="flex justify-between">
                    <span>⏱️ 완주 시간:</span>
                    <span className="text-white font-medium">{formatTime(time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>📍 거리:</span>
                    <span className="text-white font-medium">{distance.toFixed(2)}km</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 mb-6">
                  기록을 저장하면 2시간 동안 제휴 스팟에서 인증 혜택을 받을 수 있습니다!
                </p>
                
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="w-full bg-[#00FF88] hover:bg-[#00E077] text-black font-bold py-3 rounded-2xl transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 결과 확인 모달 */}
        {showResultModal && runningResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-3xl p-8 max-w-md w-full border border-gray-700">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-6">🏃‍♂️ 런닝 결과</h2>
                
                <div className="space-y-4 text-left mb-6">
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">📍 코스</span>
                    <span className="text-white font-medium">{runningResult.courseName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">⏱️ 완주 시간</span>
                    <span className="text-white font-medium">{formatTime(runningResult.duration)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">📏 거리</span>
                    <span className="text-white font-medium">{runningResult.distance.toFixed(2)}km</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">⚡ 평균 속도</span>
                    <span className="text-white font-medium">{runningResult.avgSpeed.toFixed(1)}km/h</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">📅 완주 시간</span>
                    <span className="text-white font-medium">{runningResult.completedAt.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className={`p-3 rounded-xl mb-6 ${
                  saveSuccess ? 'bg-green-500/20 border border-green-500' : 'bg-yellow-500/20 border border-yellow-500'
                }`}>
                  <p className={`text-sm font-medium ${
                    saveSuccess ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {saveSuccess ? '✅ 기록 저장 완료!' : '⚠️ 아직 기록이 저장되지 않았습니다.'}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowResultModal(false)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-2xl transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 저장 완료 모달 */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-3xl p-8 max-w-md w-full border border-gray-700">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-green-400 mb-4">🎉 저장 완료!</h2>
                
                <p className="text-gray-300 mb-4">
                  런닝 기록이 성공적으로 저장되었습니다!
                </p>
                
                <div className="bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-2xl p-4 mb-6">
                  <p className="text-[#00FF88] text-sm font-medium">
                    🎫 2시간 동안 제휴 스팟에서<br/>인증 혜택을 받을 수 있습니다!
                  </p>
                </div>
                
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-2xl transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
