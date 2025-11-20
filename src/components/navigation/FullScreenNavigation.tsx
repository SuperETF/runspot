'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GPSCoordinate } from '../../types/database'
import {
  NavigationProgress,
  getProgressOnRoute,
  haversineDistance,
  calculateBearing
} from '../../utils/navigationEngine'

interface FullScreenNavigationProps {
  isActive: boolean
  onClose: () => void
  courseRoute: GPSCoordinate[]
  currentPosition: GPSCoordinate | null
  onLocationUpdate?: (position: GPSCoordinate) => void
}

interface NavigationState {
  currentSpeed: number // km/h
  currentBearing: number // degrees
  nextTurnDistance: number // meters
  nextTurnDirection: string
  remainingDistance: number // meters
  estimatedTime: number // minutes
}

const DEAD_ZONE_DEG = 5          // 이 정도 이하면 무시
const SMOOTHING_FACTOR = 0.2     // 0~1 (작을수록 더 부드럽게)
const ROTATION_TRANSITION_MS = 350 // 회전 애니메이션 시간

const normalizeAngle = (angle: number) => {
  const a = angle % 360
  return a < 0 ? a + 360 : a
}

const shortestAngleDiff = (from: number, to: number) => {
  const diff = normalizeAngle(to) - normalizeAngle(from)
  const wrapped = ((diff + 540) % 360) - 180
  return wrapped
}

