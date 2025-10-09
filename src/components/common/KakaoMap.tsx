'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { GPSCoordinate } from '@/types/database'
import { waitForKakaoMaps, toKakaoLatLng } from '@/utils/mapUtils'

interface KakaoMapProps {
  center?: GPSCoordinate
  zoom?: number
  width?: string
  height?: string
  className?: string
  children?: React.ReactNode
  onClick?: (coord: GPSCoordinate) => void
  onZoomChanged?: (level: number) => void
  onCenterChanged?: (center: GPSCoordinate) => void
}

interface KakaoMapInstance {
  setCenter: (center: any) => void
  setLevel: (level: number) => void
  getLevel: () => number
  getCenter: () => any
}

const KakaoMap = ({
  center = { lat: 37.5665, lng: 126.9780 }, // 서울 시청 기본값
  zoom = 3,
  width = '100%',
  height = '400px',
  className = '',
  children,
  onClick,
  onZoomChanged,
  onCenterChanged
}: KakaoMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<KakaoMapInstance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 콜백 함수들을 useCallback으로 메모이제이션
  const handleClick = useCallback((mouseEvent: any) => {
    if (onClick) {
      const latlng = mouseEvent.latLng
      onClick({
        lat: latlng.getLat(),
        lng: latlng.getLng()
      })
    }
  }, [onClick])

  const handleZoomChanged = useCallback(() => {
    if (onZoomChanged && map) {
      onZoomChanged(map.getLevel())
    }
  }, [onZoomChanged, map])

  const handleCenterChanged = useCallback(() => {
    if (onCenterChanged && map) {
      const center = map.getCenter()
      onCenterChanged({
        lat: center.getLat(),
        lng: center.getLng()
      })
    }
  }, [onCenterChanged, map])

  // Kakao Maps API 초기화
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Kakao Maps API 로드 대기
        await waitForKakaoMaps()

        if (!mapRef.current) return

        // 지도 생성
        const mapOption = {
          center: toKakaoLatLng(center),
          level: zoom
        }

        const kakaoMap = new window.kakao.maps.Map(mapRef.current, mapOption)
        setMap(kakaoMap)

        // 이벤트 리스너 등록
        window.kakao.maps.event.addListener(kakaoMap, 'click', handleClick)
        window.kakao.maps.event.addListener(kakaoMap, 'zoom_changed', handleZoomChanged)
        window.kakao.maps.event.addListener(kakaoMap, 'center_changed', handleCenterChanged)

        setIsLoading(false)
      } catch (err) {
        console.error('Kakao Maps 초기화 실패:', err)
        setError('지도를 불러올 수 없습니다.')
        setIsLoading(false)
      }
    }

    initializeMap()
  }, [handleClick, handleZoomChanged, handleCenterChanged, center, zoom])

  // 중심점 변경
  useEffect(() => {
    if (map && center) {
      const kakaoCenter = toKakaoLatLng(center)
      if (kakaoCenter) {
        map.setCenter(kakaoCenter)
      }
    }
  }, [map, center])

  // 줌 레벨 변경
  useEffect(() => {
    if (map && zoom) {
      map.setLevel(zoom)
    }
  }, [map, zoom])

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-900 text-white rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <p className="text-red-400 mb-2">⚠️ {error}</p>
          <p className="text-sm text-gray-400">
            Kakao Maps API 키를 확인해주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ width, height }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green mx-auto mb-2"></div>
            <p className="text-sm">지도 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 자식 컴포넌트들 (마커, 폴리라인 등) */}
      {map && children && (
        <div className="absolute inset-0 pointer-events-none">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { map } as any)
            }
            return child
          })}
        </div>
      )}
    </div>
  )
}

export default KakaoMap
