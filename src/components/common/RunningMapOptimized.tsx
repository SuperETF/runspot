'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { GPSCoordinate } from '@/types/database'
import LocationPermission from './LocationPermission'
import { Navigation } from 'lucide-react'
import { useGPSTracking } from '@/hooks/useGPSTracking'
import { useKakaoMap } from '@/hooks/useKakaoMap'

// GPS 포인트 타입 (타임스탬프 포함)
interface GPSPoint {
  lat: number
  lng: number
  timestamp: number
  accuracy?: number
}

interface RunningMapProps {
  isRunning: boolean
  onLocationUpdate?: (location: GPSPoint) => void
  onDistanceUpdate?: (distance: number) => void
  courseRoute?: Array<{ lat: number; lng: number }>
  userLocation?: { lat: number; lng: number } | null
  showStartPoint?: boolean
  currentCheckpoint?: number
  passedCheckpoints?: number[]
  isCompleted?: boolean
}

export default function RunningMapOptimized({ 
  isRunning, 
  onLocationUpdate, 
  onDistanceUpdate, 
  courseRoute = [], 
  userLocation, 
  showStartPoint = false,
  currentCheckpoint = 0,
  passedCheckpoints = [],
  isCompleted = false
}: RunningMapProps) {
  // 최적화된 훅 사용
  const { 
    mapContainer, 
    map, 
    isMapReady, 
    initializeMap, 
    addMarker, 
    addPolyline, 
    addInfoWindow, 
    setBounds, 
    clearAllMapObjects 
  } = useKakaoMap({
    onMapReady: (kakaoMap) => {
      console.log('지도 준비 완료')
    }
  })

  const { 
    gpsPath, 
    currentLocation, 
    totalDistance, 
    error: gpsError 
  } = useGPSTracking(isRunning, {
    onLocationUpdate,
    onDistanceUpdate
  })

  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown')
  const [currentMarker, setCurrentMarker] = useState<any>(null)
  const [runningPolyline, setRunningPolyline] = useState<any>(null)

  // 카카오맵 초기화
  useEffect(() => {
    const loadKakaoMaps = () => {
      if ((window as any).kakao && (window as any).kakao.maps) {
        // 이미 로드되어 있다면 바로 초기화
        if ((window as any).kakao.maps.LatLng) {
          initializeMapWithLocation()
        } else {
          // 로드되었지만 아직 준비되지 않은 경우
          (window as any).kakao.maps.load(() => {
            initializeMapWithLocation()
          })
        }
      } else {
        // 아직 로드되지 않은 경우 잠시 후 재시도
        setTimeout(loadKakaoMaps, 100)
      }
    }

    const initializeMapWithLocation = () => {
      // 위치 권한 요청
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationPermission('granted')
            const success = initializeMap({
              center: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              },
              level: 3
            })
            
            if (success && map) {
              // 현재 위치 마커 생성
              const marker = addMarker(
                { lat: position.coords.latitude, lng: position.coords.longitude },
                { title: '현재 위치' }
              )
              setCurrentMarker(marker)
            }
          },
          (error) => {
            setLocationPermission('denied')
            // 기본 위치로 초기화 (서울 중심)
            initializeMap({
              center: { lat: 37.5665, lng: 126.9780 },
              level: 3
            })
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        )
      } else {
        // 기본 위치로 초기화
        initializeMap({
          center: { lat: 37.5665, lng: 126.9780 },
          level: 3
        })
      }
    }

    loadKakaoMaps()
  }, [initializeMap, addMarker, map])

  // 코스 경로 표시
  useEffect(() => {
    if (!isMapReady || !courseRoute || courseRoute.length < 2) return

    // 코스 경로선 생성
    const coursePolyline = addPolyline(courseRoute, {
      strokeWeight: 6,
      strokeColor: '#FF6B35',
      strokeOpacity: 0.7,
      strokeStyle: 'shortdash'
    })

    // 시작점 마커 표시
    if (showStartPoint && courseRoute.length > 0) {
      const startPoint = courseRoute[0]
      const startMarker = addMarker(startPoint, { title: '시작점' })
      
      if (startMarker) {
        addInfoWindow(
          '<div style="padding:8px 12px;font-size:14px;font-weight:bold;color:#000;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.2);">🏁 시작점</div>',
          startPoint
        )
      }
    }

    // 지도 범위를 코스 전체가 보이도록 조정
    if (courseRoute.length > 0) {
      setBounds(courseRoute)
    }
  }, [isMapReady, courseRoute, showStartPoint, addPolyline, addMarker, addInfoWindow, setBounds])

  // GPS 경로 표시 업데이트
  useEffect(() => {
    if (!isMapReady || gpsPath.length < 2) return

    // 기존 런닝 경로선 제거
    if (runningPolyline) {
      runningPolyline.setMap(null)
    }

    // 새 런닝 경로선 생성
    const newPolyline = addPolyline(gpsPath, {
      strokeWeight: 5,
      strokeColor: '#00FF88',
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    })

    setRunningPolyline(newPolyline)
  }, [isMapReady, gpsPath, runningPolyline, addPolyline])

  // 현재 위치 마커 업데이트
  useEffect(() => {
    if (!currentLocation || !currentMarker) return

    try {
      if ((window as any).kakao?.maps?.LatLng) {
        const newPosition = new (window as any).kakao.maps.LatLng(
          currentLocation.lat, 
          currentLocation.lng
        )
        currentMarker.setPosition(newPosition)
      }
    } catch (error) {
      console.error('마커 위치 업데이트 오류:', error)
    }
  }, [currentLocation, currentMarker])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearAllMapObjects()
      if (runningPolyline) {
        runningPolyline.setMap(null)
      }
    }
  }, [clearAllMapObjects, runningPolyline])

  // 위치 권한이 거부된 경우
  if (locationPermission === 'denied') {
    return (
      <div className="relative w-full h-[300px] bg-gray-900 rounded-2xl overflow-hidden">
        <LocationPermission 
          onPermissionGranted={(position) => {
            setLocationPermission('granted')
            const success = initializeMap({
              center: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              },
              level: 3
            })
            
            if (success) {
              const marker = addMarker(
                { lat: position.coords.latitude, lng: position.coords.longitude },
                { title: '현재 위치' }
              )
              setCurrentMarker(marker)
            }
          }}
          onPermissionDenied={() => {
            setLocationPermission('denied')
          }}
        />
      </div>
    )
  }

  return (
    <div className="relative w-full h-[300px] bg-gray-900 rounded-2xl overflow-hidden">
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ background: '#1a1a1a' }}
      />
      
      {/* GPS 오류 표시 */}
      {gpsError && (
        <div className="absolute top-3 right-3 bg-red-500/20 border border-red-500 rounded-xl px-3 py-2 z-10">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <Navigation className="w-4 h-4" />
            <span>GPS 오류</span>
          </div>
        </div>
      )}

      {/* 런닝 상태 표시 */}
      {isRunning && (
        <div className="absolute top-3 left-3 bg-[#00FF88]/20 border border-[#00FF88] rounded-xl px-3 py-2 z-10">
          <div className="flex items-center gap-2 text-sm text-[#00FF88]">
            <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
            <span>GPS 추적 중</span>
          </div>
        </div>
      )}

      {/* 거리 정보 */}
      {totalDistance > 0 && (
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md rounded-xl px-3 py-2 z-10">
          <div className="text-sm text-white">
            <span className="text-[#00FF88] font-semibold">
              {totalDistance.toFixed(2)}km
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
