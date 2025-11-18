'use client'

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { GPSCoordinate } from '@/types/database'
import LocationPermission from './LocationPermission'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation, Volume2, VolumeX } from 'lucide-react'
import { useRunningStore } from '@/stores/runningStore'
// 카카오 길찾기 기반 네비게이션 및 음성 안내
import { 
  createRunningNavigation,
  generateVoiceGuidance,
  speakNavigation,
  type NavigationState      // 카카오 네비게이션 상태 (음성 안내용)
} from '@/utils/kakaoNavigation'
// 순수 좌표 계산 및 코스 기반 1인칭 네비게이션
import {
  getProgressOnRoute,
  haversineDistance,
  calculateBearing,
  calculateSmoothBearing,
  NAVIGATION_CONSTANTS,
  type RoutePoint,
  type NavigationProgress   // 1인칭 모드 네비게이션 상태 (진행률, 이탈 여부)
} from '@/utils/navigationEngine'

// 디버깅 플래그
const DEBUG = process.env.NODE_ENV === 'development'

// GPS 포인트 타입 (타임스탬프 포함)
interface GPSPoint {
  lat: number
  lng: number
  timestamp: number | string
  accuracy?: number
}

// 1인칭 모드 상태 타입
interface FirstPersonState {
  isActive: boolean
  trackingWatchId: number | null
  lastPosition: { lat: number; lng: number } | null
  currentBearing: number
  smoothBearing: number
  positionHistory: Array<{ lat: number; lng: number; timestamp: number }>
  currentSpeed: number // m/s
}

// 코스 근접 상태 타입
interface CourseProximity {
  isNearStart: boolean
  isNearFinish: boolean
  distanceToStart: number // meters
  distanceToFinish: number // meters
  hasCompleted: boolean // 완주 여부 (한 번만 호출)
}

interface RunningMapProps {
  isRunning: boolean
  onLocationUpdate?: (location: { lat: number; lng: number }) => void
  onDistanceUpdate?: (distance: number) => void
  userLocation?: { lat: number; lng: number } | null
  showStartPoint?: boolean
  currentCheckpoint?: number
  passedCheckpoints?: number[]
  isCompleted?: boolean
  onNavigationReady?: (startNav: () => void, stopNav: () => void, isNavMode: boolean) => void
  // 화면 모드 구분
  mode?: 'preview' | 'waiting' | 'running'
  // 런닝 통계 데이터
  runningStats?: {
    time: number
    distance: number
    pace: number
  }
  // 런닝 컨트롤 함수들
  onPause?: () => void
  onStop?: () => void
  isPaused?: boolean
  // 시작점 도착 상태 콜백
  onStartPointStatusChange?: (isAtStartPoint: boolean, distanceToStart: number) => void
  // floating 네비게이션 숨김 옵션
  hideFloatingNavigation?: boolean
  // 네비게이션 상태 콜백
  onNavigationUpdate?: (navigationState: NavigationState | null) => void
  // 음성 안내 활성화 상태
  voiceGuidanceEnabled?: boolean
}

