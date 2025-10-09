'use client'

import React from 'react'
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk'
import { GPSCoordinate } from '@/types/database'

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

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Map
        center={center}
        level={zoom}
        style={{ width, height }}
        onClick={handleMapClick}
        onZoomChanged={handleZoomChanged}
        onCenterChanged={handleCenterChanged}
      >
        {children}
      </Map>
    </div>
  )
}

export default KakaoMap
