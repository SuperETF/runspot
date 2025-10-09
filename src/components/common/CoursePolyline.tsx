'use client'

import React from 'react'
import { Polyline } from 'react-kakao-maps-sdk'
import { GPSCoordinate } from '@/types/database'

interface CoursePolylineProps {
  path: GPSCoordinate[]
  strokeColor?: string
  strokeWeight?: number
  strokeOpacity?: number
  strokeStyle?: 'solid' | 'shortdash' | 'shortdot' | 'shortdashdot' | 'longdash' | 'longdashdot' | 'dot'
}

const CoursePolyline = ({
  path,
  strokeColor = '#00FF88', // 네온 그린
  strokeWeight = 4,
  strokeOpacity = 0.8,
  strokeStyle = 'solid'
}: CoursePolylineProps) => {
  if (path.length < 2) return null

  return (
    <Polyline
      path={path}
      strokeWeight={strokeWeight}
      strokeColor={strokeColor}
      strokeOpacity={strokeOpacity}
      strokeStyle={strokeStyle}
    />
  )
}

export default CoursePolyline
