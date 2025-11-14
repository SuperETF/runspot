'use client'

import React, { useState, forwardRef } from 'react'
import { useTranslation, useAccessibility } from '@/hooks/useTranslation'
import { ImageIcon, AlertCircle } from 'lucide-react'

interface AccessibleImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  altKey?: string
  altOptions?: Record<string, any>
  fallbackAltKey?: string
  showLoadingPlaceholder?: boolean
  showErrorPlaceholder?: boolean
  aspectRatio?: 'square' | '16:9' | '4:3' | '3:2' | 'auto'
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down'
}

const AccessibleImage = forwardRef<HTMLImageElement, AccessibleImageProps>(({
  src,
  altKey,
  altOptions,
  fallbackAltKey = 'accessibility.image_unavailable',
  showLoadingPlaceholder = true,
  showErrorPlaceholder = true,
  aspectRatio = 'auto',
  objectFit = 'cover',
  className = '',
  onLoad,
  onError,
  ...props
}, ref) => {
  const { t } = useTranslation()
  const { getImageA11yProps } = useAccessibility()
  
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // 접근성 속성
  const a11yProps = altKey ? getImageA11yProps(altKey, altOptions) : {}
  
  // 종횡비 스타일
  const aspectRatioStyles = {
    'square': 'aspect-square',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '3:2': 'aspect-[3/2]',
    'auto': ''
  }
  
  // 객체 맞춤 스타일
  const objectFitStyles = {
    'cover': 'object-cover',
    'contain': 'object-contain',
    'fill': 'object-fill',
    'scale-down': 'object-scale-down'
  }

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false)
    setHasError(false)
    onLoad?.(event)
  }

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false)
    setHasError(true)
    onError?.(event)
  }

  // 로딩 플레이스홀더
  const LoadingPlaceholder = () => (
    <div className={`flex items-center justify-center bg-gray-100 ${aspectRatioStyles[aspectRatio]} ${className}`}>
      <div className="flex flex-col items-center space-y-2 text-gray-400">
        <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full" />
        <span className="text-sm">{t('common.loading')}</span>
      </div>
    </div>
  )

  // 에러 플레이스홀더
  const ErrorPlaceholder = () => (
    <div className={`flex items-center justify-center bg-gray-100 ${aspectRatioStyles[aspectRatio]} ${className}`}>
      <div className="flex flex-col items-center space-y-2 text-gray-400">
        <AlertCircle className="w-8 h-8" />
        <span className="text-sm text-center px-2">
          {t(fallbackAltKey)}
        </span>
      </div>
    </div>
  )

  // 이미지가 없는 경우
  if (!src) {
    if (showErrorPlaceholder) {
      return <ErrorPlaceholder />
    }
    return null
  }

  return (
    <div className={`relative ${aspectRatio !== 'auto' ? aspectRatioStyles[aspectRatio] : ''}`}>
      {/* 로딩 플레이스홀더 */}
      {isLoading && showLoadingPlaceholder && (
        <div className="absolute inset-0">
          <LoadingPlaceholder />
        </div>
      )}

      {/* 에러 플레이스홀더 */}
      {hasError && showErrorPlaceholder && (
        <div className="absolute inset-0">
          <ErrorPlaceholder />
        </div>
      )}

      {/* 실제 이미지 */}
      <img
        ref={ref}
        src={src}
        onLoad={handleLoad}
        onError={handleError}
        className={`${aspectRatio !== 'auto' ? 'w-full h-full' : ''} ${objectFitStyles[objectFit]} ${isLoading || hasError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200 ${className}`}
        {...a11yProps}
        {...props}
      />
    </div>
  )
})

AccessibleImage.displayName = 'AccessibleImage'

export default AccessibleImage

// 프로필 이미지 컴포넌트
interface ProfileImageProps extends Omit<AccessibleImageProps, 'altKey' | 'aspectRatio'> {
  userName?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showOnlineStatus?: boolean
  isOnline?: boolean
}

export const ProfileImage = forwardRef<HTMLImageElement, ProfileImageProps>(({
  userName,
  size = 'md',
  showOnlineStatus = false,
  isOnline = false,
  className = '',
  ...props
}, ref) => {
  const { t } = useTranslation()
  
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }
  
  const statusSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3', 
    lg: 'w-4 h-4',
    xl: 'w-5 h-5'
  }

  return (
    <div className={`relative ${sizeStyles[size]}`}>
      <AccessibleImage
        ref={ref}
        aspectRatio="square"
        altKey="accessibility.profile_image"
        altOptions={{ userName: userName || t('common.user') }}
        className={`rounded-full ${className}`}
        {...props}
      />
      
      {/* 온라인 상태 표시 */}
      {showOnlineStatus && (
        <div
          className={`absolute bottom-0 right-0 ${statusSizes[size]} rounded-full border-2 border-white ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
          aria-label={t(isOnline ? 'accessibility.user_online' : 'accessibility.user_offline')}
          role="status"
        />
      )}
    </div>
  )
})

ProfileImage.displayName = 'ProfileImage'

// 코스 이미지 컴포넌트
interface CourseImageProps extends Omit<AccessibleImageProps, 'altKey'> {
  courseName?: string
  difficulty?: string
}

export const CourseImage = forwardRef<HTMLImageElement, CourseImageProps>(({
  courseName,
  difficulty,
  className = '',
  ...props
}, ref) => {
  return (
    <AccessibleImage
      ref={ref}
      aspectRatio="16:9"
      altKey="accessibility.course_image"
      altOptions={{ 
        courseName: courseName || '',
        difficulty: difficulty || ''
      }}
      className={`rounded-lg ${className}`}
      {...props}
    />
  )
})

CourseImage.displayName = 'CourseImage'

// 스팟 이미지 컴포넌트
interface SpotImageProps extends Omit<AccessibleImageProps, 'altKey'> {
  spotName?: string
  spotType?: string
}

export const SpotImage = forwardRef<HTMLImageElement, SpotImageProps>(({
  spotName,
  spotType,
  className = '',
  ...props
}, ref) => {
  return (
    <AccessibleImage
      ref={ref}
      aspectRatio="4:3"
      altKey="accessibility.spot_image"
      altOptions={{ 
        spotName: spotName || '',
        spotType: spotType || ''
      }}
      className={`rounded-lg ${className}`}
      {...props}
    />
  )
})

SpotImage.displayName = 'SpotImage'
