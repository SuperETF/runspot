'use client'

import React, { useRef, useState, useEffect } from 'react'
import { GPSCoordinate } from '@/types/database'
import LocationPermission from './LocationPermission'
import { Navigation } from 'lucide-react'

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

// 카카오맵 타입은 KakaoMap.tsx에서 이미 선언됨

export default function RunningMap({ 
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
  const mapContainer = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [currentMarker, setCurrentMarker] = useState<any>(null)
  const [polyline, setPolyline] = useState<any>(null)
  const [coursePolyline, setCoursePolyline] = useState<any>(null)
  const [startPointMarker, setStartPointMarker] = useState<any>(null)
  const [gpsPath, setGpsPath] = useState<GPSPoint[]>([])
  const [watchId, setWatchId] = useState<number | null>(null)
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown')
  const [initialPosition, setInitialPosition] = useState<GeolocationPosition | null>(null)

  // 카카오맵 초기화
  useEffect(() => {
    const initializeMap = (position?: GeolocationPosition) => {
      if (!(window as any).kakao || !(window as any).kakao.maps || !mapContainer.current) return

      // 위치 정보가 있으면 해당 위치를, 없으면 서울 중심을 사용
      const lat = position ? position.coords.latitude : 37.5665
      const lng = position ? position.coords.longitude : 126.9780

      const options = {
        center: new (window as any).kakao.maps.LatLng(lat, lng),
        level: 3
      }

      const kakaoMap = new (window as any).kakao.maps.Map(mapContainer.current, options)
      setMap(kakaoMap)

      // 위치 정보가 있으면 마커 생성
      if (position) {
        const locPosition = new (window as any).kakao.maps.LatLng(lat, lng)
        const marker = new (window as any).kakao.maps.Marker({
          position: locPosition,
          map: kakaoMap
        })
        setCurrentMarker(marker)
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

  // GPS 경로 변경 시 거리 계산 및 콜백 호출
  useEffect(() => {
    if (gpsPath.length > 0) {
      // 최신 위치 업데이트
      const latestPoint = gpsPath[gpsPath.length - 1]
      onLocationUpdate?.(latestPoint)
      
      // 거리 계산
      if (gpsPath.length > 1) {
        const totalDistance = calculateTotalDistance(gpsPath)
        onDistanceUpdate?.(totalDistance)
      }
    }
  }, [gpsPath, onLocationUpdate, onDistanceUpdate])

  // 코스 경로와 시작점 표시
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

    // 코스 경로 표시
    const path = courseRoute.map(point => 
      new (window as any).kakao.maps.LatLng(point.lat, point.lng)
    )

    const newCoursePolyline = new (window as any).kakao.maps.Polyline({
      path: path,
      strokeWeight: 4,
      strokeColor: '#00FF88',
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    })

    newCoursePolyline.setMap(map)
    setCoursePolyline(newCoursePolyline)

    // 시작점 마커 표시
    if (showStartPoint && courseRoute[0]) {
      const startPoint = courseRoute[0]
      const startPosition = new (window as any).kakao.maps.LatLng(startPoint.lat, startPoint.lng)
      
      // 커스텀 마커 이미지 생성
      const imageSrc = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#00FF88" stroke="#000" stroke-width="2"/>
          <text x="20" y="26" text-anchor="middle" fill="#000" font-size="12" font-weight="bold">START</text>
        </svg>
      `)
      
      const imageSize = new (window as any).kakao.maps.Size(40, 40)
      const imageOption = { offset: new (window as any).kakao.maps.Point(20, 20) }
      const markerImage = new (window as any).kakao.maps.MarkerImage(imageSrc, imageSize, imageOption)

      const newStartPointMarker = new (window as any).kakao.maps.Marker({
        position: startPosition,
        image: markerImage,
        map: map
      })

      setStartPointMarker(newStartPointMarker)

      // 지도 중심을 시작점으로 이동
      map.setCenter(startPosition)
      map.setLevel(4)
    }
  }, [map, courseRoute, showStartPoint])

  // 위치 권한 허용 처리
  const handleLocationPermissionGranted = (position: GeolocationPosition) => {
    setLocationPermission('granted')
    setInitialPosition(position)
  }

  // 위치 권한 거부 처리
  const handleLocationPermissionDenied = () => {
    setLocationPermission('denied')
  }

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
  const updatePolyline = (path: GPSPoint[]) => {
    if (!map || !(window as any).kakao || !(window as any).kakao.maps || path.length < 2) return

    // 기존 경로선 제거
    if (polyline) {
      polyline.setMap(null)
    }

    // 새 경로선 생성
    const linePath = path.map(point => new (window as any).kakao.maps.LatLng(point.lat, point.lng))
    
    const newPolyline = new (window as any).kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 5,
      strokeColor: '#00FF88',
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    })

    newPolyline.setMap(map)
    setPolyline(newPolyline)
  }

  // GPS 추적 시작/중지
  useEffect(() => {
    if (isRunning && !watchId) {
      // GPS 추적 시작
      if (navigator.geolocation) {
      }
      return
    }

    // GPS 추적 시작
    if (!watchId && navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          const accuracy = position.coords.accuracy
          
          const newPoint: GPSPoint = {
            lat,
            lng,
            timestamp: Date.now(),
            accuracy
          }

          setGpsPath(prev => {
            const updated = [...prev, newPoint]
            updatePolyline(updated)
            return updated
          })

          // 현재 위치 마커 업데이트
          const moveLatLon = new (window as any).kakao.maps.LatLng(lat, lng)
          if (currentMarker) {
            currentMarker.setPosition(moveLatLon)
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
    }

    // GPS 추적 중지
    if (!isRunning && watchId) {
      // GPS 추적 중지
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [isRunning, map, currentMarker, gpsPath, watchId, onLocationUpdate, onDistanceUpdate])

  // 총 거리 계산 (Haversine 공식)
  const calculateTotalDistance = (path: GPSPoint[]): number => {
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

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className="w-full h-64 rounded-2xl overflow-hidden border border-gray-800"
      />
      
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
          <div>경로 포인트: {gpsPath.length}</div>
          {gpsPath.length > 1 && (
            <div className="text-[#00FF88]">
              거리: {calculateTotalDistance(gpsPath).toFixed(2)}km
            </div>
          )}
        </div>
      </div>

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
