'use client'

import React, { useState, useEffect } from 'react'
import { Navigation, Route, MapPin, Clock, Pause } from 'lucide-react'

interface RunningNavigationProps {
  isNavigationActive: boolean
  currentDistance?: number
  remainingDistance?: number
  estimatedTime?: number
  nextDirection?: string
  nextDistance?: number
  onStartNavigation?: () => void
  onStopNavigation?: () => void
  // 추가 상태
  isRunning?: boolean
  isAtStartPoint?: boolean
  // 레이아웃 모드
  inline?: boolean // true면 페이지에 통합, false면 floating
}

export default function RunningNavigation({
  isNavigationActive,
  currentDistance = 0,
  remainingDistance = 0,
  estimatedTime = 0,
  nextDirection = "직진하세요",
  nextDistance = 0,
  onStartNavigation,
  onStopNavigation,
  isRunning = false,
  isAtStartPoint = false,
  inline = false
}: RunningNavigationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(isNavigationActive)
  }, [isNavigationActive])

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`
    }
    return `${distance.toFixed(1)}km`
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (!isVisible) {
    // 네비게이션이 비활성화된 상태에서 버튼 표시 조건
    const canStartNavigation = isRunning && isAtStartPoint
    
    const containerClass = inline 
      ? "w-full" // 페이지에 통합
      : "fixed bottom-6 left-4 right-4 z-50" // floating
    
    return (
      <div className={containerClass}>
        <button
          onClick={onStartNavigation}
          disabled={!canStartNavigation}
          className={`w-full py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 font-bold text-lg flex items-center justify-center gap-3 ${
            canStartNavigation
              ? 'bg-[#00FF88] text-black hover:bg-[#00DD77] hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Navigation className="w-6 h-6" />
          <span>
            {!isRunning 
              ? "런닝을 먼저 시작해주세요"
              : !isAtStartPoint
              ? "시작점에 도착해주세요"
              : "🚴‍♂️ 자전거 네비게이션 시작"
            }
          </span>
        </button>
        
        {/* 상태 표시 */}
        {canStartNavigation && (
          <div className="text-center mt-2">
            <div className="inline-flex items-center gap-2 bg-[#00FF88]/20 border border-[#00FF88]/30 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
              <span className="text-[#00FF88] text-sm font-medium">네비게이션 준비완료</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const containerClass = inline 
    ? "w-full" // 페이지에 통합
    : "fixed bottom-20 left-4 right-4 z-50" // floating

  return (
    <div className={containerClass}>
      {/* 카카오맵 완전 동일 스타일 네비게이션 */}
      <div className="fixed inset-0 bg-transparent pointer-events-none">
        
        {/* 상단: 카카오맵 스타일 2단 네비게이션 카드 */}
        <div className="absolute top-4 left-4 right-4 pointer-events-auto">
          {/* 1단: 다음 안내 (파란색) */}
          <div className="bg-blue-500 text-white px-4 py-3 rounded-t-xl flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm opacity-90">
                {nextDistance > 0 ? `${formatDistance(nextDistance)}` : '6m'}
              </div>
              <div className="font-medium">
                서울 강서구 화곡동...
              </div>
            </div>
          </div>
          
          {/* 2단: 총 거리 (흰색) */}
          <div className="bg-white text-black px-4 py-3 rounded-b-xl flex items-center">
            <div className="text-blue-500 text-2xl font-bold mr-3">↑</div>
            <div className="text-xl font-bold">
              {formatDistance(remainingDistance) || '1.2km'}
            </div>
          </div>
        </div>

        {/* 하단: 안전 경고 + 컨트롤 버튼 */}
        <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
          {/* 안전 경고 메시지 */}
          <div className="bg-black/80 text-white px-4 py-3 rounded-xl mb-3 flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-black text-sm font-bold">⚠</span>
            </div>
            <div className="text-sm">
              <div className="font-medium">주행 중 핸드폰 조작은 위험합니다.</div>
              <div className="opacity-80">잠시 후 사용하세요.</div>
            </div>
          </div>
          
          {/* 컨트롤 버튼들 */}
          <div className="flex justify-center gap-4">
            {/* 내위치 버튼 */}
            <button className="bg-white text-black px-4 py-2 rounded-full font-medium shadow-lg">
              내위치
            </button>
            
            {/* 일시정지 버튼 */}
            <button className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg">
              <Pause className="w-6 h-6 fill-current" />
            </button>
            
            {/* 종료 버튼 */}
            <button 
              onClick={onStopNavigation}
              className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center shadow-lg"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
