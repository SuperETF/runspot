'use client'

import { useEffect, useState } from 'react'
import { GPSCoordinate } from '@/types/database'
import { toKakaoLatLng } from '@/utils/mapUtils'

interface KakaoMapInstance {
  setMap?: (map: any) => void
}

interface CourseMarkerProps {
  map?: KakaoMapInstance
  position: GPSCoordinate
  type?: 'start' | 'end' | 'waypoint' | 'facility' | 'current'
  title?: string
  content?: string
  onClick?: () => void
  zIndex?: number
}

const CourseMarker = ({
  map,
  position,
  type = 'waypoint',
  title,
  content,
  onClick,
  zIndex = 1
}: CourseMarkerProps) => {
  const [marker, setMarker] = useState<{ setMap: (map: any) => void } | null>(null)
  const [infoWindow, setInfoWindow] = useState<{ open: (map: any, marker: any) => void; close: () => void } | null>(null)

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

  useEffect(() => {
    if (!map || !window.kakao || !position) return

    // 기존 마커 제거
    if (marker) {
      marker.setMap(null)
    }

    // 마커 이미지 설정
    const imageSrc = getMarkerImageSrc(type)
    const imageSize = new window.kakao.maps.Size(24, 35)
    const imageOption = { offset: new window.kakao.maps.Point(12, 35) }
    
    const markerImage = new window.kakao.maps.MarkerImage(
      imageSrc,
      imageSize,
      imageOption
    )

    // 마커 생성
    const kakaoPosition = toKakaoLatLng(position)
    if (!kakaoPosition) return

    const newMarker = new window.kakao.maps.Marker({
      position: kakaoPosition,
      image: markerImage,
      title: title || '',
      zIndex
    })

    // 지도에 마커 표시
    newMarker.setMap(map)
    setMarker(newMarker)

    // 정보창 생성 (content가 있는 경우)
    if (content) {
      const newInfoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="
            padding: 8px 12px;
            background: #1a1a1a;
            color: #ffffff;
            border-radius: 8px;
            font-size: 12px;
            min-width: 120px;
            border: 1px solid #333;
          ">
            ${title ? `<div style="font-weight: bold; margin-bottom: 4px; color: #00FF88;">${title}</div>` : ''}
            <div>${content}</div>
          </div>
        `
      })
      setInfoWindow(newInfoWindow)

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(newMarker, 'click', () => {
        newInfoWindow.open(map, newMarker)
        if (onClick) onClick()
      })

      // 지도 클릭 시 정보창 닫기
      window.kakao.maps.event.addListener(map, 'click', () => {
        newInfoWindow.close()
      })
    } else if (onClick) {
      // content가 없고 onClick만 있는 경우
      window.kakao.maps.event.addListener(newMarker, 'click', onClick)
    }

    // 컴포넌트 언마운트 시 마커 제거
    return () => {
      if (newMarker) {
        newMarker.setMap(null)
      }
    }
  }, [map, position, type, title, content, onClick, zIndex, marker])

  // 마커 제거
  useEffect(() => {
    return () => {
      if (marker) {
        marker.setMap(null)
      }
      if (infoWindow) {
        infoWindow.close()
      }
    }
  }, [marker, infoWindow])

  return null // 이 컴포넌트는 렌더링되지 않음
}

export default CourseMarker
