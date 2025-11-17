'use client'

import React from 'react'
import { MapMarker } from 'react-kakao-maps-sdk'
import { GPSCoordinate } from '@/types/database'

interface CourseMarkerProps {
  position: GPSCoordinate
  type?: 'start' | 'end' | 'waypoint' | 'facility' | 'current' | 'profile'
  title?: string
  content?: string
  onClick?: () => void
  profileImage?: string
}

const CourseMarker = ({
  position,
  type = 'waypoint',
  title,
  content,
  onClick,
  profileImage
}: CourseMarkerProps) => {
  // 마커 이미지 URL 생성
  const getMarkerImageSrc = (markerType: string): string => {
    const baseUrl = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc'
    
    switch (markerType) {
      case 'start':
        return `${baseUrl}/red_b.png` // 시작점 (빨간색)
      case 'end':
        return `${baseUrl}/blue_b.png` // 종료점 (파란색)
      case 'current':
        return `${baseUrl}/marker_number_blue.png` // 현재 위치
      case 'facility':
        return `${baseUrl}/places_category.png` // 편의시설
      default:
        return `${baseUrl}/markerStar.png` // 기본 마커
    }
  }

  // 프로필 타입일 때는 커스텀 마커 사용
  if (type === 'profile') {
    return (
      <MapMarker
        position={position}
        title=""
        onClick={onClick}
      >
        <div 
          className="relative kakao-map-marker-custom"
          style={{
            background: 'transparent !important',
            border: 'none !important',
            padding: '0 !important',
            margin: '0 !important',
            boxShadow: 'none !important',
            borderRadius: '0 !important',
            opacity: '1 !important',
            transform: 'translate(-50%, -50%)',
            position: 'relative',
            zIndex: 1000
          }}
        >
          {profileImage ? (
            <div className="w-14 h-14 rounded-full border-3 border-[#00FF88] shadow-lg overflow-hidden bg-white relative">
              <img
                src={profileImage}
                alt="내 프로필"
                className="w-full h-full object-cover"
                style={{ 
                  borderRadius: '50%',
                  display: 'block'
                }}
              />
              {/* 온라인 상태 표시 점 */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#00FF88] rounded-full border-2 border-white shadow-sm"></div>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full border-3 border-[#00FF88] bg-[#00FF88] flex items-center justify-center shadow-lg relative">
              <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              {/* 온라인 상태 표시 점 */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full border-2 border-[#00FF88] shadow-sm"></div>
            </div>
          )}
        </div>
      </MapMarker>
    )
  }

  const imageSrc = getMarkerImageSrc(type)

  return (
    <MapMarker
      position={position}
      image={{
        src: imageSrc,
        size: { width: 24, height: 35 },
        options: { offset: { x: 12, y: 35 } }
      }}
      title="12312"
      onClick={onClick}
    />
    
  )
}

export default CourseMarker
