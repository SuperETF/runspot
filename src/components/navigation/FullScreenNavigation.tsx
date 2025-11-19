'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GPSCoordinate } from '../../types/database'
import { NavigationProgress } from '../../utils/navigationEngine'

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
  
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentSpeed: 0,
    currentBearing: 0,
    nextTurnDistance: 500,
    nextTurnDirection: "직진하세요",
    remainingDistance: 2500,
    estimatedTime: 12
  })

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
          : new kakao.maps.LatLng(37.5665, 126.9780),
        level: 2, // 더 가까운 줌 레벨
        mapTypeId: kakao.maps.MapTypeId.ROADMAP
      }

      const newMap = new kakao.maps.Map(mapContainer.current, mapOption)
      setMap(newMap)

      // 현재 위치 마커
      if (currentPosition) {
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng),
          map: newMap
        })
        setCurrentMarker(marker)
      }

      // 경로 폴리라인
      if (courseRoute.length > 0) {
        const path = courseRoute.map(point => 
          new kakao.maps.LatLng(point.lat, point.lng)
        )
        
        const polyline = new kakao.maps.Polyline({
          path: path,
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

  // GPS 추적 시작
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

        // 지도 중심 이동
        map.setCenter(new (window as any).kakao.maps.LatLng(newPos.lat, newPos.lng))

        // 마커 업데이트
        if (currentMarker) {
          currentMarker.setPosition(new (window as any).kakao.maps.LatLng(newPos.lat, newPos.lng))
        }

        // 속도 및 방향 계산
        const speed = (position.coords.speed || 0) * 3.6 // m/s to km/h
        const bearing = position.coords.heading || 0

        setNavigationState(prev => ({
          ...prev,
          currentSpeed: speed,
          currentBearing: bearing
        }))

        // 지도 회전 (자동차 네비게이션 스타일)
        if (mapContainer.current && bearing !== null) {
          const rotation = -bearing
          mapContainer.current.style.transform = `rotate(${rotation}deg)`
          mapContainer.current.style.transformOrigin = 'center center'
          mapContainer.current.style.transition = 'transform 0.5s ease-out'
        }

        // 위치 업데이트 콜백
        if (onLocationUpdate) {
          onLocationUpdate(newPos)
        }

        console.log('📍 네비게이션 위치 업데이트:', newPos, `속도: ${speed.toFixed(1)}km/h`)
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
  }, [isActive, map, currentMarker, onLocationUpdate])

  // 네비게이션 종료
  const handleClose = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    
    // 지도 회전 초기화
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
            {/* 다음 안내 */}
            <div className="bg-blue-600 rounded-2xl p-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
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

            {/* 진행 정보 */}
            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-gray-300">속도</span>
                  <span className="ml-2 font-semibold">{navigationState.currentSpeed.toFixed(0)} km/h</span>
                </div>
                <div>
                  <span className="text-gray-300">남은 거리</span>
                  <span className="ml-2 font-semibold">{(navigationState.remainingDistance / 1000).toFixed(1)} km</span>
                </div>
              </div>
              <div>
                <span className="text-gray-300">예상 시간</span>
                <span className="ml-2 font-semibold">{navigationState.estimatedTime}분</span>
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
              {/* 네비게이션 종료 버튼 */}
              <button
                onClick={handleClose}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                네비게이션 종료
              </button>

              {/* 중앙 정보 */}
              <div className="flex-1 text-center">
                <div className="text-white text-lg font-semibold">
                  런닝 네비게이션
                </div>
                <div className="text-gray-300 text-sm">
                  목적지까지 안내 중
                </div>
              </div>

              {/* 설정 버튼 */}
              <button className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-xl transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