export default function RunningMap({ 
  isRunning, 
  onLocationUpdate, 
  onDistanceUpdate, 
  userLocation, 
  showStartPoint = false,
  currentCheckpoint = 0,
  passedCheckpoints = [],
  isCompleted = false,
  onNavigationReady,
  runningStats,
  onPause,
  onStop,
  isPaused = false,
  onStartPointStatusChange,
  hideFloatingNavigation = false,
  onNavigationUpdate,
  voiceGuidanceEnabled = false,
  mode = 'preview' // 기본값은 미리보기 모드
}: RunningMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)
  const [map, setMap] = useState<any>(null)
  const [currentMarker, setCurrentMarker] = useState<any>(null)
  const [polyline, setPolyline] = useState<any>(null)
  const [coursePolyline, setCoursePolyline] = useState<any>(null)
  const [startToCurrentLine, setStartToCurrentLine] = useState<any>(null)
  const [startPointMarker, setStartPointMarker] = useState<any>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown')
  const [initialPosition, setInitialPosition] = useState<GeolocationPosition | null>(null)

  const courseData = useRunningStore((state) => state.courseData)
  const userPath = useRunningStore((state) => state.userPath)
  const updatePosition = useRunningStore((state) => state.updatePosition)
  
  // courseRoute를 useMemo로 메모이제이션하여 불필요한 리렌더링 방지
  const courseRoute = useMemo(() => {
    const route = courseData?.gps_route || []
    DEBUG && console.log('🗺️ RunningMap - 코스 데이터:', {
      courseData: !!courseData,
      courseName: courseData?.name,
      routeLength: route.length,
      mode
    })
    return route
  }, [courseData?.gps_route, mode])

  // 길찾기 경로 상태
  const [routePath, setRoutePath] = useState<any[]>([])
  const [routePolyline, setRoutePolyline] = useState<any>(null)
  const [directionMarkers, setDirectionMarkers] = useState<any[]>([])
  const [isNavigationMode, setIsNavigationMode] = useState(false)
  const [logoBase64, setLogoBase64] = useState<string>('')

  // 네비게이션 상태
  const [navigationStats, setNavigationStats] = useState({
    currentDistance: 0,
    remainingDistance: 0,
    estimatedTime: 0,
    nextDirection: "코스를 따라 직진하세요",
    nextDistance: 0
  })

  // 카카오 길찾기 기반 네비게이션 상태 (음성 안내용)
  const [advancedNavigation, setAdvancedNavigation] = useState<NavigationState | null>(null)
  const [lastVoiceGuidance, setLastVoiceGuidance] = useState<string>('')

  // 1인칭 추적 모드 관련 상태
  const [isFirstPersonMode, setIsFirstPersonMode] = useState(false)
  // 코스 기반 1인칭 네비게이션 상태 (진행률, 이탈 여부)
  const [navigationProgress, setNavigationProgress] = useState<NavigationProgress | null>(null)
  const [firstPersonState, setFirstPersonState] = useState<FirstPersonState>({
    isActive: false,
    trackingWatchId: null,
    lastPosition: null,
    currentBearing: 0,
    smoothBearing: 0,
    positionHistory: [],
    currentSpeed: 0
  })
  
  // 코스 근접 상태
  const [courseProximity, setCourseProximity] = useState<CourseProximity>({
    isNearStart: false,
    isNearFinish: false,
    distanceToStart: Infinity,
    distanceToFinish: Infinity,
    hasCompleted: false
  })

  // 시작점 도착 상태
  const [isAtStartPoint, setIsAtStartPoint] = useState(false)
  const [distanceToStart, setDistanceToStart] = useState<number | null>(null)
  const START_POINT_THRESHOLD = 0.1 // 100m 이내면 시작점 도착으로 간주

  // 시간 포맷 함수
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 페이스 포맷 함수
  const formatPace = (paceMinutes: number) => {
    if (paceMinutes === 0) return "0'00\""
    const minutes = Math.floor(paceMinutes)
    const seconds = Math.round((paceMinutes - minutes) * 60)
    return `${minutes}'${seconds.toString().padStart(2, '0')}"` 
  }

  // 총 거리 계산 함수
  const calculateTotalDistance = useCallback((path: { lat: number; lng: number }[]): number => {
    if (path.length < 2) return 0

    let totalDistance = 0
    for (let i = 1; i < path.length; i++) {
      // haversineDistance는 미터 단위로 반환하므로 km로 변환
      totalDistance += haversineDistance(path[i - 1], path[i]) / 1000
    }
    return totalDistance
  }, [])

  // 카카오맵 초기화
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current || map) return

      // 카카오맵 SDK 로드 대기
      const waitForKakaoMaps = () => {
        return new Promise<void>((resolve, reject) => {
          let attempts = 0
          const maxAttempts = 50 // 5초 대기
          
          const checkKakao = () => {
            attempts++
            
            if ((window as any).kakao?.maps) {
              DEBUG && console.log('✅ 카카오맵 SDK 로드 확인됨')
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
        // 카카오맵 SDK 로드 대기
        await waitForKakaoMaps()

        const kakao = (window as any).kakao
        
        // 카카오맵 로드 (autoload=false이므로 수동 로드)
        if (kakao.maps.load) {
          await new Promise<void>((resolve) => {
            kakao.maps.load(() => {
              DEBUG && console.log('✅ 카카오맵 라이브러리 로드 완료')
              resolve()
            })
          })
        }
        
        // 기본 위치 (서울 시청)
        const defaultCenter = new kakao.maps.LatLng(37.5665, 126.9780)
        
        const mapOptions = {
          center: defaultCenter,
          level: 3,
          mapTypeId: kakao.maps.MapTypeId.ROADMAP
        }

        const newMap = new kakao.maps.Map(mapContainer.current, mapOptions)
        setMap(newMap)

        DEBUG && console.log('✅ 카카오맵 초기화 완료:', {
          mapContainer: !!mapContainer.current,
          mode,
          courseDataExists: !!courseData,
          courseRouteLength: courseRoute.length
        })
      } catch (error) {
        console.error('❌ 카카오맵 초기화 실패:', error)
        
        // 에러 상태 표시
        if (mapContainer.current) {
          mapContainer.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #1a1a1a; color: white; text-align: center; padding: 20px; border-radius: 16px;">
              <div>
                <div style="font-size: 24px; margin-bottom: 15px;">🗺️</div>
                <div style="font-size: 16px; margin-bottom: 10px; font-weight: 600;">지도를 불러올 수 없습니다</div>
                <div style="font-size: 13px; color: #888; margin-bottom: 15px;">카카오맵 API 키를 확인해주세요</div>
                <div style="font-size: 11px; color: #666; line-height: 1.4;">
                  <div>1. .env 파일에 NEXT_PUBLIC_KAKAO_MAP_API_KEY 설정</div>
                  <div>2. 카카오 개발자 콘솔에서 도메인 등록</div>
                  <div>3. 개발 서버 재시작</div>
                </div>
              </div>
            </div>
          `
        }
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

  // 위치 권한 처리
  const handleLocationPermissionGranted = useCallback(() => {
    setLocationPermission('granted')
    // 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          if (onLocationUpdate) {
            onLocationUpdate(currentPos)
          }
          DEBUG && console.log('📍 현재 위치:', currentPos)
        },
        (error) => {
          console.error('위치 가져오기 실패:', error)
        }
      )
    }
  }, [onLocationUpdate])

  const handleLocationPermissionDenied = useCallback(() => {
    setLocationPermission('denied')
  }, [])

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

        // 현재 위치 마커 생성/업데이트
        if (currentMarker) {
          currentMarker.setPosition(center)
        } else {
          const marker = new kakao.maps.Marker({
            position: center,
            map: map
          })
          setCurrentMarker(marker)
        }

        if (onLocationUpdate) {
          onLocationUpdate(currentPos)
        }
      },
      (error) => {
        console.error('현재 위치 가져오기 실패:', error)
        alert('현재 위치를 가져올 수 없습니다.')
      }
    )
  }, [map, currentMarker, onLocationUpdate])

  // 코스 경로와 시작점 표시
  useEffect(() => {
    if (!map) return
    
    // 코스 데이터가 없으면 기본 지도만 표시
    if (!courseRoute || courseRoute.length === 0) {
      DEBUG && console.log('📍 코스 데이터가 없음, 기본 지도 표시')
      return
    }

    const kakao = (window as any).kakao

    try {
      // 기존 코스 경로 제거
      if (coursePolyline) {
        coursePolyline.setMap(null)
      }

      // 새로운 코스 경로 생성
      const path = courseRoute.map((point: any) => new kakao.maps.LatLng(point.lat, point.lng))
      const newPolyline = new kakao.maps.Polyline({
        path: path,
        strokeWeight: 4,
        strokeColor: mode === 'running' ? '#FF6B00' : '#00FF88',
        strokeOpacity: 0.8,
        strokeStyle: 'solid'
      })

      newPolyline.setMap(map)
      setCoursePolyline(newPolyline)

      // 시작점 마커 표시
      if (showStartPoint && courseRoute.length > 0) {
        const startPoint = courseRoute[0]
        
        // 기존 시작점 마커 제거
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

        // 지도 중심을 시작점으로 이동
        map.setCenter(new kakao.maps.LatLng(startPoint.lat, startPoint.lng))
        map.setLevel(3)
      }

      DEBUG && console.log('✅ 코스 경로 표시 완료:', courseRoute.length, '개 포인트')
    } catch (error) {
      console.error('❌ 코스 경로 표시 실패:', error)
    }
  }, [map, courseRoute, showStartPoint, logoBase64, coursePolyline, startPointMarker, mode])

  // 1인칭 추적 모드 시작
  const startFirstPersonMode = useCallback(() => {
    if (mode !== 'running') {
      DEBUG && console.warn('[FirstPersonMode] 런닝 모드가 아님, 1인칭 모드 비활성화')
      alert('런닝 시작 후에 1인칭 모드를 사용할 수 있습니다.')
      return
    }
    
    if (!courseRoute || courseRoute.length < 2) {
      DEBUG && console.warn('[FirstPersonMode] 코스 데이터가 없음')
      return
    }
    
    if (!map) {
      DEBUG && console.warn('[FirstPersonMode] 지도가 준비되지 않음')
      return
    }
    
    if (!navigator.geolocation) {
      DEBUG && console.warn('[FirstPersonMode] Geolocation API 지원 안함')
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.')
      return
    }
    
    DEBUG && console.log('🚀 1인칭 추적 모드 시작')
    
    setIsFirstPersonMode(true)
    
    // 기존 추적 정리
    if (firstPersonState.trackingWatchId !== null) {
      navigator.geolocation.clearWatch(firstPersonState.trackingWatchId)
      setFirstPersonState(prev => ({ ...prev, trackingWatchId: null }))
    }

    // 실시간 위치 추적 시작
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    }

    const newWatchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!isFirstPersonMode || !isMountedRef.current || !map) {
          return
        }
        
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        const timestamp = Date.now()
        DEBUG && console.log('📍 1인칭 모드 위치 업데이트:', newPosition)

        // 위치 히스토리 업데이트 및 상태 계산
        setFirstPersonState(prev => {
          const newHistory = [...prev.positionHistory, { ...newPosition, timestamp }].slice(-8)
          const speed = calculateSpeed(newHistory)
          const smoothBearing = calculateSmoothBearing(newHistory)
          
          return {
            ...prev,
            lastPosition: newPosition,
            positionHistory: newHistory,
            currentSpeed: speed,
            smoothBearing
          }
        })

        // 1인칭 모드에서 지도 카메라 및 회전 처리
        const kakao = (window as any).kakao
        const center = new kakao.maps.LatLng(newPosition.lat, newPosition.lng)
        map.setCenter(center)
        map.setLevel(2) // 1인칭 모드 전용 줌 레벨
        
        // 방향 계산 후 지도 회전 (속도가 충분할 때만)
        if (firstPersonState.lastPosition && firstPersonState.currentSpeed > NAVIGATION_CONSTANTS.MIN_SPEED_FOR_BEARING) {
          // 지도 컨테이너 회전 (CSS transform 사용)
          if (mapContainer.current) {
            const rotationDegree = firstPersonState.smoothBearing
            mapContainer.current.style.transform = `rotate(${rotationDegree}deg)`
            mapContainer.current.style.transformOrigin = 'center center'
            mapContainer.current.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }
          
          DEBUG && console.log('🧭 지도 회전:', firstPersonState.smoothBearing.toFixed(1) + '도')
        }
      
        // 현재 위치 마커 업데이트 (1인칭 모드에서는 화살표 마커 사용)
        if (currentMarker) {
          currentMarker.setPosition(center)
          
          // 속도가 충분할 때만 방향 화살표 업데이트
          if (firstPersonState.currentSpeed > NAVIGATION_CONSTANTS.MIN_SPEED_FOR_BEARING) {
            const arrowImageSrc = createDirectionArrowImage(firstPersonState.smoothBearing)
            const imageSize = new kakao.maps.Size(40, 40)
            const markerImage = new kakao.maps.MarkerImage(arrowImageSrc, imageSize)
            currentMarker.setImage(markerImage)
          }
        } else {
          // 초기 방향 화살표 마커 생성
          const arrowImageSrc = createDirectionArrowImage(firstPersonState.smoothBearing)
          const imageSize = new kakao.maps.Size(40, 40)
          const markerImage = new kakao.maps.MarkerImage(arrowImageSrc, imageSize)
          
          const marker = new kakao.maps.Marker({
            position: center,
            image: markerImage,
            map: map
          })
          setCurrentMarker(marker)
        }

        // 코스 진행률 계산
        if (courseRoute.length > 1) {
          const routePoints: RoutePoint[] = courseRoute.map((point, index) => ({
            lat: point.lat,
            lng: point.lng,
            order: index
          }))

          const progress = getProgressOnRoute(routePoints, newPosition)
          setNavigationProgress(progress)
          
          DEBUG && console.log('📊 코스 진행률:', {
            진행률: `${(progress.progressRatio * 100).toFixed(1)}%`,
            누적거리: `${progress.cumulativeDist.toFixed(0)}m`,
            남은거리: `${progress.remainingDistance.toFixed(0)}m`,
            코스이탈: progress.isOffRoute ? '예' : '아니오',
            이탈거리: `${progress.distanceToSegment.toFixed(1)}m`
          })
        }

        // 위치 업데이트 콜백 호출
        if (onLocationUpdate) {
          onLocationUpdate(newPosition)
        }
      },
      (error) => {
        DEBUG && console.error('❌ 위치 추적 오류:', error.message)
      },
      options
    )

    setFirstPersonState(prev => ({ ...prev, trackingWatchId: newWatchId }))
  }, [map, currentMarker, firstPersonState.trackingWatchId, firstPersonState.lastPosition, firstPersonState.currentSpeed, firstPersonState.smoothBearing, courseRoute, isFirstPersonMode, mode, onLocationUpdate])

  // 속도 계산 함수
  const calculateSpeed = useCallback((positions: {lat: number, lng: number, timestamp: number}[]) => {
    if (positions.length < 2) return 0
    
    const recent = positions.slice(-2)
    const distance = haversineDistance(recent[0], recent[1]) // meters
    const timeDiff = (recent[1].timestamp - recent[0].timestamp) / 1000 // seconds
    
    return timeDiff > 0 ? distance / timeDiff : 0 // m/s
  }, [])

  // 방향 화살표 이미지 생성 함수
  const createDirectionArrowImage = useCallback((bearing: number) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const size = 40
    
    canvas.width = size
    canvas.height = size
    
    if (ctx) {
      // 캔버스 중심으로 이동
      ctx.translate(size / 2, size / 2)
      
      // 방향각만큼 회전 (북쪽 기준이므로 -90도 보정)
      ctx.rotate((bearing - 90) * Math.PI / 180)
      
      // 화살표 그리기
      ctx.fillStyle = '#00FF88'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      
      // 화살표 모양 경로
      ctx.beginPath()
      ctx.moveTo(0, -15)  // 화살표 끝
      ctx.lineTo(-8, 5)   // 왼쪽 날개
      ctx.lineTo(-3, 5)   // 왼쪽 몸통
      ctx.lineTo(-3, 15)  // 왼쪽 꼬리
      ctx.lineTo(3, 15)   // 오른쪽 꼬리
      ctx.lineTo(3, 5)    // 오른쪽 몸통
      ctx.lineTo(8, 5)    // 오른쪽 날개
      ctx.closePath()
      
      // 채우기 및 테두리
      ctx.fill()
      ctx.stroke()
      
      // 중심점 표시
      ctx.beginPath()
      ctx.arc(0, 0, 3, 0, 2 * Math.PI)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.stroke()
    }
    
    return canvas.toDataURL()
  }, [])

  // 1인칭 추적 모드 종료
  const stopFirstPersonMode = useCallback(() => {
    DEBUG && console.log('🛑 1인칭 추적 모드 종료')
    
    if (!isFirstPersonMode) {
      DEBUG && console.log('[FirstPersonMode] 이미 비활성화됨')
      return
    }
    
    setIsFirstPersonMode(false)
    
    // 위치 추적 정리
    if (firstPersonState.trackingWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(firstPersonState.trackingWatchId)
    }
    
    // 상태 초기화
    setFirstPersonState({
      isActive: false,
      trackingWatchId: null,
      lastPosition: null,
      currentBearing: 0,
      smoothBearing: 0,
      positionHistory: [],
      currentSpeed: 0
    })
    
    // 지도 회전 초기화 (CSS transform 제거)
    if (mapContainer.current) {
      mapContainer.current.style.transform = 'none'
      mapContainer.current.style.transformOrigin = 'center center'
      mapContainer.current.style.transition = 'transform 0.5s ease-out'
      
      // 전환 완료 후 transition 제거
      setTimeout(() => {
        if (mapContainer.current && !isFirstPersonMode) {
          mapContainer.current.style.transition = ''
        }
      }, 500)
    }
    
    // 마커를 기본 상태로 복원
    if (currentMarker && map) {
      const marker = new (window as any).kakao.maps.Marker({
        position: currentMarker.getPosition(),
        map: map
      })
      currentMarker.setMap(null)
      setCurrentMarker(marker)
    }
  }, [isFirstPersonMode, firstPersonState.trackingWatchId, currentMarker, map])

  // onNavigationReady 콜백 호출 (1인칭 추적 모드 함수들 전달)
  useEffect(() => {
    if (onNavigationReady) {
      onNavigationReady(startFirstPersonMode, stopFirstPersonMode, isFirstPersonMode)
    }
  }, [onNavigationReady, startFirstPersonMode, stopFirstPersonMode, isFirstPersonMode])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
      // 1인칭 추적 모드 정리
      if (firstPersonState.trackingWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(firstPersonState.trackingWatchId)
      }
    }
  }, [watchId, firstPersonState.trackingWatchId])

  // 위치 권한이 아직 확인되지 않았으면 권한 요청 UI 표시
  if (locationPermission === 'unknown') {
    return (
      <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-800">
        <LocationPermission
          onPermissionGranted={handleLocationPermissionGranted}
          onPermissionDenied={handleLocationPermissionDenied}
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className={`w-full rounded-2xl overflow-hidden border border-gray-800 relative z-0 ${
          isFirstPersonMode ? 'h-80' : 'h-64'
        }`}
        style={{
          position: 'relative',
          isolation: 'isolate',
          zIndex: 0,
          minHeight: '256px' // 최소 높이 보장
        }}
      />
      
      {/* off-route 경고 배너 (1인칭 모드에서만 표시) */}
      {isFirstPersonMode && navigationProgress?.isOffRoute && (
        <motion.div 
          className="absolute top-2 left-4 right-4 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="bg-red-600/95 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-500">
            <div className="flex items-center gap-2 text-white text-sm">
              <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
              </svg>
              <span className="font-medium">코스에서 벗어났습니다</span>
              <span className="text-xs text-red-200">({navigationProgress.distanceToSegment.toFixed(0)}m 이탈)</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 1인칭 모드 진행률 표시 */}
      {isFirstPersonMode && navigationProgress && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="bg-black/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white text-sm font-medium">
                진행률: {(navigationProgress.progressRatio * 100).toFixed(1)}%
              </div>
              <div className="text-[#00FF88] text-sm">
                {(navigationProgress.remainingDistance / 1000).toFixed(2)}km 남음
              </div>
            </div>
            
            {/* 진행률 바 */}
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-[#00FF88] h-2 rounded-full transition-all duration-300"
                style={{ width: `${navigationProgress.progressRatio * 100}%` }}
              />
            </div>
            
            {/* 속도 및 방향 정보 */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-300">
              <div>
                속도: {(firstPersonState.currentSpeed * 3.6).toFixed(1)} km/h
              </div>
              <div>
                방향: {firstPersonState.smoothBearing.toFixed(0)}°
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1인칭 모드 토글 버튼 (런닝 모드에서만) */}
      {mode === 'running' && (
        <button
          onClick={isFirstPersonMode ? stopFirstPersonMode : startFirstPersonMode}
          className={`absolute top-4 right-4 w-12 h-12 rounded-full shadow-lg border-2 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-10 ${
            isFirstPersonMode 
              ? 'bg-[#00FF88] border-[#00FF88] text-black' 
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
          title={isFirstPersonMode ? '1인칭 모드 종료' : '1인칭 모드 시작'}
        >
          <Navigation className="w-5 h-5" />
        </button>
      )}

      {/* GPS 상태 표시 */}
      <div className={`absolute bg-black/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-800 ${
        isFirstPersonMode ? 'bottom-4 right-4' : 'top-4 right-4'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            locationPermission === 'granted' 
              ? (isRunning ? 'bg-[#00FF88] animate-pulse' : 'bg-green-500')
              : 'bg-red-500'
          }`}></div>
          <span className="text-xs text-white">
            {locationPermission === 'granted' 
              ? (isRunning ? 'GPS 추적 중' : 'GPS 준비됨')
              : '위치 권한 없음'
            }
          </span>
        </div>
      </div>

      {/* 시작점 도착 상태 또는 경로 정보 */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-800">
        {!isRunning && courseRoute.length > 0 ? (
          // 런닝 시작 전: 시작점 도착 상태 표시
          <div className="text-xs text-white">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${
                isAtStartPoint ? 'bg-[#00FF88] animate-pulse' : 'bg-yellow-500'
              }`}></div>
              <span className={isAtStartPoint ? 'text-[#00FF88]' : 'text-yellow-400'}>
                {isAtStartPoint ? '시작점 도착' : '시작점으로 이동'}
              </span>
            </div>
            {distanceToStart !== null && (
              <div className="text-gray-300">
                거리: {distanceToStart < 1 
                  ? `${Math.round(distanceToStart * 1000)}m`
                  : `${distanceToStart.toFixed(1)}km`
                }
              </div>
            )}
            {isAtStartPoint && (
              <div className="text-[#00FF88] text-xs mt-1 animate-pulse">
                ✓ 런닝 시작 가능
              </div>
            )}
          </div>
        ) : (
          // 런닝 중: 경로 정보 표시
          <div className="text-xs text-white">
            <div>경로 포인트: {userPath.length}</div>
            {userPath.length > 1 && (
              <div className="text-[#00FF88]">
                거리: {(userPath.reduce((total, point, index) => {
                  if (index === 0) return 0
                  const prev = userPath[index - 1]
                  return total + haversineDistance(prev, point) / 1000
                }, 0)).toFixed(2)}km
              </div>
            )}
          </div>
        )}
      </div>

      {/* 현재 위치 버튼 (대기/미리보기 모드에서만) */}
      {(mode === 'waiting' || mode === 'preview') && (
        <button
          onClick={moveToCurrentLocation}
          className="absolute bottom-4 right-4 w-12 h-12 bg-white hover:bg-gray-50 rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-10"
          title="현재 위치로 이동"
        >
          <Navigation className="w-5 h-5 text-gray-600" />
        </button>
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
            {userLocation && courseRoute.length > 0 && (
              <div className="text-xs text-gray-300 mt-1">
                시작점까지 {(haversineDistance(userLocation, courseRoute[0]) / 1000).toFixed(2)}km
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
