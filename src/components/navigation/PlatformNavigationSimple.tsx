'use client'

import React from 'react'
import { ArrowLeft, MoreHorizontal, Share, Settings } from 'lucide-react'
import { usePlatformDetection } from '@/hooks/usePlatformDetection'

interface NavigationProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  showMenuButton?: boolean
  showShareButton?: boolean
  onBack?: () => void
  onMenu?: () => void
  onShare?: () => void
  rightActions?: React.ReactNode
  transparent?: boolean
  className?: string
}

export default function PlatformNavigationSimple({
  title = '',
  subtitle = '',
  showBackButton = false,
  showMenuButton = false,
  showShareButton = false,
  onBack,
  onMenu,
  onShare,
  rightActions,
  transparent = false,
  className = ''
}: NavigationProps) {
  const { isIOS, isAndroid, selectByDesign } = usePlatformDetection()

  // iOS Cupertino 스타일 네비게이션
  const CupertinoNavigation = () => (
    <div 
      className={`
        flex items-center justify-between px-4 py-2 
        ${transparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-xl'}
        border-b border-gray-200/30
        ${className}
      `}
      style={{ height: '44px', minHeight: '44px' }}
    >
      {/* 좌측 영역 */}
      <div className="flex items-center min-w-0 flex-1">
        {showBackButton && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 ease-out"
          >
            <ArrowLeft className="w-5 h-5 text-blue-500" />
          </button>
        )}
        
        {/* 타이틀 (좌측 정렬 - iOS 스타일) */}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-gray-900 truncate" style={{ fontSize: '17px', fontWeight: '600', letterSpacing: '-0.41px' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate" style={{ fontSize: '13px', letterSpacing: '-0.08px' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* 우측 영역 */}
      <div className="flex items-center space-x-2 ml-4">
        {showShareButton && (
          <button
            onClick={onShare}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 ease-out"
          >
            <Share className="w-4 h-4 text-blue-500" />
          </button>
        )}
        
        {showMenuButton && (
          <button
            onClick={onMenu}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 ease-out"
          >
            <MoreHorizontal className="w-4 h-4 text-blue-500" />
          </button>
        )}
        
        {rightActions}
      </div>
    </div>
  )

  // Android Material Design 3 스타일 네비게이션
  const MaterialNavigation = () => (
    <div 
      className={`
        flex items-center px-4 py-0
        ${transparent ? 'bg-transparent' : 'bg-white shadow-sm'}
        ${className}
      `}
      style={{ height: '64px', minHeight: '64px' }}
    >
      {/* 좌측 영역 */}
      <div className="flex items-center min-w-0 flex-1">
        {showBackButton && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-12 h-12 mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-300"
            style={{ transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)' }}
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
        
        {/* 타이틀 (중앙 정렬 - Material 스타일) */}
        <div className="min-w-0 flex-1 text-center">
          <h1 className="text-xl font-medium text-gray-900 truncate" style={{ fontSize: '22px', fontWeight: '400', letterSpacing: '0px' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 truncate" style={{ fontSize: '12px', letterSpacing: '0.4px' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* 우측 영역 */}
      <div className="flex items-center space-x-1 ml-4">
        {showShareButton && (
          <button
            onClick={onShare}
            className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-300"
            style={{ transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)' }}
          >
            <Share className="w-5 h-5 text-gray-700" />
          </button>
        )}
        
        {showMenuButton && (
          <button
            onClick={onMenu}
            className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-300"
            style={{ transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)' }}
          >
            <MoreHorizontal className="w-5 h-5 text-gray-700" />
          </button>
        )}
        
        {rightActions}
      </div>
    </div>
  )

  // 웹 스타일 네비게이션
  const WebNavigation = () => (
    <div 
      className={`
        flex items-center justify-between px-6 py-4
        ${transparent ? 'bg-transparent' : 'bg-white border-b border-gray-200'}
        ${className}
      `}
      style={{ height: '60px', minHeight: '60px' }}
    >
      {/* 좌측 영역 */}
      <div className="flex items-center min-w-0 flex-1">
        {showBackButton && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 mr-3 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 truncate mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* 우측 영역 */}
      <div className="flex items-center space-x-2 ml-4">
        {showShareButton && (
          <button
            onClick={onShare}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150"
          >
            <Share className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        {showMenuButton && (
          <button
            onClick={onMenu}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        {rightActions}
      </div>
    </div>
  )

  // 플랫폼별 컴포넌트 선택
  if (isIOS) {
    return <CupertinoNavigation />
  } else if (isAndroid) {
    return <MaterialNavigation />
  } else {
    return <WebNavigation />
  }
}
