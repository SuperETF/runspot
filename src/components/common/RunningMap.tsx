'use client'

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { GPSCoordinate } from '@/types/database'
import LocationPermission from './LocationPermission'
import { Navigation } from 'lucide-react'
import { useRunningStore } from '@/stores/runningStore'

// GPS 포인트 타입 (타임스탬프 포함)
interface GPSPoint {
  lat: number
  lng: number
  timestamp: number | string
  accuracy?: number
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
}

// 카카오맵 타입은 KakaoMap.tsx에서 이미 선언됨

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
  isPaused = false
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
    return courseData?.gps_route || []
  }, [courseData?.gps_route])

  // 길찾기 경로 상태
  const [routePath, setRoutePath] = useState<any[]>([])
  const [routePolyline, setRoutePolyline] = useState<any>(null)
  const [directionMarkers, setDirectionMarkers] = useState<any[]>([])
  const [isNavigationMode, setIsNavigationMode] = useState(false)
  const [logoBase64, setLogoBase64] = useState<string>('')
  
  // 방향 추적 상태 (단순화)
  const [deviceHeading, setDeviceHeading] = useState<number>(0)
  const [isTrackingHeading, setIsTrackingHeading] = useState(false)

  // 1인칭 모드 시작
  const startHeadingTracking = useCallback(() => {
    console.log('🧭 1인칭 모드 시작')
    setIsTrackingHeading(true)
    
    // 지도를 1인칭 모드로 설정
    if (map && userLocation) {
      // 가까운 줌 레벨로 설정 (1인칭 시점)
      map.setLevel(2)
      
      // 현재 위치를 지도 중심으로 고정
      const center = new (window as any).kakao.maps.LatLng(userLocation.lat, userLocation.lng)
      map.setCenter(center)
      
      // 지도 드래그 비활성화 (1인칭 모드에서는 고정)
      map.setDraggable(false)
      map.setZoomable(false)
      
      console.log('📍 1인칭 모드 활성화 - 현재 위치 고정')
    }
  }, [map, userLocation])

  // 1인칭 모드 종료
  const stopHeadingTracking = useCallback(() => {
    console.log('🛑 1인칭 모드 종료')
    setIsTrackingHeading(false)
    setDeviceHeading(0)
    
    // 지도를 일반 모드로 복원
    if (map) {
      // 지도 회전 초기화
      map.setHeading && map.setHeading(0)
      
      // 드래그/줌 다시 활성화
      map.setDraggable(true)
      map.setZoomable(true)
      
      // 줌 레벨 복원
      map.setLevel(4)
      
      console.log('📍 일반 모드 복원')
    }
  }, [map])

  // 런닝 상태에 따른 방향 추적 자동 전환
  useEffect(() => {
    console.log('🔄 런닝 상태 변경 감지:', { isRunning, isTrackingHeading })
    
    if (isRunning && !isTrackingHeading) {
      console.log('🚀 런닝 시작 - 방향 추적 활성화')
      startHeadingTracking()
    } else if (!isRunning && isTrackingHeading) {
      console.log('🛑 런닝 종료 - 방향 추적 비활성화')
      stopHeadingTracking()
    }
  }, [isRunning, isTrackingHeading, startHeadingTracking, stopHeadingTracking])

  // onNavigationReady 콜백 호출 (단순화)
  useEffect(() => {
    if (onNavigationReady) {
      onNavigationReady(startHeadingTracking, stopHeadingTracking, isTrackingHeading)
    }
  }, [onNavigationReady, startHeadingTracking, stopHeadingTracking, isTrackingHeading])

  // 디바이스 방향 감지 및 지도 회전
  useEffect(() => {
    if (!isTrackingHeading || !map) return

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        // iOS와 Android에서 다르게 처리
        let heading = event.alpha
        
        // iOS에서는 webkitCompassHeading 사용 (더 정확함)
        if ((event as any).webkitCompassHeading !== undefined) {
          heading = (event as any).webkitCompassHeading
        }
        
        // 1인칭 모드: 사용자가 바라보는 방향이 위쪽이 되도록 회전
        const mapHeading = 360 - heading
        setDeviceHeading(heading)
        
        // 카카오맵 회전 적용 (1인칭 시점)
        if (map && map.setHeading) {
          map.setHeading(mapHeading)
          console.log('🧭 1인칭 모드 회전:', heading.toFixed(1) + '도 → 지도:', mapHeading.toFixed(1) + '도')
        }
      }
    }

    // 권한 요청 (iOS 13+)
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission()
          if (permission === 'granted') {
            window.addEventListener('deviceorientationabsolute', handleDeviceOrientation)
            console.log('✅ 디바이스 방향 권한 허용됨')
          } else {
            console.warn('⚠️ 디바이스 방향 권한 거부됨')
          }
        } catch (error) {
          console.error('❌ 디바이스 방향 권한 요청 실패:', error)
          // 권한 요청 실패 시 일반 이벤트 사용
          window.addEventListener('deviceorientation', handleDeviceOrientation)
        }
      } else {
        // Android 또는 이전 iOS 버전
        window.addEventListener('deviceorientation', handleDeviceOrientation)
        console.log('✅ 디바이스 방향 감지 시작 (권한 불필요)')
      }
    }

    requestPermission()

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleDeviceOrientation)
      window.removeEventListener('deviceorientation', handleDeviceOrientation)
    }
  }, [isTrackingHeading, map])

  // 1인칭 모드에서 현재 위치를 지도 중심으로 강제 고정
  useEffect(() => {
    if (isTrackingHeading && map && userLocation) {
      const center = new (window as any).kakao.maps.LatLng(userLocation.lat, userLocation.lng)
      
      // 강제로 지도 중심을 현재 위치로 고정 (1인칭 모드)
      map.setCenter(center)
      
      // 지도가 드래그되지 않도록 다시 한번 확인
      if (map.getDraggable()) {
        map.setDraggable(false)
      }
      
      console.log('📍 1인칭 모드 - 현재 위치로 강제 고정:', userLocation)
    }
  }, [userLocation, isTrackingHeading, map])

  // 지도 중심이 변경되는 것을 방지 (1인칭 모드에서)
  useEffect(() => {
    if (!isTrackingHeading || !map || !userLocation) return

    const handleCenterChanged = () => {
      if (isTrackingHeading) {
        // 1인칭 모드에서는 중심이 변경되면 다시 현재 위치로 되돌림
        const currentCenter = map.getCenter()
        const userCenter = new (window as any).kakao.maps.LatLng(userLocation.lat, userLocation.lng)
        
        // 현재 위치와 지도 중심이 다르면 다시 고정
        if (Math.abs(currentCenter.getLat() - userLocation.lat) > 0.0001 || 
            Math.abs(currentCenter.getLng() - userLocation.lng) > 0.0001) {
          map.setCenter(userCenter)
          console.log('🔒 1인칭 모드 - 지도 중심 강제 복원')
        }
      }
    }

    // 지도 중심 변경 이벤트 리스너
    (window as any).kakao.maps.event.addListener(map, 'center_changed', handleCenterChanged)

    return () => {
      (window as any).kakao.maps.event.removeListener(map, 'center_changed', handleCenterChanged)
    }
  }, [isTrackingHeading, map, userLocation])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

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

  // 길찾기 API 호출 함수
  const getWalkingRoute = useCallback(async (start: {lat: number, lng: number}, end: {lat: number, lng: number}) => {
    if (!(window as any).kakao?.maps?.services) return null
    
    try {
      // 카카오맵 길찾기 서비스 사용
      const directions = new (window as any).kakao.maps.services.Direction()
      
      return new Promise((resolve, reject) => {
        directions.route({
          origin: { x: start.lng, y: start.lat },
          destination: { x: end.lng, y: end.lat },
          waypoints: [],
          priority: 'RECOMMEND', // 추천 경로
          car_fuel: 'GASOLINE',
          car_hipass: false,
          alternatives: false,
          road_details: false
        }, (result: any, status: any) => {
          if (status === (window as any).kakao.maps.services.Status.OK) {
            resolve(result.routes[0])
          } else {
            reject(new Error('길찾기 실패'))
          }
        })
      })
    } catch (error) {
      console.error('길찾기 API 오류:', error)
      return null
    }
  }, [])

  // 경로에 따른 방향 화살표 생성
  const createDirectionMarkers = useCallback((route: any[]) => {
    if (!map || !route.length) return

    // 기존 방향 마커들 제거
    directionMarkers.forEach(marker => marker.setMap(null))
    
    const newMarkers: any[] = []
    const kakao = (window as any).kakao

    // 경로를 따라 일정 간격으로 화살표 마커 생성
    for (let i = 0; i < route.length - 1; i += 5) { // 5개 포인트마다 화살표
      const current = route[i]
      const next = route[i + 1] || route[route.length - 1]
      
      // 방향 계산 (북쪽 기준 각도)
      const angle = Math.atan2(next.lng - current.lng, next.lat - current.lat) * 180 / Math.PI
      
      // 화살표 마커 생성
      const arrowMarker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(current.lat, current.lng),
        image: new kakao.maps.MarkerImage(
          createArrowIcon(angle),
          new kakao.maps.Size(20, 20),
          { offset: new kakao.maps.Point(10, 10) }
        ),
        map: map
      })
      
      newMarkers.push(arrowMarker)
    }
    
    setDirectionMarkers(newMarkers)
  }, [map, directionMarkers])

  // 화살표 아이콘 생성 함수
  const createArrowIcon = (angle: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = 20
    canvas.height = 20
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.translate(10, 10)
      ctx.rotate((angle - 90) * Math.PI / 180) // 북쪽을 0도로 조정
      
      // 화살표 그리기
      ctx.fillStyle = '#00FF88'
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1
      
      ctx.beginPath()
      ctx.moveTo(0, -8)
      ctx.lineTo(-4, 4)
      ctx.lineTo(0, 0)
      ctx.lineTo(4, 4)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
    
    return canvas.toDataURL()
  }

  // 네비게이션 모드 시작
  const startNavigation = useCallback(async () => {
    if (!userLocation || !courseRoute.length) return
    
    const nextCheckpoint = courseRoute[currentCheckpoint + 1]
    if (!nextCheckpoint) return
    
    console.log('🧭 네비게이션 시작:', { from: userLocation, to: nextCheckpoint })
    
    try {
      const route = await getWalkingRoute(userLocation, nextCheckpoint) as any
      if (route && route.sections && route.sections[0]) {
        const routePoints = route.sections[0].roads.flatMap((road: any) => 
          road.vertexes.map((vertex: any, index: number) => ({
            lat: vertex.y || vertex[1],
            lng: vertex.x || vertex[0]
          }))
        )
        
        setRoutePath(routePoints)
        setIsNavigationMode(true)
        
        // 경로 폴리라인 그리기
        if (routePolyline) {
          routePolyline.setMap(null)
        }
        
        const kakao = (window as any).kakao
        const newPolyline = new kakao.maps.Polyline({
          path: routePoints.map((point: any) => new kakao.maps.LatLng(point.lat, point.lng)),
          strokeWeight: 5,
          strokeColor: '#FF6B00', // 주황색 (네비게이션 경로)
          strokeOpacity: 0.8,
          strokeStyle: 'solid'
        })
        
        newPolyline.setMap(map)
        setRoutePolyline(newPolyline)
        
        // 방향 화살표 생성
        createDirectionMarkers(routePoints)
        
        console.log('✅ 네비게이션 경로 생성 완료:', routePoints.length, '개 포인트')
      }
    } catch (error) {
      console.error('❌ 네비게이션 시작 실패:', error)
    }
  }, [userLocation, courseRoute, currentCheckpoint, getWalkingRoute, routePolyline, map, createDirectionMarkers])

  // 네비게이션 모드 종료
  const stopNavigation = useCallback(() => {
    setIsNavigationMode(false)
    setRoutePath([])
    
    // 경로 폴리라인 제거
    if (routePolyline) {
      routePolyline.setMap(null)
      setRoutePolyline(null)
    }
    
    // 방향 마커들 제거
    directionMarkers.forEach(marker => marker.setMap(null))
    setDirectionMarkers([])
    
    console.log('🛑 네비게이션 종료')
  }, [routePolyline, directionMarkers])


  // 네비게이션 함수들을 부모 컴포넌트로 전달
  useEffect(() => {
    if (onNavigationReady) {
      onNavigationReady(startNavigation, stopNavigation, isNavigationMode)
    }
  }, [onNavigationReady, startNavigation, stopNavigation, isNavigationMode])


  const updateStartToCurrentLine = useCallback(
    (startPoint: { lat: number; lng: number } | undefined, moveLatLon: any) => {
      if (!map || !startPoint || !(window as any).kakao?.maps?.LatLng) return

      try {
        const kakao = (window as any).kakao
        const startLatLng = new kakao.maps.LatLng(startPoint.lat, startPoint.lng)

        if (startToCurrentLine) {
          startToCurrentLine.setMap(null)
        }

        const line = new kakao.maps.Polyline({
          path: [startLatLng, moveLatLon],
          strokeWeight: 2,
          strokeColor: '#FF0000',
          strokeOpacity: 0.9,
          strokeStyle: 'solid'
        })

        line.setMap(map)
        setStartToCurrentLine(line)
      } catch (error) {
        console.error('시작점-현재 위치 직선 표시 중 오류:', error)
      }
    },
    [map, startToCurrentLine]
  )

  // 카카오맵 초기화
  useEffect(() => {
    const initializeMap = (position?: GeolocationPosition) => {
      if (!(window as any).kakao?.maps?.LatLng || !mapContainer.current) return

      try {
        // 위치 정보가 있으면 해당 위치를, 없으면 서울 중심을 사용
        const lat = position ? position.coords.latitude : 37.5665
        const lng = position ? position.coords.longitude : 126.9780

        const options = {
          center: new (window as any).kakao.maps.LatLng(lat, lng),
          level: 3
        }

        const kakaoMap = new (window as any).kakao.maps.Map(mapContainer.current, options)
        setMap(kakaoMap)

        // 카카오맵 기본 현재 위치 컨트롤 추가
        const mapTypeControl = new (window as any).kakao.maps.MapTypeControl()
        kakaoMap.addControl(mapTypeControl, (window as any).kakao.maps.ControlPosition.TOPRIGHT)
        
        const zoomControl = new (window as any).kakao.maps.ZoomControl()
        kakaoMap.addControl(zoomControl, (window as any).kakao.maps.ControlPosition.RIGHT)

        // 위치 정보가 있으면 기본 마커 생성
        if (position) {
          const locPosition = new (window as any).kakao.maps.LatLng(lat, lng)
          const marker = new (window as any).kakao.maps.Marker({
            position: locPosition,
            map: kakaoMap
          })
          setCurrentMarker(marker)
        }
      } catch (error) {
        console.error('카카오맵 초기화 중 오류:', error)
      }
    }

    // 카카오맵 SDK 로드 및 초기화
    const loadKakaoMaps = () => {
      if ((window as any).kakao && (window as any).kakao.maps) {
        // 이미 로드되어 있다면 바로 초기화
        if ((window as any).kakao.maps.LatLng) {
          initializeMap()
        } else {
          // SDK는 로드되었지만 초기화되지 않은 경우
          (window as any).kakao.maps.load(initializeMap)
        }
      } else {
        // SDK가 아직 로드되지 않은 경우 대기
        setTimeout(loadKakaoMaps, 100)
      }
    }

    // 위치 권한이 허용되었고 초기 위치가 있으면 해당 위치로 지도 초기화
    if (locationPermission === 'granted' && initialPosition) {
      loadKakaoMaps()
    } else if (locationPermission === 'denied') {
      // 위치 권한이 거부되었으면 기본 위치로 지도 초기화
      loadKakaoMaps()
    }
  }, [locationPermission, initialPosition])

  // GPS 경로 변경 시 거리 계산 및 콜백 호출 (runningStore.userPath 기반)
  useEffect(() => {
    if (userPath.length > 0) {
      const latestPoint = userPath[userPath.length - 1]
      onLocationUpdate?.({
        lat: latestPoint.lat,
        lng: latestPoint.lng,
        timestamp: Date.now()
      } as any)
      
      if (userPath.length > 1) {
        const totalDistance = calculateTotalDistance(userPath)
        onDistanceUpdate?.(totalDistance)
      }
    }
  }, [userPath, onLocationUpdate, onDistanceUpdate])

  // 코스 경로와 시작점 표시 (런닝 전에만)
  useEffect(() => {
    if (!map || !courseRoute || courseRoute.length === 0) return

    // 기존 코스 경로 제거
    if (coursePolyline) {
      coursePolyline.setMap(null)
    }

    // 기존 시작점 마커 제거
    if (startPointMarker) {
      startPointMarker.setMap(null)
    }

    // 런닝 중이 아닐 때만 코스 경로 표시
    if (!isRunning) {
      // 코스 경로 표시
      const path = courseRoute.map(point => 
        new (window as any).kakao.maps.LatLng(point.lat, point.lng)
      )

      const newCoursePolyline = new (window as any).kakao.maps.Polyline({
        path: path,
        strokeWeight: 2,
        strokeColor: '#9CA3AF', // 더 연한 회색
        strokeOpacity: 0.5,
        strokeStyle: 'shortdash' // 점선으로 변경
      })

      newCoursePolyline.setMap(map)
      
      // 컴포넌트가 마운트된 상태에서만 상태 업데이트
      if (isMountedRef.current) {
        setCoursePolyline(newCoursePolyline)
      }
    }

    // 시작점 마커 표시
    if (showStartPoint && courseRoute[0]) {
      const startPoint = courseRoute[0]
      console.log('🎯 시작점 마커 생성:', { 
        lat: startPoint.lat, 
        lng: startPoint.lng,
        courseLength: courseRoute.length,
        fullCourseRoute: courseRoute
      })
      const startPosition = new (window as any).kakao.maps.LatLng(startPoint.lat, startPoint.lng)
      
      // 새로운 maker.svg 마커 사용
      const getMarkerSrc = () => {
        if (logoBase64) {
          return logoBase64
        }
        return '/maker.svg'
      }
      
      const imageSize = new (window as any).kakao.maps.Size(48, 48)
      const imageOption = { offset: new (window as any).kakao.maps.Point(24, 48) }
      const markerImage = new (window as any).kakao.maps.MarkerImage(getMarkerSrc(), imageSize, imageOption)

      const newStartPointMarker = new (window as any).kakao.maps.Marker({
        position: startPosition,
        image: markerImage,
        map: map
      })

      // 컴포넌트가 마운트된 상태에서만 상태 업데이트
      if (isMountedRef.current) {
        setStartPointMarker(newStartPointMarker)
      }

      // 지도 중심을 시작점으로 이동 (더 가까운 줌)
      map.setCenter(startPosition)
      map.setLevel(3)
      
      console.log('✅ 시작점 마커 설정 완료 및 지도 중심 이동')
    }
  }, [map, courseRoute, showStartPoint, isRunning])

  // 위치 권한 허용 처리
  const handleLocationPermissionGranted = (position: GeolocationPosition) => {
    setLocationPermission('granted')
    setInitialPosition(position)
  }

  // 위치 권한 거부 처리
  const handleLocationPermissionDenied = () => {
    setLocationPermission('denied')
    console.log('위치 정보 접근이 거부되었습니다.')
  }

  // 위치 정보 요청 함수 (에러 처리 개선)
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.log('이 브라우저는 위치 정보를 지원하지 않습니다.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationPermissionGranted(position)
        console.log('위치 정보 획득 성공:', position.coords)
      },
      (error) => {
        console.log('위치 정보 획득 실패:', error.message)
        handleLocationPermissionDenied()
      },
      {
        enableHighAccuracy: false, // 정확도를 낮춰서 빠르게 획득
        timeout: 10000,
        maximumAge: 300000 // 5분간 캐시 사용
      }
    )
  }, [])

  // 현재 위치로 지도 이동
  const moveToCurrentLocation = () => {
    if (!navigator.geolocation || !map) {
      alert('위치 서비스를 사용할 수 없습니다.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const moveLatLon = new (window as any).kakao.maps.LatLng(lat, lng)
        
        // 지도 중심 이동
        map.setCenter(moveLatLon)
        map.setLevel(3)

        // 현재 위치 마커 업데이트
        if (currentMarker) {
          currentMarker.setPosition(moveLatLon)
        } else {
          // 마커가 없으면 새로 생성
          const marker = new (window as any).kakao.maps.Marker({
            position: moveLatLon,
            map: map
          })
          setCurrentMarker(marker)
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('위치 정보 접근이 거부되었습니다.')
            break
          case error.POSITION_UNAVAILABLE:
            alert('위치 정보를 사용할 수 없습니다.')
            break
          case error.TIMEOUT:
            alert('위치 정보 요청 시간이 초과되었습니다.')
            break
          default:
            alert('위치 정보를 가져오는 중 오류가 발생했습니다.')
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  // 경로선 업데이트
  const updatePolyline = useCallback((path: GPSPoint[]) => {
    if (!map || !(window as any).kakao?.maps?.LatLng || path.length < 2 || !isMountedRef.current) return

    try {
      // 기존 경로선 제거
      if (polyline) {
        polyline.setMap(null)
      }

      // 새 경로선 생성
      const linePath = path.map(point => new (window as any).kakao.maps.LatLng(point.lat, point.lng))
      
      const newPolyline = new (window as any).kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 4,
        strokeColor: '#00FF88', // 실제 뛴 경로는 초록색 유지
        strokeOpacity: 0.9,
        strokeStyle: 'solid'
      })

      newPolyline.setMap(map)
      
      // 컴포넌트가 마운트된 상태에서만 상태 업데이트
      if (isMountedRef.current) {
        setPolyline(newPolyline)
      }
    } catch (error) {
      console.error('경로선 업데이트 중 오류:', error)
    }
  }, [map, polyline])

  // 코스 경로 표시
  const displayCourseRoute = useCallback(() => {
    if (!map || !courseRoute || courseRoute.length < 2 || !(window as any).kakao?.maps?.LatLng) return

    // 기존 코스 경로선 제거
    if (coursePolyline) {
      coursePolyline.setMap(null)
    }

    try {
      // 코스 경로선 생성
      const coursePath = courseRoute.map(point => 
        new (window as any).kakao.maps.LatLng(point.lat, point.lng)
      )
      
      const newCoursePolyline = new (window as any).kakao.maps.Polyline({
        path: coursePath,
        strokeWeight: 3,
        strokeColor: '#6B7280', // 회색으로 변경
        strokeOpacity: 0.6,
        strokeStyle: 'shortdash' // 점선으로 표시
      })

      newCoursePolyline.setMap(map)
      
      // 컴포넌트가 마운트된 상태에서만 상태 업데이트
      if (isMountedRef.current) {
        setCoursePolyline(newCoursePolyline)
      }

      // 시작점 마커 표시
      if (showStartPoint && courseRoute.length > 0) {
        const startPoint = courseRoute[0]
        const startPosition = new (window as any).kakao.maps.LatLng(startPoint.lat, startPoint.lng)
        
        // 기존 시작점 마커 제거
        if (startPointMarker) {
          startPointMarker.setMap(null)
        }

        // 새로운 maker.svg 마커 사용
        const getMarkerSrc = () => {
          if (logoBase64) {
            return logoBase64
          }
          return '/maker.svg'
        }
        
        const imageSize = new (window as any).kakao.maps.Size(48, 48)
        const imageOption = { offset: new (window as any).kakao.maps.Point(24, 48) }
        const markerImage = new (window as any).kakao.maps.MarkerImage(getMarkerSrc(), imageSize, imageOption)

        const marker = new (window as any).kakao.maps.Marker({
          position: startPosition,
          image: markerImage,
          map: map
        })

        // 컴포넌트가 마운트된 상태에서만 상태 업데이트
        if (isMountedRef.current) {
          setStartPointMarker(marker)
        }
      }

      // 지도 범위를 코스 전체가 보이도록 조정
      if (courseRoute.length > 0) {
        const bounds = new (window as any).kakao.maps.LatLngBounds()
        courseRoute.forEach(point => {
          bounds.extend(new (window as any).kakao.maps.LatLng(point.lat, point.lng))
        })
        map.setBounds(bounds)
      }
    } catch (error) {
      console.error('코스 경로 표시 중 오류:', error)
    }
  }, [map, courseRoute, showStartPoint, isRunning])

  // 코스 경로가 변경될 때마다 표시 업데이트
  useEffect(() => {
    if (map && courseRoute && courseRoute.length > 0) {
      displayCourseRoute()
    }
  }, [map, courseRoute, displayCourseRoute])

  // 현재 위치 마커 업데이트 (userLocation prop 기반)
  useEffect(() => {
    if (!map || !userLocation) return

    if ((window as any).kakao?.maps?.LatLng) {
      const moveLatLon = new (window as any).kakao.maps.LatLng(userLocation.lat, userLocation.lng)
      
      if (currentMarker) {
        currentMarker.setPosition(moveLatLon)
      } else {
        // 기본 마커 사용
        const marker = new (window as any).kakao.maps.Marker({
          position: moveLatLon,
          map
        })
        setCurrentMarker(marker)
      }

      // 시작점-현재위치 직선 제거 (불필요한 선 제거)
      if (startToCurrentLine) {
        startToCurrentLine.setMap(null)
        setStartToCurrentLine(null)
      }
    }
  }, [map, userLocation, courseRoute, isRunning])

  // GPS 추적 시작/중지 (런닝 중에만)
  useEffect(() => {
    if (!isRunning || !navigator.geolocation) return

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const coord = {
          lat,
          lng,
          timestamp: new Date().toISOString()
        }

        updatePosition(coord)
        
        // 런닝 중에는 onLocationUpdate 콜백 호출
        if (onLocationUpdate) {
          onLocationUpdate({ lat, lng })
        }
      },
      (error) => {
        console.error('GPS 추적 오류:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    )
    setWatchId(id)

    return () => {
      if (id) {
        navigator.geolocation.clearWatch(id)
      }
    }
  }, [isRunning, updatePosition, onLocationUpdate])

  // GPS 경로가 업데이트될 때 polyline 업데이트 (런닝 중일 때만)
  useEffect(() => {
    if (isRunning && userPath.length >= 2) {
      updatePolyline(userPath as any)
    } else if (!isRunning && polyline) {
      // 런닝 중이 아닐 때는 사용자 경로 제거
      polyline.setMap(null)
      setPolyline(null)
    }
  }, [userPath, updatePolyline, isRunning, polyline])

  // 총 거리 계산 (Haversine 공식)
  const calculateTotalDistance = (path: { lat: number; lng: number }[]): number => {
    if (path.length < 2) return 0

    let totalDistance = 0
    for (let i = 1; i < path.length; i++) {
      const distance = calculateDistance(
        path[i - 1].lat, path[i - 1].lng,
        path[i].lat, path[i].lng
      )
      totalDistance += distance
    }
    return totalDistance
  }

  // 두 점 사이의 거리 계산 (km)
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

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className="w-full h-64 rounded-2xl overflow-hidden border border-gray-800"
      />
      
      {/* 1인칭 모드 상태 표시 */}
      {isTrackingHeading && (
        <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm rounded-xl px-3 py-2 border border-[#00FF88]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#00FF88] animate-pulse"></div>
            <span className="text-xs text-white font-medium">1인칭 모드</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-[#00FF88]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
              </svg>
              <span className="text-xs text-[#00FF88] font-mono">{deviceHeading.toFixed(0)}°</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 기존 UI */}
          {/* GPS 상태 표시 */}
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-800">
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

          {/* 경로 정보 */}
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-800">
            <div className="text-xs text-white">
              <div>경로 포인트: {userPath.length}</div>
              {userPath.length > 1 && (
                <div className="text-[#00FF88]">
                  거리: {calculateTotalDistance(userPath as any).toFixed(2)}km
                </div>
              )}
            </div>
          </div>

          {/* 현재 위치 버튼 */}
      {/* 현재 위치 버튼 */}
      <button
        onClick={moveToCurrentLocation}
        className="absolute bottom-4 right-4 w-12 h-12 bg-white hover:bg-gray-50 rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-10"
        title="현재 위치로 이동"
      >
        <Navigation className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  )
}
