'use client'

import { useEffect, useRef, useState } from 'react'

interface GPSPoint {
  lat: number
  lng: number
  timestamp: number
}

interface RunningMapProps {
  isRunning: boolean
  onLocationUpdate?: (location: GPSPoint) => void
  onDistanceUpdate?: (distance: number) => void
}

// 카카오맵 타입은 KakaoMap.tsx에서 이미 선언됨

export default function RunningMap({ isRunning, onLocationUpdate, onDistanceUpdate }: RunningMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [currentMarker, setCurrentMarker] = useState<any>(null)
  const [polyline, setPolyline] = useState<any>(null)
  const [gpsPath, setGpsPath] = useState<GPSPoint[]>([])
  const [watchId, setWatchId] = useState<number | null>(null)

  // 카카오맵 초기화
  useEffect(() => {
    const initializeMap = () => {
      if (!window.kakao || !mapContainer.current) return

      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심
        level: 3
      }

      const kakaoMap = new window.kakao.maps.Map(mapContainer.current, options)
      setMap(kakaoMap)

      // 현재 위치로 이동
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude
            const lng = position.coords.longitude
            const locPosition = new window.kakao.maps.LatLng(lat, lng)
            
            kakaoMap.setCenter(locPosition)
            
            // 현재 위치 마커 생성
            const marker = new window.kakao.maps.Marker({
              position: locPosition,
              map: kakaoMap
            })
            setCurrentMarker(marker)
          },
          (error) => {
            console.error('위치 정보를 가져올 수 없습니다:', error)
          }
        )
      }
    }

    // 카카오맵 스크립트 로드 확인
    if (window.kakao && window.kakao.maps) {
      initializeMap()
    } else {
      const script = document.createElement('script')
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`
      script.onload = () => {
        window.kakao.maps.load(initializeMap)
      }
      document.head.appendChild(script)
    }
  }, [])

  // GPS 추적 시작/중지
  useEffect(() => {
    if (isRunning && !watchId) {
      // GPS 추적 시작
      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const newPoint: GPSPoint = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: Date.now()
            }

            // GPS 경로에 추가
            setGpsPath(prev => {
              const updated = [...prev, newPoint]
              
              // 거리 계산
              if (updated.length > 1) {
                const totalDistance = calculateTotalDistance(updated)
                onDistanceUpdate?.(totalDistance)
              }
              
              return updated
            })

            // 지도 업데이트
            if (map && window.kakao) {
              const position = new window.kakao.maps.LatLng(newPoint.lat, newPoint.lng)
              
              // 현재 위치 마커 업데이트
              if (currentMarker) {
                currentMarker.setPosition(position)
              }
              
              // 지도 중심 이동
              map.setCenter(position)
              
              // 경로 그리기
              updatePolyline(gpsPath.concat(newPoint))
            }

            // 부모 컴포넌트에 위치 업데이트 알림
            onLocationUpdate?.(newPoint)
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
    } else if (!isRunning && watchId) {
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

  // 경로선 업데이트
  const updatePolyline = (path: GPSPoint[]) => {
    if (!map || !window.kakao || path.length < 2) return

    // 기존 경로선 제거
    if (polyline) {
      polyline.setMap(null)
    }

    // 새 경로선 생성
    const linePath = path.map(point => new window.kakao.maps.LatLng(point.lat, point.lng))
    
    const newPolyline = new window.kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 5,
      strokeColor: '#00FF88',
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    })

    newPolyline.setMap(map)
    setPolyline(newPolyline)
  }

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

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className="w-full h-64 rounded-2xl overflow-hidden border border-gray-800"
      />
      
      {/* GPS 상태 표시 */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-800">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[#00FF88] animate-pulse' : 'bg-gray-500'}`}></div>
          <span className="text-xs text-white">
            {isRunning ? 'GPS 추적 중' : 'GPS 대기'}
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
    </div>
  )
}
