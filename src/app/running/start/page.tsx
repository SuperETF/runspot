'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { ArrowLeft, Play, Pause, Square, CheckCircle, Navigation, Heart, Clock, Zap, Volume2, VolumeX } from 'lucide-react'
import ShareButton from '@/components/common/ShareButton'
import { useRouter, useSearchParams } from 'next/navigation'
import RunningMap from '@/components/common/RunningMap'
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
  
  // 실시간 네비게이션 데이터
  const [currentNavigationState, setCurrentNavigationState] = useState<any>(null)
  
  // 음성 안내 상태
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  
  // 1인칭 추적 모드 상태
  const [isFirstPersonMode, setIsFirstPersonMode] = useState(false)

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
    
    // 런닝 시작과 동시에 네비게이션 모드 활성화
    setTimeout(() => {
      if (navigationFunctions?.startNav) {
        navigationFunctions.startNav()
      }
    }, 1000) // 1초 후 네비게이션 시작
  }, [isAtStartPoint, course, startTracking, navigationFunctions])

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

  // 네비게이션 함수 핸들러 (1인칭 추적 모드)
  const handleNavigationReady = useCallback((startNav: () => void, stopNav: () => void, isNavMode: boolean) => {
    setNavigationFunctions({ startNav, stopNav, isNavMode })
    setIsFirstPersonMode(isNavMode)
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
      {/* 통합 헤더 - 항상 표시 */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => {
              // 1인칭 추적 모드가 활성화되어 있으면 먼저 종료
              if (isFirstPersonMode && navigationFunctions?.stopNav) {
                navigationFunctions.stopNav()
              } else {
                router.back()
              }
            }}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-lg font-semibold">{course.name}</h1>
            <p className="text-xs text-gray-400">{course.area}</p>
          </div>
          
          {/* 네비게이션 컨트롤 */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (isFirstPersonMode) {
                  navigationFunctions?.stopNav()
                } else {
                  navigationFunctions?.startNav()
                }
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isFirstPersonMode 
                  ? 'bg-[#00FF88] text-black' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
              title={isFirstPersonMode ? '1인칭 추적 끄기' : '1인칭 추적 켜기'}
            >
              <Navigation className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                voiceEnabled 
                  ? 'bg-[#00FF88] text-black' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
              title={voiceEnabled ? '음성 안내 끄기' : '음성 안내 켜기'}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* 코스 공유 버튼 */}
            <button
              onClick={() => {
                const handleKakaoShare = () => {
                  if (typeof window !== 'undefined' && (window as any).Kakao) {
                    try {
                      // 카카오 SDK 초기화 확인
                      if (!(window as any).Kakao.isInitialized()) {
                        const kakaoJsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
                        if (kakaoJsKey) {
                          (window as any).Kakao.init(kakaoJsKey);
                          console.log('🔑 Kakao SDK 초기화:', kakaoJsKey.substring(0, 10) + '...');
                        } else {
                          console.error('❌ NEXT_PUBLIC_KAKAO_JS_KEY 환경변수가 설정되지 않았습니다.');
                          alert('카카오톡 공유 기능이 설정되지 않았습니다.\n관리자에게 문의해주세요.');
                          return;
                        }
                      }
                      
                      const shareUrl = `${window.location.origin}/course/${course.id}`;
                      const startPoint = course.gps_route && course.gps_route.length > 0 
                        ? course.gps_route[0] 
                        : null;
                      
                      // 시작점이 있으면 지도 형태로 공유
                      if (startPoint) {
                        (window as any).Kakao.Share.sendDefault({
                          objectType: 'location',
                          address: course.area,
                          addressTitle: `🏃‍♂️ ${course.name}`,
                          content: {
                            title: `${course.name} 런닝 코스`,
                            description: `📍 ${course.area}\n📏 거리: ${course.distance}km\n⭐ 난이도: ${course.difficulty}\n\n함께 달려요! 🏃‍♀️`,
                            imageUrl: `${window.location.origin}/images/default-course.jpg`,
                            link: {
                              mobileWebUrl: shareUrl,
                              webUrl: shareUrl,
                            },
                          },
                          social: {
                            likeCount: Math.floor(Math.random() * 100),
                            commentCount: Math.floor(Math.random() * 20),
                          },
                          buttons: [
                            {
                              title: '코스 보기',
                              link: {
                                mobileWebUrl: shareUrl,
                                webUrl: shareUrl,
                              },
                            },
                            {
                              title: '길찾기',
                              link: {
                                mobileWebUrl: `https://map.kakao.com/link/to/${encodeURIComponent(course.name)},${startPoint.lat},${startPoint.lng}`,
                                webUrl: `https://map.kakao.com/link/to/${encodeURIComponent(course.name)},${startPoint.lat},${startPoint.lng}`,
                              },
                            },
                          ],
                        });
                      } else {
                        // 좌표가 없으면 기본 형태로 공유
                        (window as any).Kakao.Share.sendDefault({
                          objectType: 'feed',
                          content: {
                            title: `🏃‍♂️ ${course.name}`,
                            description: `${course.area} • ${course.distance}km • ${course.difficulty}\n함께 달려요! 🏃‍♀️`,
                            imageUrl: `${window.location.origin}/images/default-course.jpg`,
                            link: {
                              mobileWebUrl: shareUrl,
                              webUrl: shareUrl,
                            },
                          },
                          buttons: [
                            {
                              title: '코스 보기',
                              link: {
                                mobileWebUrl: shareUrl,
                                webUrl: shareUrl,
                              },
                            },
                          ],
                        });
                      }
                      
                      console.log('✅ 카카오톡 공유 성공');
                    } catch (error) {
                      console.error('❌ 카카오톡 공유 실패:', error);
                      
                      // 대체 공유 방법 제공
                      const shareUrl = `${window.location.origin}/course/${course.id}`;
                      if (navigator.share) {
                        navigator.share({
                          title: `🏃‍♂️ ${course.name} - RunSpot`,
                          text: `${course.area} • ${course.distance}km • ${course.difficulty}\n함께 달려요!`,
                          url: shareUrl,
                        }).catch(() => {
                          // 클립보드에 복사
                          navigator.clipboard.writeText(shareUrl).then(() => {
                            alert('링크가 클립보드에 복사되었습니다!');
                          });
                        });
                      } else {
                        // 클립보드에 복사
                        navigator.clipboard.writeText(shareUrl).then(() => {
                          alert('카카오톡 공유에 실패했습니다.\n링크가 클립보드에 복사되었습니다!');
                        });
                      }
                    }
                  } else {
                    console.log('⏳ Kakao SDK 로딩 대기 중...');
                    // 3초 후 다시 시도
                    setTimeout(() => {
                      if ((window as any).Kakao) {
                        handleKakaoShare();
                      } else {
                        alert('카카오톡 공유 기능을 불러올 수 없습니다.\n페이지를 새로고침 후 다시 시도해주세요.');
                      }
                    }, 3000);
                    
                    alert('카카오톡 공유 기능을 준비 중입니다.\n3초 후 자동으로 다시 시도됩니다.');
                  }
                };
                
                handleKakaoShare();
              }}
              className="w-10 h-10 rounded-full bg-[#FEE500] hover:bg-[#FDD835] text-black flex items-center justify-center transition-colors"
              title="카카오톡으로 공유"
            >
              {/* 카카오톡 로고 SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.486 3 2 6.262 2 10.5c0 2.665 1.708 5.089 4.438 6.563L5.5 20l3.563-1.938C10.024 18.355 11.012 18.5 12 18.5c5.514 0 10-3.262 10-7.5S17.514 3 12 3z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="px-4 py-6 space-y-6">
        
        {/* 지도 - 런닝 상태에 따라 다른 모드 */}
        <div className="mb-6">
          {isPreRunning ? (
            // 런닝 시작 전: 대기 화면 모드
            <RunningMap
              isRunning={false}
              userLocation={userLocation}
              showStartPoint={true}
              currentCheckpoint={0}
              passedCheckpoints={[]}
              isCompleted={false}
              onLocationUpdate={setUserLocation}
              onStartPointStatusChange={(isAtStart, distanceToStart) => {
                setIsAtStartPoint(isAtStart)
                setDistanceToStart(distanceToStart)
              }}
              hideFloatingNavigation={true}
              mode="waiting" // 대기 모드
            />
          ) : isActiveRunning ? (
            // 런닝 시작 후: 실시간 추적 모드
            <RunningMap
              isRunning={true}
              userLocation={userLocation}
              showStartPoint={false}
              currentCheckpoint={currentCheckpoint}
              passedCheckpoints={passedCheckpoints}
              isCompleted={isCompleted}
              onNavigationReady={handleNavigationReady}
              runningStats={{ time, distance, pace }}
              onPause={pauseRunning}
              onStop={stopRunning}
              isPaused={isPaused}
              onLocationUpdate={setUserLocation}
              hideFloatingNavigation={true}
              onNavigationUpdate={setCurrentNavigationState}
              voiceGuidanceEnabled={voiceEnabled}
              mode="running" // 런닝 모드
            />
          ) : (
            // 기본 상태: 코스 보기 모드
            <RunningMap
              isRunning={false}
              userLocation={userLocation}
              showStartPoint={true}
              currentCheckpoint={0}
              passedCheckpoints={[]}
              isCompleted={false}
              onLocationUpdate={setUserLocation}
              hideFloatingNavigation={true}
              mode="preview" // 미리보기 모드
            />
          )}
        </div>

        {/* 런닝 관련 UI - 항상 표시 */}
        {(
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


            {/* 런닝 통계 */}
            {isActiveRunning && !isFirstPersonMode && (
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
                      <p className="text-green-400 font-bold mb-4">🎉 완주 성공!</p>
                      
                      {/* 완주 기록 공유 */}
                      <div className="flex justify-center">
                        <ShareButton
                          type="record"
                          data={{
                            name: course.name,
                            distance: distance,
                            time: time,
                            pace: pace,
                            date: new Date().toLocaleDateString('ko-KR'),
                            courseId: course.id,
                            startPoint: course.gps_route && course.gps_route.length > 0 
                              ? { lat: course.gps_route[0].lat, lng: course.gps_route[0].lng }
                              : undefined
                          }}
                          variant="both"
                          className="justify-center"
                        />
                      </div>
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
              <div className={`space-y-4 ${isFirstPersonMode ? 'mt-4' : 'mt-6'}`}>
                {/* 1인칭 추적 모드일 때 간단한 시간 표시 */}
                {isFirstPersonMode && (
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-[#00FF88] font-mono">
                      {formatTime(time)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {distance.toFixed(2)}km
                    </div>
                  </div>
                )}
                
                {/* 메인 컨트롤 버튼 */}
                <div className={`flex items-center justify-center gap-3 ${
                  isFirstPersonMode ? '' : 'gap-4'
                }`}>
                  <button 
                    onClick={pauseRunning}
                    className={`${
                      isPaused ? 'bg-[#00FF88] text-black' : 'bg-yellow-500 text-black'
                    } font-bold ${
                      isFirstPersonMode ? 'px-4 py-3 text-sm' : 'px-6 py-4'
                    } rounded-2xl flex items-center gap-2 transition-all duration-300`}
                  >
                    {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? '재개' : '일시정지'}
                  </button>
                  
                  <button 
                    onClick={stopRunning}
                    className={`bg-red-500 hover:bg-red-600 text-white font-bold ${
                      isFirstPersonMode ? 'px-4 py-3 text-sm' : 'px-6 py-4'
                    } rounded-2xl flex items-center gap-2 transition-all duration-300`}
                  >
                    <Square className="w-4 h-4" />
                    종료
                  </button>
                </div>
                
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