export default function FullScreenNavigation({
  isActive,
  onClose,
  courseRoute,
  currentPosition,
  onLocationUpdate
}: FullScreenNavigationProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [currentMarker, setCurrentMarker] = useState<any>(null)
  const [routePolyline, setRoutePolyline] = useState<any>(null)
  const [watchId, setWatchId] = useState<number | null>(null)

  // 원시 센서 값
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null)
  // 스무딩된 헤딩
  const [smoothedHeading, setSmoothedHeading] = useState<number | null>(null)
  const lastSmoothedHeadingRef = useRef<number | null>(null)

  const [routeProgress, setRouteProgress] = useState<NavigationProgress | null>(null)

  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentSpeed: 0,
    currentBearing: 0,
    nextTurnDistance: 500,
    nextTurnDirection: '직진하세요',
    remainingDistance: 2500,
    estimatedTime: 12
  })

  const requestDeviceOrientationPermission = async () => {
    if (typeof window === 'undefined') return
    const AnyDeviceOrientationEvent = (window as any).DeviceOrientationEvent
    if (
      AnyDeviceOrientationEvent &&
      typeof AnyDeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const res = await AnyDeviceOrientationEvent.requestPermission()
        console.log('📡 DeviceOrientation permission:', res)
      } catch (e) {
        console.error('DeviceOrientation permission error:', e)
      }
    }
  }

  // 카카오맵 초기화
  useEffect(() => {
    if (!isActive || !mapContainer.current || map) return

    const initializeMap = () => {
      if (!(window as any).kakao?.maps) {
        setTimeout(initializeMap, 100)
        return
      }

      const kakao = (window as any).kakao
      const mapOption = {
        center: currentPosition
          ? new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng)
          : new kakao.maps.LatLng(37.5665, 126.978),
        level: 2,
        mapTypeId: kakao.maps.MapTypeId.ROADMAP
      }

      const newMap = new kakao.maps.Map(mapContainer.current, mapOption)
      setMap(newMap)

      if (currentPosition) {
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng),
          map: newMap
        })
        setCurrentMarker(marker)
      }

      if (courseRoute.length > 0) {
        const path = courseRoute.map(
          (point) => new kakao.maps.LatLng(point.lat, point.lng)
        )

        const polyline = new kakao.maps.Polyline({
          path,
          strokeWeight: 8,
          strokeColor: '#FF6B35',
          strokeOpacity: 0.8,
          strokeStyle: 'solid'
        })

        polyline.setMap(newMap)
        setRoutePolyline(polyline)
      }

      console.log('🗺️ 전체 화면 네비게이션 지도 초기화 완료')
    }

    initializeMap()
  }, [isActive, currentPosition, courseRoute, map])

  // DeviceOrientation → heading smoothing + dead zone
  useEffect(() => {
    if (!isActive) return

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const anyEvent = event as any
      let rawHeading: number | null = null

      if (typeof anyEvent.webkitCompassHeading === 'number') {
        rawHeading = anyEvent.webkitCompassHeading as number
      } else if (typeof event.alpha === 'number') {
        rawHeading = 360 - event.alpha
      }

      if (rawHeading == null || !Number.isFinite(rawHeading)) return

      const normalizedRaw = normalizeAngle(rawHeading)
      setDeviceHeading(normalizedRaw)

      const last = lastSmoothedHeadingRef.current
      if (last == null) {
        lastSmoothedHeadingRef.current = normalizedRaw
        setSmoothedHeading(normalizedRaw)
        return
      }

      const diff = shortestAngleDiff(last, normalizedRaw)

      // dead zone: 작은 변화는 무시
      if (Math.abs(diff) < DEAD_ZONE_DEG) {
        return
      }

      // smoothing: 이전 값에서 천천히 따라가기
      const next = normalizeAngle(last + diff * SMOOTHING_FACTOR)
      lastSmoothedHeadingRef.current = next
      setSmoothedHeading(next)
    }

    window.addEventListener('deviceorientation', handleOrientation, true)
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, [isActive])

  // 지도 회전 (스무딩된 heading 기준)
  useEffect(() => {
    if (!isActive || !mapContainer.current) return
    const heading = smoothedHeading ?? deviceHeading
    if (heading == null) return

    const rotation = -heading
    mapContainer.current.style.transform = `rotate(${rotation}deg)`
    mapContainer.current.style.transformOrigin = 'center center'
    mapContainer.current.style.transition = `transform ${ROTATION_TRANSITION_MS}ms ease-out`
  }, [isActive, smoothedHeading, deviceHeading])

  // GPS 추적
  useEffect(() => {
    if (!isActive || !map) return

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 1000
    }

    const newWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        const kakao = (window as any).kakao

        map.setCenter(new kakao.maps.LatLng(newPos.lat, newPos.lng))

        if (currentMarker) {
          currentMarker.setPosition(new kakao.maps.LatLng(newPos.lat, newPos.lng))
        }

        const speed = (position.coords.speed || 0) * 3.6 // m/s → km/h

        let progress: NavigationProgress | null = null
        if (courseRoute.length > 1) {
          const routePoints = courseRoute.map((point, index) => ({
            lat: point.lat,
            lng: point.lng,
            order: index
          }))
          progress = getProgressOnRoute(routePoints, newPos)
          setRouteProgress(progress)
        }

        let nextTurnDistance = 500
        let nextTurnDirection = '직진하세요'

        const headingForDir = smoothedHeading ?? deviceHeading ?? 0

        if (progress && progress.nextWaypoint) {
          nextTurnDistance = Math.round(haversineDistance(newPos, progress.nextWaypoint))

          const bearing = calculateBearing(newPos, progress.nextWaypoint)
          const relativeBearing = (bearing - headingForDir + 360) % 360

          if (relativeBearing < 30 || relativeBearing > 330) {
            nextTurnDirection = '직진하세요'
          } else if (relativeBearing >= 30 && relativeBearing < 150) {
            nextTurnDirection = '우회전하세요'
          } else if (relativeBearing >= 150 && relativeBearing < 210) {
            nextTurnDirection = 'U턴하세요'
          } else {
            nextTurnDirection = '좌회전하세요'
          }
        }

        if (progress && progress.isOffRoute) {
          nextTurnDirection = '코스로 돌아가세요'
        }

        let estimatedTime = 12
        if (progress && speed > 0) {
          const remainingKm = progress.remainingDistance / 1000
          estimatedTime = Math.round((remainingKm / speed) * 60)
        }

        setNavigationState((prev) => ({
          ...prev,
          currentSpeed: speed,
          currentBearing: headingForDir,
          nextTurnDistance,
          nextTurnDirection,
          remainingDistance: progress ? progress.remainingDistance : prev.remainingDistance,
          estimatedTime
        }))

        if (onLocationUpdate) {
          onLocationUpdate(newPos)
        }

        console.log(
          '📍 네비게이션 위치 업데이트:',
          newPos,
          `속도: ${speed.toFixed(1)}km/h`,
          `heading(raw): ${deviceHeading}`,
          `heading(smooth): ${smoothedHeading}`,
          progress
            ? {
                진행률: `${(progress.progressRatio * 100).toFixed(1)}%`,
                남은거리: `${(progress.remainingDistance / 1000).toFixed(2)}km`,
                코스이탈: progress.isOffRoute ? '예' : '아니오',
                다음턴: `${nextTurnDistance}m ${nextTurnDirection}`
              }
            : '경로 계산 중...'
        )
      },
      (error) => {
        console.error('❌ GPS 오류:', error)
      },
      options
    )

    setWatchId(newWatchId)

    return () => {
      if (newWatchId) {
        navigator.geolocation.clearWatch(newWatchId)
      }
    }
  }, [isActive, map, currentMarker, onLocationUpdate, courseRoute, deviceHeading, smoothedHeading])

  const handleClose = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }

    if (mapContainer.current) {
      mapContainer.current.style.transform = 'none'
    }

    onClose()
  }, [watchId, onClose])

  if (!isActive) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* 상단 네비게이션 안내 바 */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="p-4 pt-12">
            <div className="bg-blue-600 rounded-2xl p-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 11l5-5m0 0l5 5m-5-5v12"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-white text-lg font-semibold">
                    {navigationState.nextTurnDistance}m 후
                  </div>
                  <div className="text-blue-100 text-sm">
                    {navigationState.nextTurnDirection}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-gray-300">속도</span>
                  <span className="ml-2 font-semibold">
                    {navigationState.currentSpeed.toFixed(0)} km/h
                  </span>
                </div>
                <div>
                  <span className="text-gray-300">남은 거리</span>
                  <span className="ml-2 font-semibold">
                    {(navigationState.remainingDistance / 1000).toFixed(1)} km
                  </span>
                </div>
              </div>
              <div>
                <span className="text-gray-300">예상 시간</span>
                <span className="ml-2 font-semibold">
                  {navigationState.estimatedTime}분
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 지도 영역 */}
        <div
          ref={mapContainer}
          className="w-full h-full"
          style={{
            transformOrigin: 'center center'
          }}
        />

        {/* 하단 컨트롤 바 */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent">
          <div className="p-4 pb-8">
            <div className="flex items-center justify-between">
              <button
                onClick={handleClose}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                네비게이션 종료
              </button>

              <div className="flex-1 text-center">
                <div className="text-white text-lg font-semibold">런닝 네비게이션</div>
                <div className="text-gray-300 text-sm">목적지까지 안내 중</div>
              </div>

              <button
                className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-xl transition-colors"
                onClick={requestDeviceOrientationPermission}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
