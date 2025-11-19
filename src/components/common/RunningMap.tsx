'use client'

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { GPSCoordinate } from '@/types/database'
import LocationPermission from './LocationPermission'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation, Volume2, VolumeX } from 'lucide-react'
import { useRunningStore } from '@/stores/runningStore'
// 보행자 네비게이션 MVP 추가
import { 
  prepareRoutePoints, 
  calculateNavigationProgress, 
  type RoutePointWithDistance, 
  type NavigationProgress as PedestrianProgress 
} from '@/utils/mapUtils'
// 카카오맵 네비게이션 함수들
import { 
  generateKakaoBicycleNavUrl, 
  generateKakaoWebFallbackUrl 
} from '@/services/routeOptimization'
// 카카오 길찾기 기반 네비게이션 및 음성 안내
import { 
  createRunningNavigation,
  generateVoiceGuidance,
  speakNavigation,
  type NavigationState      // 카카오 네비게이션 상태 (음성 안내용)
} from '@/utils/kakaoNavigation'
import { kakaoNavService } from '../../services/kakaoNavigation'
import type { KakaoNavigationRoute, TurnInstruction } from '../../services/kakaoNavigation'
import FullScreenNavigation from '../navigation/FullScreenNavigation'
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
  onNavigationReady?: (startNav: () => void, stopNav: () => void, isNavMode: boolean, startFullScreenNav: () => void) => void
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
  // 보행자 네비게이션 MVP: 진행률 콜백
  onProgressUpdate?: (progress: PedestrianProgress | null) => void
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
  onProgressUpdate,
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
  const currentPosition = useRunningStore((state) => state.currentPosition)
  
  // courseRoute를 useMemo로 메모이제이션하여 불필요한 리렌더링 방지
  const courseRoute = useMemo(() => {
    const route = courseData?.gps_route || []
    DEBUG && console.log('🗺️ RunningMap - 코스 데이터:', {
      courseData: !!courseData,
      courseName: courseData?.name,
      routeLength: route.length,
      mode,
      hasRoute: route.length > 0
    })
    return route
  }, [courseData?.gps_route, mode])

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

  // 길찾기 경로 상태
  const [routePath, setRoutePath] = useState<any[]>([])
  const [routePolyline, setRoutePolyline] = useState<any>(null)
  const [directionMarkers, setDirectionMarkers] = useState<any[]>([])
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

  // 보행자 네비게이션 MVP 상태
  const [pedestrianProgress, setPedestrianProgress] = useState<PedestrianProgress | null>(null)
  const [routePoints, setRoutePoints] = useState<RoutePointWithDistance[]>([])
  
  // 앱 내 카카오맵 네비게이션 상태 (자동차 네비게이션 스타일)
  const [isInAppNavActive, setIsInAppNavActive] = useState(false)
  const [navigationRoute, setNavigationRoute] = useState<KakaoNavigationRoute | null>(null)
  const [currentTurnInstruction, setCurrentTurnInstruction] = useState<TurnInstruction | null>(null)
  
  // 네비게이션 모드 상태 (지도 회전 + 방향 추적)
  const [isNavigationMode, setIsNavigationMode] = useState(false)
  
  // 전체 화면 네비게이션 상태
  const [isFullScreenNavActive, setIsFullScreenNavActive] = useState(false)
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
  const START_POINT_THRESHOLD = 0.05 // 50m 이내면 시작점 도착으로 간주

  // 보행자 네비게이션 MVP: RunningStore의 currentPosition 변경 시 진행률 계산
  useEffect(() => {
    if (mode === 'running' && currentPosition && routePoints.length > 0) {
      const progress = calculateNavigationProgress(routePoints, currentPosition)
      setPedestrianProgress(progress)
      
      // 부모 컴포넌트에 진행률 전달
      if (onProgressUpdate) {
        onProgressUpdate(progress)
      }
      
      DEBUG && console.log('🚶‍♂️ RunningStore 위치 업데이트 - 보행자 네비게이션 진행률:', {
        진행률: `${progress.progressPercent.toFixed(1)}%`,
        통과거리: `${(progress.passedDistance / 1000).toFixed(2)}km`,
        총거리: `${(progress.totalDistance / 1000).toFixed(2)}km`,
        코스이탈: progress.isOffCourse ? '예' : '아니오',
        이탈거리: `${progress.distanceToRoute.toFixed(1)}m`
      })
    } else if (onProgressUpdate) {
      // 런닝 모드가 아니거나 데이터가 없으면 null 전달
      onProgressUpdate(null)
    }
  }, [mode, currentPosition, routePoints, onProgressUpdate])

  // 앱 내 카카오맵 네비게이션 시작
  const startInAppNavigation = useCallback(async () => {
    if (!courseRoute || courseRoute.length === 0 || !userLocation) {
      alert('경로 정보가 없거나 현재 위치를 확인할 수 없습니다.')
      return
    }

    try {
      console.log('🗺️ 앱 내 카카오맵 네비게이션 시작')
      
      // 시작점과 끝점 설정
      const origin = { lat: userLocation.lat, lng: userLocation.lng }
      const destination = { lat: courseRoute[courseRoute.length - 1].lat, lng: courseRoute[courseRoute.length - 1].lng }
      
      // 중간 경유지 (GPX 포인트 중 일부만 사용)
      const waypoints = courseRoute
        .slice(1, -1)
        .filter((_, index) => index % 10 === 0) // 10개마다 하나씩만 경유지로 사용
        .map(point => ({ lat: point.lat, lng: point.lng }))

      // 카카오 네비게이션 서비스로 경로 계산
      const route = await kakaoNavService.calculateRoute(origin, destination, waypoints)
      setNavigationRoute(route)
      setIsInAppNavActive(true)

      // 지도에 경로 표시
      if (map && route) {
        const kakao = (window as any).kakao
        
        // 기존 경로 폴리라인 제거
        if (routePolyline) {
          routePolyline.setMap(null)
        }

        // 새로운 네비게이션 경로 폴리라인 생성
        const routePath = route.segments.flatMap(segment => 
          segment.points.map(point => new kakao.maps.LatLng(point.lat, point.lng))
        )
        
        const newRoutePolyline = new kakao.maps.Polyline({
          path: routePath,
          strokeWeight: 6,
          strokeColor: '#FF6B00', // 주황색으로 네비게이션 경로 표시
          strokeOpacity: 0.9,
          strokeStyle: 'solid'
        })

        newRoutePolyline.setMap(map)
        setRoutePolyline(newRoutePolyline)

        // 지도 범위를 경로에 맞게 조정
        const bounds = new kakao.maps.LatLngBounds()
        routePath.forEach(point => bounds.extend(point))
        map.setBounds(bounds, 50)
      }

      console.log('✅ 앱 내 네비게이션 경로 계산 완료:', route)
    } catch (error) {
      console.error('❌ 앱 내 네비게이션 시작 실패:', error)
      alert('네비게이션을 시작할 수 없습니다. 다시 시도해주세요.')
    }
  }, [courseRoute, userLocation, map, routePolyline])

  // 앱 내 네비게이션 중지
  const stopInAppNavigation = useCallback(() => {
    setIsInAppNavActive(false)
    setNavigationRoute(null)
    setCurrentTurnInstruction(null)
    
    // 네비게이션 경로 폴리라인 제거
    if (routePolyline) {
      routePolyline.setMap(null)
      setRoutePolyline(null)
    }

    // 원래 코스 폴리라인 복원
    if (map && courseRoute.length > 0) {
      const kakao = (window as any).kakao
      const path = courseRoute.map((point: any) => new kakao.maps.LatLng(point.lat, point.lng))
      const coursePolylineRestored = new kakao.maps.Polyline({
        path: path,
        strokeWeight: 4,
        strokeColor: mode === 'running' ? '#FF6B00' : '#00FF88',
        strokeOpacity: 0.8,
        strokeStyle: 'solid'
      })
      coursePolylineRestored.setMap(map)
      setCoursePolyline(coursePolylineRestored)
    }

    console.log('🛑 앱 내 네비게이션 중지')
  }, [routePolyline, map, courseRoute, mode])

  // 현재 위치 기준 턴 안내 업데이트
  useEffect(() => {
    if (isInAppNavActive && navigationRoute && currentPosition) {
      const turnInstruction = kakaoNavService.getNextTurnInstruction(
        navigationRoute, 
        { lat: currentPosition.lat, lng: currentPosition.lng }
      )
      setCurrentTurnInstruction(turnInstruction)
    }
  }, [isInAppNavActive, navigationRoute, currentPosition])

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
    DEBUG && console.log('🗺️ 지도 초기화 시작:', {
      hasMapContainer: !!mapContainer.current,
      mapExists: !!map,
      mode
    })

    const initializeMap = async () => {
      // DOM 마운트 대기
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!mapContainer.current) {
        console.error('❌ mapContainer.current가 없음')
        return
      }
      
      if (map) {
        DEBUG && console.log('✅ 지도가 이미 존재함, 초기화 스킵')
        return
      }

      DEBUG && console.log('🔄 카카오맵 SDK 로드 대기 시작')

      // 카카오맵 SDK 로드 대기
      const waitForKakaoMaps = () => {
        return new Promise<void>((resolve, reject) => {
          let attempts = 0
          const maxAttempts = 50 // 5초 대기
          
          const checkKakao = () => {
            attempts++
            DEBUG && console.log(`🔍 카카오맵 SDK 체크 시도 ${attempts}/${maxAttempts}`)
            
            if ((window as any).kakao?.maps) {
              DEBUG && console.log('✅ 카카오맵 SDK 로드 확인됨')
              resolve()
              return
            }
            
            if (attempts >= maxAttempts) {
              console.error('❌ 카카오맵 SDK 로드 타임아웃')
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

        // 지도 컨테이너 크기 확인
        const containerWidth = mapContainer.current?.offsetWidth || 0
        const containerHeight = mapContainer.current?.offsetHeight || 0
        
        console.log('🗺️ [DEBUG] 지도 생성 시작:', {
          mapContainer: !!mapContainer.current,
          containerSize: { width: containerWidth, height: containerHeight },
          mapOptions,
          kakaoMapsAvailable: !!(window as any).kakao?.maps
        })

        if (containerWidth === 0 || containerHeight === 0) {
          console.error('❌ [DEBUG] 지도 컨테이너 크기가 0입니다:', { width: containerWidth, height: containerHeight })
          // 추가 대기 후 재시도
          setTimeout(() => initializeMap(), 200)
          return
        }

        const newMap = new kakao.maps.Map(mapContainer.current, mapOptions)
        setMap(newMap)

        console.log('✅ [DEBUG] 카카오맵 초기화 완료:', {
          mapContainer: !!mapContainer.current,
          mapCreated: !!newMap,
          mode,
          courseDataExists: !!courseData,
          courseRouteLength: courseRoute.length,
          mapSize: {
            width: mapContainer.current?.offsetWidth,
            height: mapContainer.current?.offsetHeight
          }
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
  }, [map, courseRoute.length])

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

  // waiting 모드에서 자동으로 위치 권한 요청 및 추적 시작
  useEffect(() => {
    if (mode === 'waiting') {
      // 위치 권한이 unknown이면 자동으로 권한 요청
      if (locationPermission === 'unknown' && navigator.geolocation) {
        DEBUG && console.log('🎯 waiting 모드: 자동 위치 권한 요청')
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // 권한 허용됨
            setLocationPermission('granted')
            const currentPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            if (onLocationUpdate) {
              onLocationUpdate(currentPos)
            }
            DEBUG && console.log('✅ 위치 권한 허용 및 초기 위치 획득:', currentPos)
          },
          (error) => {
            // 권한 거부됨
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
      
      // 위치 권한이 허용되었고 아직 추적 중이 아니면 추적 시작
      if (locationPermission === 'granted' && !watchId) {
        DEBUG && console.log('🎯 waiting 모드: 자동 위치 추적 시작')
        
        const options: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000 // 30초 캐시
        }

        const newWatchId = navigator.geolocation.watchPosition(
          (position) => {
            if (!isMountedRef.current) return
            
            const currentPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            
            DEBUG && console.log('📍 waiting 모드 위치 업데이트:', currentPos)
            
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
    
    // waiting 모드가 아니면 위치 추적 중단
    if (mode !== 'waiting' && watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
      DEBUG && console.log('🛑 waiting 모드 종료: 위치 추적 중단')
    }
  }, [mode, locationPermission, watchId, onLocationUpdate])

  const handleLocationPermissionDenied = useCallback(() => {
    setLocationPermission('denied')
  }, [])

  // 카카오맵으로 시작점까지 길찾기
  const openKakaoMapNavigation = useCallback(() => {
    if (!courseRoute || courseRoute.length === 0) {
      alert('코스 정보가 없습니다.')
      return
    }

    const startPoint = courseRoute[0]
    
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
      
      DEBUG && console.log('🗺️ 카카오맵 네비게이션:', kakaoNavUrl)
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
            
            DEBUG && console.log('🗺️ 카카오맵 네비게이션 (위치 획득 후):', kakaoNavUrl)
          },
          (error) => {
            console.error('현재 위치 가져오기 실패:', error)
            // 위치를 가져올 수 없으면 도착지만 표시
            const kakaoMapUrl = `https://map.kakao.com/link/to/런닝 시작점,${startPoint.lat},${startPoint.lng}`
            window.open(kakaoMapUrl, '_blank')
            DEBUG && console.log('🗺️ 카카오맵 도착지만 열기:', kakaoMapUrl)
          }
        )
      } else {
        // Geolocation을 지원하지 않으면 도착지만 표시
        const kakaoMapUrl = `https://map.kakao.com/link/to/런닝 시작점,${startPoint.lat},${startPoint.lng}`
        window.open(kakaoMapUrl, '_blank')
        DEBUG && console.log('🗺️ 카카오맵 도착지만 열기 (Geolocation 미지원):', kakaoMapUrl)
      }
    }
  }, [courseRoute, userLocation])

  // 현재 위치로 이동
  const moveToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.')
      return
    }

    if (!map) {
      alert('지도가 로딩 중입니다. 잠시 후 다시 시도해주세요.')
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
        
        let errorMessage = '현재 위치를 가져올 수 없습니다.'
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.'
            break
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청 시간이 초과되었습니다. 다시 시도해주세요.'
            break
        }
        
        alert(errorMessage)
      }
    )
  }, [map, currentMarker, onLocationUpdate])

  // 현재 위치 마커 업데이트 (waiting 모드에서 자동 표시)
  useEffect(() => {
    if (!map || !userLocation) return
    
    const kakao = (window as any).kakao
    
    try {
      // 기존 현재 위치 마커 제거
      if (currentMarker) {
        currentMarker.setMap(null)
      }
      
      // 새로운 현재 위치 마커 생성
      const position = new kakao.maps.LatLng(userLocation.lat, userLocation.lng)
      const marker = new kakao.maps.Marker({
        position: position,
        map: map
      })
      
      setCurrentMarker(marker)
      DEBUG && console.log('📍 현재 위치 마커 업데이트:', userLocation)
      
      // waiting 모드에서는 현재 위치도 지도 범위에 포함
      if (mode === 'waiting' && courseRoute.length > 0) {
        const bounds = new kakao.maps.LatLngBounds()
        
        // 현재 위치 추가
        bounds.extend(position)
        
        // 모든 경로 포인트 추가
        courseRoute.forEach((point: any) => {
          bounds.extend(new kakao.maps.LatLng(point.lat, point.lng))
        })
        
        // 지도 범위 조정
        map.setBounds(bounds, 50)
        DEBUG && console.log('🗺️ waiting 모드: 현재 위치 + 코스 범위로 지도 조정')
      }
    } catch (error) {
      console.error('❌ 현재 위치 마커 업데이트 실패:', error)
    }
  }, [map, userLocation, mode, courseRoute])

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

      // 시작점 마커 표시 및 전체 경로 보기
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

        // waiting 모드가 아닌 경우에만 지도 범위 조정 (waiting 모드는 현재 위치 마커 useEffect에서 처리)
        if (mode !== 'waiting') {
          // 다른 모드에서는 시작점 중심으로
          map.setCenter(new kakao.maps.LatLng(startPoint.lat, startPoint.lng))
          map.setLevel(3)
        }
      }

      DEBUG && console.log('✅ 코스 경로 표시 완료:', courseRoute.length, '개 포인트')
    } catch (error) {
      console.error('❌ 코스 경로 표시 실패:', error)
    }
  }, [map, courseRoute, showStartPoint, logoBase64, coursePolyline, startPointMarker, mode])

  // 네비게이션 모드 시작 (자동차 네비게이션 스타일)
  const startNavigationMode = useCallback(() => {
    if (mode !== 'running') {
      DEBUG && console.warn('[NavigationMode] 런닝 모드가 아님, 네비게이션 모드 비활성화')
      alert('런닝 시작 후에 네비게이션 모드를 사용할 수 있습니다.')
      return
    }
    
    if (!courseRoute || courseRoute.length < 2) {
      DEBUG && console.warn('[NavigationMode] 코스 데이터가 없음')
      return
    }
    
    if (!map) {
      DEBUG && console.warn('[NavigationMode] 지도가 초기화되지 않음')
      return
    }

    DEBUG && console.log('🎯 네비게이션 모드 시작')
    
    if (isNavigationMode) {
      DEBUG && console.log('[NavigationMode] 이미 활성화됨')
      return
    }
    
    setIsNavigationMode(true)
    
    // 네비게이션 상태 업데이트 콜백 호출
    if (onNavigationUpdate) {
      onNavigationUpdate({ isNavigationMode: true } as any)
    }
    
    // 기존 추적 정리
    if (firstPersonState.trackingWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(firstPersonState.trackingWatchId)
    }

    // 위치 추적 옵션
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    }

    const newWatchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!isNavigationMode || !isMountedRef.current || !map) {
          return
        }
        
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        const timestamp = Date.now()
        DEBUG && console.log('📍 네비게이션 모드 위치 업데이트:', newPosition)

        // 위치 히스토리 업데이트 및 상태 계산
        let currentSpeed = 0
        let smoothBearing = 0
        
        setFirstPersonState(prev => {
          const newHistory = [...prev.positionHistory, { ...newPosition, timestamp }].slice(-8)
          currentSpeed = calculateSpeed(newHistory)
          smoothBearing = calculateSmoothBearing(newHistory)
          
          return {
            ...prev,
            lastPosition: newPosition,
            positionHistory: newHistory,
            currentSpeed,
            smoothBearing
          }
        })

        // 지도 중심을 현재 위치로 이동
        map.setCenter(new kakao.maps.LatLng(newPosition.lat, newPosition.lng))
        
        // 현재 위치 마커 업데이트
        if (currentMarker) {
          currentMarker.setPosition(new kakao.maps.LatLng(newPosition.lat, newPosition.lng))
          
          // 방향이 있으면 방향 화살표로 마커 변경
          if (smoothBearing !== null && currentSpeed > 0.5) { // 0.5 m/s (1.8 km/h) 이상일 때만
            const arrowImageSrc = createDirectionArrowImage(smoothBearing)
            const arrowImage = new kakao.maps.MarkerImage(
              arrowImageSrc,
              new kakao.maps.Size(40, 40),
              {
                offset: new kakao.maps.Point(20, 20)
              }
            )
            currentMarker.setImage(arrowImage)
          }
        }
        
        // 지도 회전 (CSS transform 사용) - 자동차 네비게이션 스타일
        if (mapContainer.current && smoothBearing !== null) {
          const rotation = -smoothBearing // 북쪽을 위로 맞추기 위해 음수
          mapContainer.current.style.transform = `rotate(${rotation}deg)`
          mapContainer.current.style.transformOrigin = 'center center'
          mapContainer.current.style.transition = 'transform 0.3s ease-out'
        }
      
        // 코스 진행률 계산 및 업데이트 (네비게이션 모드에서만)
        if (courseRoute.length > 0) {
          const progress = getProgressOnRoute(courseRoute, newPosition)
          
          DEBUG && console.log('🎯 네비게이션 모드 - 코스 진행률:', {
            진행률: `${(progress.progressRatio * 100).toFixed(1)}%`,
            남은거리: `${progress.remainingDistance.toFixed(0)}m`,
            코스이탈: progress.isOffRoute ? '예' : '아니오',
            이탈거리: `${progress.distanceToSegment.toFixed(1)}m`
          })
        }

        // 위치 업데이트 콜백 호출
        if (onLocationUpdate) {
          onLocationUpdate(newPosition)
        }

        // 보행자 네비게이션 MVP: 진행률 계산 (런닝 모드에서만)
        if (mode === 'running' && routePoints.length > 0) {
          const progress = calculateNavigationProgress(routePoints, newPosition)
          setPedestrianProgress(progress)
          
          DEBUG && console.log('🚶‍♂️ 보행자 네비게이션 진행률:', {
            진행률: `${progress.progressPercent.toFixed(1)}%`,
            통과거리: `${(progress.passedDistance / 1000).toFixed(2)}km`,
            총거리: `${(progress.totalDistance / 1000).toFixed(2)}km`,
            코스이탈: progress.isOffCourse ? '예' : '아니오',
            이탈거리: `${progress.distanceToRoute.toFixed(1)}m`
          })
        }
      },
      (error) => {
        DEBUG && console.error('❌ 위치 추적 오류:', error.message)
      },
      options
    )

    setFirstPersonState(prev => ({ ...prev, trackingWatchId: newWatchId }))
  }, [map, currentMarker, firstPersonState.trackingWatchId, firstPersonState.lastPosition, firstPersonState.currentSpeed, firstPersonState.smoothBearing, courseRoute, isNavigationMode, mode, onLocationUpdate, onNavigationUpdate])

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

  // 네비게이션 모드 종료
  const stopNavigationMode = useCallback(() => {
    DEBUG && console.log('🛑 네비게이션 모드 종료')
    
    if (!isNavigationMode) {
      DEBUG && console.log('[NavigationMode] 이미 비활성화됨')
      return
    }
    
    setIsNavigationMode(false)
    
    // 네비게이션 상태 업데이트 콜백 호출
    if (onNavigationUpdate) {
      onNavigationUpdate({ isNavigationMode: false } as any)
    }
    
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
        if (mapContainer.current && !isNavigationMode) {
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
  }, [isNavigationMode, firstPersonState.trackingWatchId, currentMarker, map, onNavigationUpdate])

  // 전체 화면 네비게이션 시작
  const startFullScreenNavigation = useCallback(() => {
    if (mode !== 'running') {
      alert('런닝 시작 후에 전체 화면 네비게이션을 사용할 수 있습니다.')
      return
    }
    
    if (!courseRoute || courseRoute.length < 2) {
      alert('코스 데이터가 없습니다.')
      return
    }

    setIsFullScreenNavActive(true)
    console.log('🚗 전체 화면 네비게이션 시작')
  }, [mode, courseRoute])

  // 전체 화면 네비게이션 종료
  const stopFullScreenNavigation = useCallback(() => {
    setIsFullScreenNavActive(false)
    console.log('🛑 전체 화면 네비게이션 종료')
  }, [])

  // 런닝 모드 시작 시 자동으로 네비게이션 모드 활성화
  useEffect(() => {
    if (mode === 'running' && !isNavigationMode) {
      console.log('🏃‍♂️ 런닝 모드 시작 - 자동으로 네비게이션 모드 활성화')
      setIsNavigationMode(true)
    }
  }, [mode, isNavigationMode])

  // onNavigationReady 콜백 호출 (네비게이션 모드 함수들 전달)
  useEffect(() => {
    if (onNavigationReady) {
      onNavigationReady(startNavigationMode, stopNavigationMode, isNavigationMode, startFullScreenNavigation)
    }
  }, [onNavigationReady, startNavigationMode, stopNavigationMode, isNavigationMode, startFullScreenNavigation])

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

  // waiting 모드가 아닌 경우에만 위치 권한 UI 표시
  if (locationPermission === 'unknown' && mode !== 'waiting') {
    return (
      <div 
        className="w-full rounded-2xl overflow-hidden border border-gray-800"
        style={{
          height: '67vh',
          minHeight: '400px'
        }}
      >
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
        className={`w-full rounded-2xl overflow-hidden border border-gray-800 relative z-0`}
        style={{
          position: 'relative',
          isolation: 'isolate',
          zIndex: 0,
          height: isNavigationMode ? '75vh' : '67vh', // 화면의 3분의 2 이상
          minHeight: '400px' // 최소 높이 보장
        }}
      />
      
      {/* 앱 내 카카오맵 네비게이션: 턴바이턴 안내 */}
      {isInAppNavActive && currentTurnInstruction && (
        <motion.div 
          className="absolute top-2 left-4 right-4 z-20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="bg-blue-600/95 backdrop-blur-sm rounded-lg px-4 py-3 border border-blue-500">
            <div className="flex items-center gap-3 text-white">
              <div className="text-2xl">
                {kakaoNavService.getTurnIcon(currentTurnInstruction.turnType)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {currentTurnInstruction.instruction}
                </div>
                <div className="text-xs text-blue-200">
                  {currentTurnInstruction.distance}m 후
                </div>
              </div>
              <button
                onClick={stopInAppNavigation}
                className="text-blue-200 hover:text-white text-xs px-2 py-1 rounded"
              >
                종료
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 보행자 네비게이션 MVP: 코스 이탈 경고 배너 (런닝 모드에서 표시) */}
      {mode === 'running' && pedestrianProgress?.isOffCourse && !isInAppNavActive && (
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
              <span className="text-xs text-red-200">({pedestrianProgress.distanceToRoute.toFixed(0)}m 이탈)</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 보행자 네비게이션 MVP: 진행률 표시 (런닝 모드에서 표시) */}
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
            
            {/* 네비게이션 모드에서는 추가 정보 표시 */}
            {isNavigationMode && (
              <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                <div>
                  속도: {(firstPersonState.currentSpeed * 3.6).toFixed(1)} km/h
                </div>
                <div>
                  방향: {firstPersonState.smoothBearing.toFixed(0)}°
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 네비게이션 버튼 (런닝 모드에서만) */}
      {mode === 'running' && (
        <div className="absolute top-4 right-4 z-10">
          {/* 전체 화면 네비게이션 버튼 */}
          <button
            onClick={startFullScreenNavigation}
            className="w-14 h-14 rounded-full shadow-lg border-2 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 bg-blue-500 border-blue-500 text-white hover:bg-blue-600"
            title="전체 화면 네비게이션"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      )}

      {/* GPS 상태 표시 (런닝 모드가 아닐 때만) */}
      {mode !== 'running' && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* GPS 상태 */}
          <div className="bg-black/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-800">
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

          {/* 내 위치 버튼 */}
          {locationPermission === 'granted' && (
            <button
              onClick={moveToCurrentLocation}
              className="bg-black/80 backdrop-blur-sm rounded-xl p-2 border border-gray-800 hover:bg-gray-800/80 transition-colors"
              title="내 위치로 이동"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>
      )}


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
            {userLocation && courseRoute.length > 0 && distanceToStart !== null && (
              <div className={`text-xs mt-1 ${isAtStartPoint ? 'text-[#00FF88]' : 'text-gray-300'}`}>
                시작점까지 {(distanceToStart * 1000).toFixed(0)}m
                {isAtStartPoint && ' ✅'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 전체 화면 네비게이션 */}
      <FullScreenNavigation
        isActive={isFullScreenNavActive}
        onClose={stopFullScreenNavigation}
        courseRoute={courseRoute}
        currentPosition={currentPosition}
        onLocationUpdate={onLocationUpdate}
      />
    </div>
  )
}
