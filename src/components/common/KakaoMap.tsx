'use client'

import React, { useState, useEffect } from 'react'
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk'
import { GPSCoordinate } from '@/types/database'
import { MapPin, Navigation } from 'lucide-react'

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
  onLocationUpdate?: (location: GPSCoordinate) => void
  userLocation?: GPSCoordinate | null
  userProfile?: any
  locationAccuracy?: number
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
  onCenterChanged,
  userLocation,
  userProfile,
  locationAccuracy
}: KakaoMapProps) => {
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<GPSCoordinate | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)

  // center prop이 변경될 때 지도 중심 업데이트
  useEffect(() => {
    if (mapInstance && center) {
      const moveLatLon = new (window as any).kakao.maps.LatLng(center.lat, center.lng)
      mapInstance.setCenter(moveLatLon)
    }
  }, [center, mapInstance])

  useEffect(() => {
    console.log('🗺️ KakaoMap 컴포넌트 마운트됨')
    
    // Kakao Maps SDK 로딩 상태 확인
    const checkKakaoMaps = () => {
      console.log('🔍 Kakao Maps SDK 상태 확인 중...')
      console.log('window 객체 존재:', typeof window !== 'undefined')
      console.log('kakao 객체 존재:', !!(window as any).kakao)
      console.log('kakao.maps 객체 존재:', !!(window as any).kakao?.maps)
      
      if (typeof window !== 'undefined' && (window as any).kakao && (window as any).kakao.maps) {
        console.log('✅ Kakao 객체 발견됨')
        
        // LatLng 생성자가 사용 가능한지 확인
        if ((window as any).kakao.maps.LatLng) {
          console.log('✅ Kakao Maps SDK 완전히 로드됨')
          setIsKakaoLoaded(true)
          setLoadError(null)
        } else {
          console.log('⏳ SDK 로드됨, 초기화 중...')
          // SDK는 로드되었지만 초기화되지 않은 경우
          try {
            (window as any).kakao.maps.load(() => {
              console.log('✅ Kakao Maps 초기화 완료')
              setIsKakaoLoaded(true)
              setLoadError(null)
            })
          } catch (error) {
            console.error('❌ Kakao Maps 초기화 실패:', error)
            setLoadError('Kakao Maps 초기화에 실패했습니다.')
          }
        }
      } else {
        console.log('⏳ Kakao Maps SDK 대기 중... (100ms 후 재시도)')
        // 아직 로드되지 않은 경우 계속 대기
        setTimeout(checkKakaoMaps, 100)
      }
    }

    // 환경변수 확인
    console.log('🔑 Kakao API 키 존재 여부:', !!process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY)
    
    checkKakaoMaps()
  }, [])

  const handleMapClick = (_target: any, mouseEvent: any) => {
    if (onClick) {
      const latlng = mouseEvent.latLng
      onClick({
        lat: latlng.getLat(),
        lng: latlng.getLng()
      })
    }
  }

  const handleZoomChanged = (map: any) => {
    if (onZoomChanged) {
      onZoomChanged(map.getLevel())
    }
  }

  const handleCenterChanged = (map: any) => {
    if (onCenterChanged) {
      const center = map.getCenter()
      onCenterChanged({
        lat: center.getLat(),
        lng: center.getLng()
      })
    }
  }

  // 지도 인스턴스 저장
  const handleMapLoad = (map: any) => {
    setMapInstance(map)
  }

  // 에러 상태 표시
  if (loadError) {
    return (
      <div className={`relative ${className} flex items-center justify-center bg-gray-800 text-white`} style={{ width, height }}>
        <div className="text-center p-4">
          <div className="text-red-400 mb-2">⚠️ 지도 로딩 오류</div>
          <div className="text-sm text-gray-300">{loadError}</div>
          <div className="text-xs text-gray-400 mt-2">
            Kakao Maps API 키를 확인해주세요
          </div>
        </div>
      </div>
    )
  }

  // 로딩 상태 표시
  if (!isKakaoLoaded) {
    return (
      <div className={`relative ${className} flex items-center justify-center bg-gray-800 text-white`} style={{ width, height }}>
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FF88] mx-auto mb-2"></div>
          <div className="text-sm text-gray-300">지도 로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <style jsx global>{`
        /* 말풍선 본체는 투명하게, 꼬리만 유지 */
        div[style*="position: absolute"][style*="background: rgb(255, 255, 255)"][style*="border: 1px solid rgb(118, 129, 168)"] {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        div[style*="position: absolute"][style*="background: rgb(255, 255, 255)"][style*="z-index: 0"] {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        /* 꼬리 부분만 유지 */
        div[style*="position: absolute"][style*="background: rgb(255, 255, 255)"]::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid white;
        }
      `}</style>
      <Map
        center={center}
        level={zoom}
        style={{ width, height }}
        onClick={handleMapClick}
        onZoomChanged={handleZoomChanged}
        onCenterChanged={handleCenterChanged}
        onCreate={handleMapLoad}
        disableDoubleClickZoom={false}
        keyboardShortcuts={false}
      >
        {children}
        
        {/* 현재 위치 마커 - 단순한 기본 마커 */}
        {userLocation && (
          <MapMarker
            position={userLocation}
            title="내 위치"
          />
        )}
      </Map>
    </div>
  )
}

export default KakaoMap
