'use client'

import { useEffect, useState } from 'react'
import { GPSCoordinate } from '@/types/database'
import { toKakaoLatLng } from '@/utils/mapUtils'

interface KakaoMapInstance {
  setMap?: (map: any) => void
}

interface CoursePolylineProps {
  map?: KakaoMapInstance
  path: GPSCoordinate[]
  strokeColor?: string
  strokeWeight?: number
  strokeOpacity?: number
  strokeStyle?: 'solid' | 'shortdash' | 'shortdot' | 'shortdashdot' | 'longdash' | 'longdashdot' | 'dot'
  zIndex?: number
}

const CoursePolyline = ({
  map,
  path,
  strokeColor = '#00FF88', // 네온 그린
  strokeWeight = 4,
  strokeOpacity = 0.8,
  strokeStyle = 'solid',
  zIndex = 1
}: CoursePolylineProps) => {
  const [polyline, setPolyline] = useState<{ setMap: (map: any) => void } | null>(null)

  useEffect(() => {
    if (!map || !window.kakao || path.length < 2) return

    // 기존 폴리라인 제거
    if (polyline) {
      polyline.setMap(null)
    }

    // 좌표 배열을 Kakao Maps LatLng 객체로 변환
    const kakaoPath = path
      .map(coord => toKakaoLatLng(coord))
      .filter(coord => coord !== null)

    if (kakaoPath.length < 2) return

    // 폴리라인 생성
    const newPolyline = new window.kakao.maps.Polyline({
      path: kakaoPath,
      strokeWeight,
      strokeColor,
      strokeOpacity,
      strokeStyle,
      zIndex
    })

    // 지도에 폴리라인 표시
    newPolyline.setMap(map)
    setPolyline(newPolyline)

    // 컴포넌트 언마운트 시 폴리라인 제거
    return () => {
      if (newPolyline) {
        newPolyline.setMap(null)
      }
    }
  }, [map, path, strokeColor, strokeWeight, strokeOpacity, strokeStyle, zIndex, polyline])

  // 폴리라인 제거
  useEffect(() => {
    return () => {
      if (polyline) {
        polyline.setMap(null)
      }
    }
  }, [polyline])

  return null // 이 컴포넌트는 렌더링되지 않음
}

export default CoursePolyline
