'use client'

import React, { useState, useEffect } from 'react'
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk'
import { GPSCoordinate, FriendLocationData } from '@/types/database'
import { MapPin, Navigation } from 'lucide-react'
import CourseMarkerIcon from './CourseMarkerIcon'
import FriendLocationMarker from '@/components/friends/FriendLocationMarker'
import { getRunSpotLogoBase64, createRunSpotMarkerSvg } from '@/utils/imageUtils'
import { useKakaoMap } from './KakaoMapWrapper'

interface KakaoMapProps {
  center: { lat: number; lng: number }
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
  showUserLocation?: boolean
  courses?: any[]
  onCourseClick?: (course: any) => void
  friendsLocations?: FriendLocationData[]
  showFriendsOnMap?: boolean
  lazy?: boolean
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
  locationAccuracy,
  showUserLocation = true,
  courses = [],
  onCourseClick,
  friendsLocations = [],
  showFriendsOnMap = true,
  lazy = false
}: KakaoMapProps) => {
  const { isLoaded, loadKakaoMap } = useKakaoMap()
  const [logoBase64, setLogoBase64] = useState<string>('')
  const [runSpotMarkerSvg, setRunSpotMarkerSvg] = useState<string>('')
  const [hasInteracted, setHasInteracted] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<GPSCoordinate | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)

  // RunSpot 로고 로드
  useEffect(() => {
    if (hasInteracted && !isLoaded) {
      loadKakaoMap()
    }
  }, [hasInteracted, isLoaded, loadKakaoMap])

  useEffect(() => {
    if (isLoaded) {
      const loadLogo = async () => {
        try {
          const logo = await getRunSpotLogoBase64()
          setLogoBase64(logo)
          
          const markerSvg = createRunSpotMarkerSvg(logo)
          setRunSpotMarkerSvg(markerSvg)
        } catch (error) {
          console.error('로고 로드 실패:', error)
        }
      }
      
      loadLogo()
    }
  }, [isLoaded])

  // center와 zoom prop이 변경될 때 지도 업데이트
  useEffect(() => {
    if (mapInstance && center) {
      const moveLatLon = new (window as any).kakao.maps.LatLng(center.lat, center.lng)
      
      // 줌 레벨이 지정되어 있으면 setLevel 먼저 실행 후 중심점 이동
      if (zoom !== undefined) {
        mapInstance.setLevel(zoom)
        mapInstance.setCenter(moveLatLon)
      } else {
        mapInstance.setCenter(moveLatLon)
      }
    }
  }, [center, zoom, mapInstance])

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

  const handleMapInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true)
    }
  }

  if (lazy && !hasInteracted) {
    return (
      <div 
        className={`relative ${className} bg-muted rounded-2xl flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors`} 
        style={{ width, height }}
        onClick={handleMapInteraction}
      >
        <div className="text-center">
          <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">지도 보기</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`relative ${className} bg-muted rounded-2xl flex items-center justify-center`} style={{ width, height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">지도 로딩 중...</p>
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
        
        {/* 현재 위치 마커 */}
        {showUserLocation && userLocation && (
          <MapMarker
            position={userLocation}
            title="내 위치"
          />
        )}

        {/* 코스 마커들 */}
        {courses.map((course, index) => {
          // 코스의 시작점 좌표 가져오기
          const startPoint = course.gps_route?.[0] || course.start_point
          if (!startPoint || !startPoint.lat || !startPoint.lng) return null

          // CourseMarkerIcon을 사용하여 일관된 마커 생성
          const markerIcon = React.createElement(CourseMarkerIcon, {
            courseType: course.course_type || 'default',
            size: 50
          })

          // RunSpot 마커 생성
          const getCourseMarkerSrc = () => {
            // logoBase64가 있으면 사용, 없으면 직접 파일 경로 사용
            if (logoBase64) {
              return logoBase64
            }
            // 폴백으로 직접 파일 경로 사용
            return '/maker.svg'
          }

          return (
            <MapMarker
              key={course.id || index}
              position={{ lat: startPoint.lat, lng: startPoint.lng }}
              title={`${course.name} (${course.distance}km)`}
              onClick={() => onCourseClick?.(course)}
              image={{
                src: getCourseMarkerSrc(),
                size: { width: 48, height: 48 },
                options: { offset: { x: 24, y: 48 } }
              }}
            />
          )
        })}

        {/* 친구 위치 마커들 */}
        {showFriendsOnMap && friendsLocations.map((friendData, index) => {
          const position = {
            lat: friendData.location.latitude,
            lng: friendData.location.longitude
          }

          // 친구 아바타 이미지 또는 기본 마커 생성
          const getFriendMarkerImage = () => {
            if (friendData.friend.profile_image) {
              return {
                src: friendData.friend.profile_image,
                size: { width: 40, height: 40 },
                options: { offset: { x: 20, y: 40 } }
              }
            }
            // 기본 친구 마커 (초록색 원)
            const canvas = document.createElement('canvas')
            canvas.width = 40
            canvas.height = 40
            const ctx = canvas.getContext('2d')
            if (ctx) {
              // 배경 원
              ctx.fillStyle = friendData.is_running ? '#00FF88' : '#6B7280'
              ctx.beginPath()
              ctx.arc(20, 20, 18, 0, 2 * Math.PI)
              ctx.fill()
              
              // 테두리
              ctx.strokeStyle = friendData.is_running ? '#00E077' : '#4B5563'
              ctx.lineWidth = 3
              ctx.stroke()
              
              // 이름 첫 글자
              ctx.fillStyle = 'white'
              ctx.font = 'bold 14px Arial'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText(friendData.friend.name.charAt(0).toUpperCase(), 20, 20)
            }
            
            return {
              src: canvas.toDataURL(),
              size: { width: 40, height: 40 },
              options: { offset: { x: 20, y: 40 } }
            }
          }

          return (
            <MapMarker
              key={`friend-${friendData.friend.id}-${index}`}
              position={position}
              title={`${friendData.friend.name} ${friendData.is_running ? '(런닝 중)' : ''}`}
              image={getFriendMarkerImage()}
              onClick={() => {
                console.log('친구 마커 클릭:', friendData.friend.name)
                // 여기에 친구 정보 팝업 로직 추가 가능
              }}
            />
          )
        })}
      </Map>
    </div>
  )
}

export default KakaoMap
