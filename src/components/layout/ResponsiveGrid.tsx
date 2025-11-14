'use client'

import React from 'react'
import { useSafeArea } from '@/hooks/useSafeArea'

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
  minItemWidth?: string
}

export default function ResponsiveGrid({
  children,
  className = '',
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: '1rem', tablet: '1.5rem', desktop: '2rem' },
  minItemWidth = '280px'
}: ResponsiveGridProps) {
  const { viewport } = useSafeArea()

  // 현재 뷰포트에 따른 컬럼 수 결정
  const getCurrentColumns = () => {
    if (viewport.width >= 1024) return columns.desktop || 3
    if (viewport.width >= 768 || viewport.isTablet) return columns.tablet || 2
    return columns.mobile || 1
  }

  // 현재 뷰포트에 따른 간격 결정
  const getCurrentGap = () => {
    if (viewport.width >= 1024) return gap.desktop || '2rem'
    if (viewport.width >= 768 || viewport.isTablet) return gap.tablet || '1.5rem'
    return gap.mobile || '1rem'
  }

  const currentColumns = getCurrentColumns()
  const currentGap = getCurrentGap()

  return (
    <div
      className={`responsive-grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${currentColumns}, minmax(${minItemWidth}, 1fr))`,
        gap: currentGap,
        width: '100%'
      }}
    >
      {children}
    </div>
  )
}

// 적응형 레이아웃 컴포넌트
export function AdaptiveLayout({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string
}) {
  const { viewport } = useSafeArea()

  // 태블릿 가로 모드에서 사이드바 레이아웃
  const isTabletLandscape = viewport.isTablet && viewport.isLandscape
  
  if (isTabletLandscape) {
    return (
      <div className={`flex ${className}`}>
        {/* 사이드바 영역 */}
        <div className="w-80 flex-shrink-0">
          {/* 사이드바 컨텐츠 */}
        </div>
        
        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    )
  }

  // 일반 레이아웃
  return (
    <div className={className}>
      {children}
    </div>
  )
}

// 카드 그리드 컴포넌트
export function CardGrid({ 
  children, 
  className = '',
  cardMinWidth = '300px' 
}: { 
  children: React.ReactNode
  className?: string
  cardMinWidth?: string
}) {
  return (
    <ResponsiveGrid
      className={className}
      columns={{ mobile: 1, tablet: 2, desktop: 3 }}
      gap={{ mobile: '1rem', tablet: '1.5rem', desktop: '2rem' }}
      minItemWidth={cardMinWidth}
    >
      {children}
    </ResponsiveGrid>
  )
}

// 리스트 그리드 컴포넌트 (더 많은 컬럼)
export function ListGrid({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <ResponsiveGrid
      className={className}
      columns={{ mobile: 1, tablet: 3, desktop: 4 }}
      gap={{ mobile: '0.5rem', tablet: '1rem', desktop: '1rem' }}
      minItemWidth='200px'
    >
      {children}
    </ResponsiveGrid>
  )
}
