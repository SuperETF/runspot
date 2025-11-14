'use client'

import React, { useEffect } from 'react'
import { useSafeArea } from '@/hooks/useSafeArea'
import { usePlatformDetection } from '@/hooks/usePlatformDetection'

interface SafeAreaLayoutProps {
  children: React.ReactNode
  className?: string
  enableInsets?: {
    top?: boolean
    bottom?: boolean
    left?: boolean
    right?: boolean
  }
  minHeight?: 'screen' | 'viewport' | 'none'
}

export default function SafeAreaLayout({
  children,
  className = '',
  enableInsets = { top: true, bottom: true, left: true, right: true },
  minHeight = 'viewport'
}: SafeAreaLayoutProps) {
  const { safeAreaInsets, viewport, cssVars } = useSafeArea()
  const { isIOS, isAndroid } = usePlatformDetection()

  // CSS 변수를 document에 적용
  useEffect(() => {
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value)
    })
  }, [cssVars])

  const paddingStyle = {
    paddingTop: enableInsets.top ? safeAreaInsets.top : 0,
    paddingBottom: enableInsets.bottom ? safeAreaInsets.bottom : 0,
    paddingLeft: enableInsets.left ? safeAreaInsets.left : 0,
    paddingRight: enableInsets.right ? safeAreaInsets.right : 0
  }

  const minHeightStyle = {
    'screen': '100vh',
    'viewport': `${viewport.height}px`,
    'none': 'auto'
  }

  return (
    <div
      className={`safe-area-layout ${className}`}
      style={{
        ...paddingStyle,
        minHeight: minHeightStyle[minHeight],
        width: '100%',
        position: 'relative'
      }}
    >
      {children}
    </div>
  )
}

// SafeArea를 고려한 컨테이너 컴포넌트들
export function SafeAreaContainer({ 
  children, 
  className = '',
  padding = true 
}: { 
  children: React.ReactNode
  className?: string
  padding?: boolean
}) {
  return (
    <SafeAreaLayout
      className={`${padding ? 'px-4' : ''} ${className}`}
      enableInsets={{ top: true, bottom: false, left: true, right: true }}
    >
      {children}
    </SafeAreaLayout>
  )
}

// 전체 화면 컨테이너 (모달, 풀스크린 등)
export function SafeAreaFullScreen({ 
  children, 
  className = '',
  enableAllInsets = true 
}: { 
  children: React.ReactNode
  className?: string
  enableAllInsets?: boolean
}) {
  const insets = enableAllInsets 
    ? { top: true, bottom: true, left: true, right: true }
    : { top: false, bottom: false, left: false, right: false }

  return (
    <SafeAreaLayout
      className={`fixed inset-0 ${className}`}
      enableInsets={insets}
      minHeight="screen"
    >
      {children}
    </SafeAreaLayout>
  )
}

// 스크롤 가능한 컨테이너
export function SafeAreaScrollContainer({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <SafeAreaLayout
      className={`overflow-y-auto ${className}`}
      enableInsets={{ top: true, bottom: true, left: true, right: true }}
      minHeight="viewport"
    >
      {children}
    </SafeAreaLayout>
  )
}
