'use client'

import { useState, useEffect } from 'react'
import { getRunSpotLogoBase64 } from '@/utils/imageUtils'

interface CourseMarkerIconProps {
  courseType?: string
  size?: number
  className?: string
}

export default function CourseMarkerIcon({ 
  courseType = 'default', 
  size = 48,
  className = '' 
}: CourseMarkerIconProps) {
  const [logoBase64, setLogoBase64] = useState<string>('')

  // RunSpot 로고 로드
  useEffect(() => {
    const loadLogo = async () => {
      const logo = await getRunSpotLogoBase64()
      setLogoBase64(logo)
    }
    loadLogo()
  }, [])

  // 마커 이미지 소스 결정
  const getImageSrc = () => {
    if (logoBase64) {
      return logoBase64
    }
    return '/maker.svg'
  }

  return (
    <img 
      src={getImageSrc()} 
      alt="RunSpot 코스"
      width={size} 
      height={size} // 정사각형으로 변경
      className={className}
    />
  )
}
