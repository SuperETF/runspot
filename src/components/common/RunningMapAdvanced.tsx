'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { GPSCoordinate } from '@/types/database'
import LocationPermission from './LocationPermission'
import { useRunningStore } from '@/stores/runningStore'
import { 
  calculateRunningProgress,
  splitCourseByProgress,
  calculateNextTurn,
  type GPSPoint,
  type RunningProgress,
  type NavigationDirection,
  type CourseSegment,
  type RunningRecord
} from '@/utils/runningNavigation'

// 디버깅 플래그
const DEBUG = process.env.NODE_ENV === 'development'

interface RunningMapProps {
  isRunning: boolean
  onLocationUpdate?: (location: { lat: number; lng: number }) => void
  userLocation?: { lat: number; lng: number } | null
  showStartPoint?: boolean
  isCompleted?: boolean
  mode?: 'preview' | 'waiting' | 'running'
  onStartPointStatusChange?: (isAtStartPoint: boolean, distanceToStart: number) => void
  onProgressUpdate?: (progress: RunningProgress | null) => void
  onRecordUpdate?: (record: RunningRecord) => void
  // 런닝 컨트롤 콜백들
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void
  isPaused?: boolean
}

export default function RunningMapAdvanced({ 
  isRunning, 
  onLocationUpdate, 
  userLocation, 
  showStartPoint = false,
  isCompleted = false,
  onStartPointStatusChange,
  onProgressUpdate,
  onRecordUpdate,
  onPause,
  onResume,
  onStop,
  isPaused = false,
  mode = 'preview'
}: RunningMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)
  const [map, setMap] = useState<any>(null)
  const [currentMarker, setCurrentMarker] = useState<any>(null)
  const [passedPolyline, setPassedPolyline] = useState<any>(null)
  const [upcomingPolyline, setUpcomingPolyline] = useState<any>(null)
  const [startPointMarker, setStartPointMarker] = useState<any>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown')
  const [logoBase64, setLogoBase64] = useState<string>('')

  const courseData = useRunningStore((state) => state.courseData)
  const currentPosition = useRunningStore((state) => state.currentPosition)
  
  // 코스 경로 데이터
  const courseRoute = courseData?.gps_route || []
  
  // 런닝 네비게이션 상태
  const [runningProgress, setRunningProgress] = useState<RunningProgress | null>(null)
  const [courseSegment, setCourseSegment] = useState<CourseSegment | null>(null)
  const [nextTurn, setNextTurn] = useState<NavigationDirection | null>(null)
  const [averagePace, setAveragePace] = useState<number | null>(null)
  
  // 시작점 도착 상태
  const [isAtStartPoint, setIsAtStartPoint] = useState(false)
  const [distanceToStart, setDistanceToStart] = useState<number | null>(null)
  const START_POINT_THRESHOLD = 0.05 // 50m 이내면 시작점 도착으로 간주

  // 런닝 기록 (완주 인증용)
  const [runningRecords, setRunningRecords] = useState<RunningRecord[]>([])

  // 런닝 모드에서 진행률 계산 및 업데이트
  useEffect(() => {
    if (mode === 'running' && userLocation && courseRoute.length > 0) {
      try {
        const progress = calculateRunningProgress(userLocation, courseRoute, averagePace || undefined)
        setRunningProgress(progress)
        
        // 코스 분리
        const segment = splitCourseByProgress(courseRoute, progress)
        setCourseSegment(segment)
        
        // 다음 턴 계산
        const turn = calculateNextTurn(courseRoute, progress.currentSegmentIndex)
        setNextTurn(turn)
        
        // 부모 컴포넌트에 진행률 전달
        if (onProgressUpdate) {
          onProgressUpdate(progress)
        }
        
        // 런닝 기록 추가
        const record: RunningRecord = {
          timestamp: Date.now(),
          location: userLocation,
          progress,
          isOffCourse: progress.isOffCourse
        }
        
        setRunningRecords(prev => [...prev, record])
        
        if (onRecordUpdate) {
          onRecordUpdate(record)
        }

        // 런닝 모드에서 지도 중심을 실시간으로 사용자 위치에 맞춤
        if (map && mode === 'running') {
          const kakao = (window as any).kakao
          const center = new kakao.maps.LatLng(userLocation.lat, userLocation.lng)
          map.setCenter(center)
        }
        
        DEBUG && console.log('🏃‍♂️ 런닝 진행률:', {
          진행률: `${progress.progressPercent.toFixed(1)}%`,
          남은거리: `${(progress.remainingDistance / 1000).toFixed(2)}km`,
          코스이탈: progress.isOffCourse ? '예' : '아니오',
          다음턴: turn?.description || '직진'
        })
      } catch (error) {
        console.error('진행률 계산 오류:', error)
      }
    } else if (onProgressUpdate) {
      onProgressUpdate(null)
    }
  }, [mode, userLocation, courseRoute, averagePace, onProgressUpdate, onRecordUpdate])

  // 시작점 도착 상태 확인
  useEffect(() => {
    if (userLocation && courseRoute.length > 0) {
      const startPoint = courseRoute[0]
      const distance = Math.sqrt(
        Math.pow((userLocation.lat - startPoint.lat) * 111000, 2) +
        Math.pow((userLocation.lng - startPoint.lng) * 111000 * Math.cos(startPoint.lat * Math.PI / 180), 2)
      ) / 1000 // km 단위
      
      const isNearStart = distance <= START_POINT_THRESHOLD
      
      setDistanceToStart(distance)
      setIsAtStartPoint(isNearStart)
      
      if (onStartPointStatusChange) {
        onStartPointStatusChange(isNearStart, distance)
      }
    }
  }, [userLocation, courseRoute, onStartPointStatusChange, START_POINT_THRESHOLD])

  // 카카오맵 초기화
  useEffect(() => {
    const initializeMap = async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!mapContainer.current || map) return

      const waitForKakaoMaps = () => {
        return new Promise<void>((resolve, reject) => {
          let attempts = 0
          const maxAttempts = 50
          
          const checkKakao = () => {
            attempts++
            
            if ((window as any).kakao?.maps) {
              resolve()
              return
            }
            
            if (attempts >= maxAttempts) {
              reject(new Error('카카오맵 SDK 로드 타임아웃'))
              return
            }
            
            setTimeout(checkKakao, 100)
          }
          
          checkKakao()
        })
      }

      try {
        await waitForKakaoMaps()

        const kakao = (window as any).kakao
        
        if (kakao.maps.load) {
          await new Promise<void>((resolve) => {
            kakao.maps.load(() => {
              resolve()
            })
          })
        }
        
        const defaultCenter = new kakao.maps.LatLng(37.5665, 126.9780)
        
        const mapOptions = {
          center: defaultCenter,
          level: 4, // 100-200m 정도가 보이는 줌 레벨
          mapTypeId: kakao.maps.MapTypeId.ROADMAP
        }

        const newMap = new kakao.maps.Map(mapContainer.current, mapOptions)
        setMap(newMap)

        console.log('✅ 카카오맵 초기화 완료 (Advanced)')
      } catch (error) {
        console.error('❌ 카카오맵 초기화 실패:', error)
      }
    }

    initializeMap()
  }, [map])

  // 로고 이미지를 base64로 변환
  useEffect(() => {
    const loadLogoAsBase64 = async () => {
      try {
        const { getRunSpotLogoBase64 } = await import('@/utils/imageUtils')
        const logo = await getRunSpotLogoBase64()
        if (isMountedRef.current) {
          setLogoBase64(logo)
        }
      } catch (error) {
        console.error('로고 이미지 로드 실패:', error)
      }
    }
    
    loadLogoAsBase64()
  }, [])

  // waiting 모드에서 자동으로 위치 권한 요청 및 추적 시작
  useEffect(() => {
    if (mode === 'waiting') {
      if (locationPermission === 'unknown' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationPermission('granted')
            const currentPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            if (onLocationUpdate) {
              onLocationUpdate(currentPos)
            }
          },
          (error) => {
            setLocationPermission('denied')
            console.error('위치 권한 거부:', error)
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
          }
        )
      }
      
      if (locationPermission === 'granted' && !watchId) {
        const options: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000 // 런닝 모드에서는 더 자주 업데이트
        }

        const newWatchId = navigator.geolocation.watchPosition(
          (position) => {
            if (!isMountedRef.current) return
            
            const currentPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            
            if (onLocationUpdate) {
              onLocationUpdate(currentPos)
            }
          },
          (error) => {
            console.error('위치 추적 오류:', error)
          },
          options
        )
        
        setWatchId(newWatchId)
      }
    }
    
    if (mode !== 'waiting' && mode !== 'running' && watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
  }, [mode, locationPermission, watchId, onLocationUpdate])

  // 런닝 모드에서 지도 중심을 사용자 위치로 고정 + 줌 레벨 조정
  useEffect(() => {
    if (!map || !userLocation || mode !== 'running') return
    
    const kakao = (window as any).kakao
    
    try {
      // 전체 화면 모드에서는 정확히 화면 중앙에 위치
      const center = new kakao.maps.LatLng(userLocation.lat, userLocation.lng)
      map.setCenter(center)
      
      // 줌 레벨 조정 (다음 턴이 가까우면 확대)
      let zoomLevel = 1 // 기본 20-30m (매우 확대)
      if (nextTurn && nextTurn.distance < 50) {
        zoomLevel = 1 // 최대 확대 유지
      }
      map.setLevel(zoomLevel)
      
      console.log('📍 지도 중심을 사용자 위치로 설정:', {
        lat: userLocation.lat,
        lng: userLocation.lng,
        zoomLevel
      })
      
    } catch (error) {
      console.error('❌ 지도 중심 설정 실패:', error)
    }
  }, [map, userLocation, mode, nextTurn])

  // 현재 위치 마커 업데이트 (방향 화살표 포함)
  useEffect(() => {
    if (!map || !userLocation) return
    
    const kakao = (window as any).kakao
    
    try {
      if (currentMarker) {
        currentMarker.setMap(null)
      }
      
      const position = new kakao.maps.LatLng(userLocation.lat, userLocation.lng)
      
      // 런닝 모드에서는 방향 화살표가 있는 마커 사용
      if (mode === 'running' && runningProgress) {
        // 방향 계산 (다음 세그먼트 방향)
        let bearing = 0
        if (runningProgress.currentSegmentIndex < courseRoute.length - 1) {
          const current = courseRoute[runningProgress.currentSegmentIndex]
          const next = courseRoute[runningProgress.currentSegmentIndex + 1]
          bearing = Math.atan2(next.lng - current.lng, next.lat - current.lat) * 180 / Math.PI
        }
        
        // 방향 화살표 마커 생성 (Canvas로 동적 생성)
        const canvas = document.createElement('canvas')
        canvas.width = 40
        canvas.height = 40
        const ctx = canvas.getContext('2d')!
        
        // 원형 배경
        ctx.fillStyle = '#00FF88'
        ctx.beginPath()
        ctx.arc(20, 20, 18, 0, 2 * Math.PI)
        ctx.fill()
        
        // 테두리
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.stroke()
        
        // 화살표 그리기
        ctx.save()
        ctx.translate(20, 20)
        ctx.rotate((bearing - 90) * Math.PI / 180) // 북쪽을 위로
        ctx.fillStyle = '#000000'
        ctx.beginPath()
        ctx.moveTo(0, -10)
        ctx.lineTo(-6, 6)
        ctx.lineTo(0, 2)
        ctx.lineTo(6, 6)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
        
        const markerImage = new kakao.maps.MarkerImage(
          canvas.toDataURL(),
          new kakao.maps.Size(40, 40),
          { offset: new kakao.maps.Point(20, 20) }
        )
        
        const marker = new kakao.maps.Marker({
          position: position,
          image: markerImage,
          map: map
        })
        
        setCurrentMarker(marker)
      } else {
        // 일반 모드에서는 기본 마커
        const marker = new kakao.maps.Marker({
          position: position,
          map: map
        })
        
        setCurrentMarker(marker)
      }
    } catch (error) {
      console.error('❌ 현재 위치 마커 업데이트 실패:', error)
    }
  }, [map, userLocation, mode, runningProgress, courseRoute])

  // 코스 경로 표시 (지나온 구간 vs 앞으로 갈 구간 분리)
  useEffect(() => {
    if (!map || !courseRoute || courseRoute.length === 0) return

    const kakao = (window as any).kakao

    try {
      // 기존 폴리라인 제거
      if (passedPolyline) {
        passedPolyline.setMap(null)
      }
      if (upcomingPolyline) {
        upcomingPolyline.setMap(null)
      }

      if (mode === 'running' && courseSegment) {
        // 런닝 모드: 지나온 구간과 앞으로 갈 구간을 다른 색으로 표시
        
        // 지나온 구간 (회색, 얇게)
        if (courseSegment.passed.length > 1) {
          const passedPath = courseSegment.passed.map((point: any) => 
            new kakao.maps.LatLng(point.lat, point.lng)
          )
          const newPassedPolyline = new kakao.maps.Polyline({
            path: passedPath,
            strokeWeight: 3,
            strokeColor: '#666666',
            strokeOpacity: 0.7,
            strokeStyle: 'solid'
          })
          newPassedPolyline.setMap(map)
          setPassedPolyline(newPassedPolyline)
        }
        
        // 앞으로 갈 구간 (진한 색, 굵게)
        if (courseSegment.upcoming.length > 1) {
          const upcomingPath = courseSegment.upcoming.map((point: any) => 
            new kakao.maps.LatLng(point.lat, point.lng)
          )
          const newUpcomingPolyline = new kakao.maps.Polyline({
            path: upcomingPath,
            strokeWeight: 6,
            strokeColor: '#00FF88',
            strokeOpacity: 0.9,
            strokeStyle: 'solid'
          })
          newUpcomingPolyline.setMap(map)
          setUpcomingPolyline(newUpcomingPolyline)
        }
      } else {
        // 일반 모드: 전체 코스를 하나의 색으로 표시
        const path = courseRoute.map((point: any) => new kakao.maps.LatLng(point.lat, point.lng))
        const newPolyline = new kakao.maps.Polyline({
          path: path,
          strokeWeight: 4,
          strokeColor: mode === 'waiting' ? '#00FF88' : '#FF6B00',
          strokeOpacity: 0.8,
          strokeStyle: 'solid'
        })
        newPolyline.setMap(map)
        setUpcomingPolyline(newPolyline) // 하나의 폴리라인만 사용
      }

      // 시작점 마커 표시
      if (showStartPoint && courseRoute.length > 0) {
        const startPoint = courseRoute[0]
        
        if (startPointMarker) {
          startPointMarker.setMap(null)
        }

        const markerSrc = logoBase64 || '/maker.svg'
        const imageSize = new kakao.maps.Size(48, 48)
        const markerImage = new kakao.maps.MarkerImage(markerSrc, imageSize)

        const newStartMarker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(startPoint.lat, startPoint.lng),
          image: markerImage,
          map: map
        })

        setStartPointMarker(newStartMarker)

        // waiting 모드에서는 전체 코스가 보이도록 범위 조정
        if (mode === 'waiting') {
          const bounds = new kakao.maps.LatLngBounds()
          courseRoute.forEach((point: any) => {
            bounds.extend(new kakao.maps.LatLng(point.lat, point.lng))
          })
          map.setBounds(bounds, 50)
        }
      }

      console.log('✅ 코스 경로 표시 완료:', mode, courseRoute.length, '개 포인트')
    } catch (error) {
      console.error('❌ 코스 경로 표시 실패:', error)
    }
  }, [map, courseRoute, courseSegment, showStartPoint, logoBase64, mode, passedPolyline, upcomingPolyline, startPointMarker])

  // 현재 위치로 이동
  const moveToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || !map) {
      alert('위치 서비스를 사용할 수 없습니다.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        const kakao = (window as any).kakao
        const center = new kakao.maps.LatLng(currentPos.lat, currentPos.lng)
        map.setCenter(center)
        map.setLevel(3)

        if (onLocationUpdate) {
          onLocationUpdate(currentPos)
        }
      },
      (error) => {
        console.error('현재 위치 가져오기 실패:', error)
        alert('현재 위치를 가져올 수 없습니다.')
      }
    )
  }, [map, onLocationUpdate])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  // waiting 모드가 아닌 경우에만 위치 권한 UI 표시
  if (locationPermission === 'unknown' && mode !== 'waiting') {
    return (
      <div 
        className="w-full rounded-2xl overflow-hidden border border-gray-800"
        style={{
          height: '33vh',
          minHeight: '200px'
        }}
      >
        <LocationPermission
          onPermissionGranted={() => setLocationPermission('granted')}
          onPermissionDenied={() => setLocationPermission('denied')}
        />
      </div>
    )
  }

  return (
    <div className={`relative ${mode === 'running' ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      <div 
        ref={mapContainer} 
        className={`w-full relative z-0 ${
          mode === 'running' 
            ? 'h-screen' // 런닝 모드: 전체 화면
            : 'rounded-2xl overflow-hidden border border-gray-800 h-[33vh] min-h-[200px]' // 일반 모드
        }`}
        style={{
          position: 'relative',
          isolation: 'isolate',
          zIndex: 0
        }}
      />
      
      {/* 런닝 모드 전용 UI */}
      {mode === 'running' && runningProgress && (
        <>
          {/* 전체 화면 닫기 버튼 (우상단) */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => {
                // 전체 화면 모드 종료 - 부모 컴포넌트에서 처리하도록 이벤트 발생
                const event = new CustomEvent('exitFullscreen')
                window.dispatchEvent(event)
              }}
              className="w-10 h-10 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-gray-600 hover:bg-black/90 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 진행률 & 거리 배너 (상단) */}
          <div className="absolute top-4 left-4 right-16 z-10">
            <div className="bg-black/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white text-lg font-bold">
                  {runningProgress.progressPercent.toFixed(1)}%
                </div>
                <div className="text-[#00FF88] text-sm font-medium">
                  {(runningProgress.remainingDistance / 1000).toFixed(2)}km 남음
                </div>
              </div>
              
              {/* 진행률 바 */}
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div 
                  className="bg-[#00FF88] h-3 rounded-full transition-all duration-300"
                  style={{ width: `${runningProgress.progressPercent}%` }}
                />
              </div>
              
              {/* 예상 남은 시간 */}
              {runningProgress.estimatedRemainingTime > 0 && (
                <div className="text-center text-xs text-gray-300">
                  예상 남은 시간: {Math.round(runningProgress.estimatedRemainingTime)}분
                </div>
              )}
            </div>
          </div>

          {/* 다음 턴 안내 (좌측 상단) */}
          {nextTurn && nextTurn.type !== 'straight' && (
            <div className="absolute top-24 left-4 z-10">
              <div className="bg-blue-600/95 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-500">
                <div className="flex items-center gap-2 text-white text-sm">
                  <div className="text-lg">
                    {nextTurn.type === 'left' && '⬅️'}
                    {nextTurn.type === 'right' && '➡️'}
                    {nextTurn.type === 'sharp_left' && '↖️'}
                    {nextTurn.type === 'sharp_right' && '↗️'}
                    {nextTurn.type === 'u_turn' && '🔄'}
                  </div>
                  <span className="font-medium">{nextTurn.description}</span>
                </div>
              </div>
            </div>
          )}

          {/* 코스 이탈 경고 배너 */}
          {runningProgress.isOffCourse && (
            <div className="absolute top-2 left-4 right-4 z-20">
              <div className="bg-red-600/95 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-500 animate-pulse">
                <div className="flex items-center gap-2 text-white text-sm">
                  <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                  </svg>
                  <span className="font-medium">코스를 이탈했어요. 라인으로 돌아오세요.</span>
                  <span className="text-xs text-red-200">({runningProgress.distanceToRoute.toFixed(0)}m 이탈)</span>
                </div>
              </div>
            </div>
          )}

          {/* 전체 화면 모드 런닝 컨트롤 (하단) */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex items-center gap-4 bg-black/90 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-600">
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="w-12 h-12 bg-[#00FF88] rounded-full flex items-center justify-center hover:bg-[#00FF88]/90 transition-colors"
                >
                  <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors"
                >
                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                </button>
              )}
              
              <button
                onClick={onStop}
                className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* waiting 모드 컨트롤 버튼들 */}
      {mode === 'waiting' && (
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={moveToCurrentLocation}
            className="px-3 py-2 rounded-lg shadow-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            내위치
          </button>

          <button
            onClick={() => {
              if (courseRoute && courseRoute.length > 0) {
                const startPoint = courseRoute[0]
                const kakao = (window as any).kakao
                map.setCenter(new kakao.maps.LatLng(startPoint.lat, startPoint.lng))
                map.setLevel(3)
              }
            }}
            className="px-3 py-2 rounded-lg shadow-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
          >
            시작점
          </button>
        </div>
      )}

      {/* 대기 모드 전용 UI - 좌측 하단 작은 카드 */}
      {mode === 'waiting' && (
        <div className="absolute bottom-4 left-4">
          <div className="bg-black/95 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-600 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse"></div>
              <div className="text-xs text-white">
                GPS 추적 중
              </div>
            </div>
            {userLocation && courseRoute.length > 0 && distanceToStart !== null && (
              <div className={`text-xs mt-1 ${isAtStartPoint ? 'text-[#00FF88]' : 'text-gray-300'}`}>
                시작점까지 {(distanceToStart * 1000).toFixed(0)}m
                {isAtStartPoint && ' ✅'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
