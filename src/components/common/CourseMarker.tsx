'use client'

import React from 'react'
import { MapMarker } from 'react-kakao-maps-sdk'
import { GPSCoordinate } from '@/types/database'

interface CourseMarkerProps {
  position: GPSCoordinate
  type?: 'start' | 'end' | 'waypoint' | 'facility' | 'current'
  title?: string
  content?: string
  onClick?: () => void
}

const CourseMarker = ({
  position,
  type = 'waypoint',
  title,
  content,
  onClick
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

  const imageSrc = getMarkerImageSrc(type)

  return (
    <MapMarker
      position={position}
      image={{
        src: imageSrc,
        size: { width: 24, height: 35 },
        options: { offset: { x: 12, y: 35 } }
      }}
      title={title}
      onClick={onClick}
    >
      {content && (
        <div style={{
          padding: '8px 12px',
          background: '#1a1a1a',
          color: '#ffffff',
          borderRadius: '8px',
          fontSize: '12px',
          minWidth: '120px',
          border: '1px solid #333'
        }}>
          {title && (
            <div style={{
              fontWeight: 'bold',
              marginBottom: '4px',
              color: '#00FF88'
            }}>
              {title}
            </div>
          )}
          <div>{content}</div>
        </div>
      )}
    </MapMarker>
  )
}

export default CourseMarker
