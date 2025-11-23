'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { GPSCoordinate } from '@/types/database'
import LocationPermission from './LocationPermission'
import { useRunningStore } from '@/stores/runningStore'
import { 
  prepareRoutePoints, 
  calculateNavigationProgress, 
  type RoutePointWithDistance, 
  type NavigationProgress as PedestrianProgress 
} from '@/utils/mapUtils'
import { haversineDistance } from '@/utils/navigationEngine'

// 디버깅 플래그
const DEBUG = process.env.NODE_ENV === 'development'

interface RunningMapProps {
  isRunning: boolean
  onLocationUpdate?: (location: { lat: number; lng: number }) => void
  userLocation?: { lat: number; lng: number } | null
  showStartPoint?: boolean
  currentCheckpoint?: number
  passedCheckpoints?: number[]
  isCompleted?: boolean
  mode?: 'preview' | 'waiting' | 'running'
  onStartPointStatusChange?: (isAtStartPoint: boolean, distanceToStart: number) => void
  onProgressUpdate?: (progress: PedestrianProgress | null) => void
}

export default function RunningMapMVP({ 
  isRunning, 
  onLocationUpdate, 
  userLocation, 
  showStartPoint = false,
  currentCheckpoint = 0,
  passedCheckpoints = [],
  isCompleted = false,
  onStartPointStatusChange,
  onProgressUpdate,
  mode = 'preview'
}: RunningMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)
  const [map, setMap] = useState<any>(null)
  const [currentMarker, setCurrentMarker] = useState<any>(null)
  const [coursePolyline, setCoursePolyline] = useState<any>(null)
  const [startPointMarker, setStartPointMarker] = useState<any>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown')
  const [logoBase64, setLogoBase64] = useState<string>('')

  const courseData = useRunningStore((state) => state.courseData)
  const currentPosition = useRunningStore((state) => state.currentPosition)
  
  // 코스 경로 데이터
  const courseRoute = courseData?.gps_route || []
  
  // 보행자 네비게이션 MVP 상태
  const [pedestrianProgress, setPedestrianProgress] = useState<PedestrianProgress | null>(null)
  const [routePoints, setRoutePoints] = useState<RoutePointWithDistance[]>([])
  
  // 시작점 도착 상태
  const [isAtStartPoint, setIsAtStartPoint] = useState(false)
  const [distanceToStart, setDistanceToStart] = useState<number | null>(null)
  const START_POINT_THRESHOLD = 0.05 // 50m 이내면 시작점 도착으로 간주

  // 보행자 네비게이션 MVP: 경로 포인트 전처리
  useEffect(() => {
    if (courseRoute.length > 0) {
      const processedRoutePoints = prepareRoutePoints(courseRoute)
      setRoutePoints(processedRoutePoints)
      
      DEBUG && console.log('🚶‍♂️ 보행자 네비게이션 경로 포인트 준비:', {
        원본포인트수: courseRoute.length,
        처리된포인트수: processedRoutePoints.length,
        총거리: processedRoutePoints.length > 0 ? `${(processedRoutePoints[processedRoutePoints.length - 1].distanceFromStart / 1000).toFixed(2)}km` : '0km'
      })
    } else {
      setRoutePoints([])
      setPedestrianProgress(null)
    }
  }, [courseRoute])

  // 보행자 네비게이션 MVP: RunningStore의 currentPosition 변경 시 진행률 계산
  useEffect(() => {
    if (mode === 'running' && currentPosition && routePoints.length > 0) {
      const progress = calculateNavigationProgress(routePoints, currentPosition)
      setPedestrianProgress(progress)
      
      // 부모 컴포넌트에 진행률 전달
      if (onProgressUpdate) {
        onProgressUpdate(progress)
      }
      
      DEBUG && console.log('🚶‍♂️ 보행자 네비게이션 진행률:', {
        진행률: `${progress.progressPercent.toFixed(1)}%`,
        통과거리: `${(progress.passedDistance / 1000).toFixed(2)}km`,
        총거리: `${(progress.totalDistance / 1000).toFixed(2)}km`,
        코스이탈: progress.isOffCourse ? '예' : '아니오',
        이탈거리: `${progress.distanceToRoute.toFixed(1)}m`
      })
    } else if (onProgressUpdate) {
      onProgressUpdate(null)
    }
  }, [mode, currentPosition, routePoints, onProgressUpdate])

  // 시작점 도착 상태 확인 및 업데이트
  useEffect(() => {
    if (userLocation && courseRoute.length > 0) {
      const distanceInKm = haversineDistance(userLocation, courseRoute[0]) / 1000
      const isNearStart = distanceInKm <= START_POINT_THRESHOLD
      
      setDistanceToStart(distanceInKm)
      setIsAtStartPoint(isNearStart)
      
      // 부모 컴포넌트에 상태 변경 알림
      if (onStartPointStatusChange) {
        onStartPointStatusChange(isNearStart, distanceInKm)
      }
      
      console.log('📍 시작점 상태 업데이트:', {
        현재위치: `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`,
        시작점위치: `${courseRoute[0].lat.toFixed(6)}, ${courseRoute[0].lng.toFixed(6)}`,
        거리: `${(distanceInKm * 1000).toFixed(0)}m`,
        시작점도착: isNearStart,
        임계값: `${START_POINT_THRESHOLD * 1000}m`
      })
    }
  }, [userLocation, courseRoute, onStartPointStatusChange, START_POINT_THRESHOLD])

  // 카카오맵 초기화
  useEffect(() => {
    const initializeMap = async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!mapContainer.current || map) return

      // 카카오맵 SDK 로드 대기
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
          level: 3,
          mapTypeId: kakao.maps.MapTypeId.ROADMAP
        }

        const newMap = new kakao.maps.Map(mapContainer.current, mapOptions)
        setMap(newMap)

        console.log('✅ 카카오맵 초기화 완료 (MVP)')
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
          maximumAge: 30000
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
            console.error('waiting 모드 위치 추적 오류:', error)
          },
          options
        )
        
        setWatchId(newWatchId)
      }
    }
    
    if (mode !== 'waiting' && watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
  }, [mode, locationPermission, watchId, onLocationUpdate])

  // 현재 위치 마커 업데이트
  useEffect(() => {
    if (!map || !userLocation) return
    
    const kakao = (window as any).kakao
    
    try {
      if (currentMarker) {
        currentMarker.setMap(null)
      }
      
      const position = new kakao.maps.LatLng(userLocation.lat, userLocation.lng)
      const marker = new kakao.maps.Marker({
        position: position,
        map: map
      })
      
      setCurrentMarker(marker)
    } catch (error) {
      console.error('❌ 현재 위치 마커 업데이트 실패:', error)
    }
  }, [map, userLocation, mode, courseRoute])

  // 코스 경로와 시작점 표시 (MVP 핵심 기능)
  useEffect(() => {
    if (!map || !courseRoute || courseRoute.length === 0) return

    const kakao = (window as any).kakao

    try {
      // 기존 코스 경로 제거
      if (coursePolyline) {
        coursePolyline.setMap(null)
      }

      // 새로운 코스 경로 생성 - MVP: 자동으로 폴리라인 표시
      const path = courseRoute.map((point: any) => new kakao.maps.LatLng(point.lat, point.lng))
      const newPolyline = new kakao.maps.Polyline({
        path: path,
        strokeWeight: 4,
        strokeColor: mode === 'running' ? '#FF6B00' : '#00FF88', // 런닝 중일 때는 주황색
        strokeOpacity: 0.8,
        strokeStyle: 'solid'
      })

      newPolyline.setMap(map)
      setCoursePolyline(newPolyline)

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

      console.log('✅ MVP: 코스 폴리라인 자동 표시 완료:', courseRoute.length, '개 포인트')
    } catch (error) {
      console.error('❌ 코스 경로 표시 실패:', error)
    }
  }, [map, courseRoute, showStartPoint, logoBase64, coursePolyline, startPointMarker, mode])

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
    <div className="relative">
      <div 
        ref={mapContainer} 
        className="w-full rounded-2xl overflow-hidden border border-gray-800 relative z-0"
        style={{
          position: 'relative',
          isolation: 'isolate',
          zIndex: 0,
          height: '33vh',
          minHeight: '200px'
        }}
      />
      
      {/* 보행자 네비게이션 MVP: 코스 이탈 경고 배너 */}
      {mode === 'running' && pedestrianProgress?.isOffCourse && (
        <div className="absolute top-2 left-4 right-4 z-10">
          <div className="bg-red-600/95 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-500">
            <div className="flex items-center gap-2 text-white text-sm">
              <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
              </svg>
              <span className="font-medium">코스에서 벗어났습니다</span>
              <span className="text-xs text-red-200">({pedestrianProgress.distanceToRoute.toFixed(0)}m 이탈)</span>
            </div>
          </div>
        </div>
      )}

      {/* 보행자 네비게이션 MVP: 진행률 표시 */}
      {mode === 'running' && pedestrianProgress && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="bg-black/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white text-sm font-medium">
                진행률: {pedestrianProgress.progressPercent.toFixed(1)}%
              </div>
              <div className="text-[#00FF88] text-sm">
                {((pedestrianProgress.totalDistance - pedestrianProgress.passedDistance) / 1000).toFixed(2)}km 남음
              </div>
            </div>
            
            {/* 진행률 바 */}
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-[#00FF88] h-2 rounded-full transition-all duration-300"
                style={{ width: `${pedestrianProgress.progressPercent}%` }}
              />
            </div>
            
            {/* 거리 정보 */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-300">
              <div>
                통과: {(pedestrianProgress.passedDistance / 1000).toFixed(2)}km
              </div>
              <div>
                총거리: {(pedestrianProgress.totalDistance / 1000).toFixed(2)}km
              </div>
            </div>
          </div>
        </div>
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
