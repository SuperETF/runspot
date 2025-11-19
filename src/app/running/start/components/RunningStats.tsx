'use client'

import { Clock, Heart, Zap, MapPin } from 'lucide-react'

interface RunningStatsProps {
  duration: number
  distance: number
  pace: number
  // 보행자 네비게이션 MVP 추가
  courseProgress?: {
    progressPercent: number
    passedDistance: number
    totalDistance: number
    isOffCourse: boolean
  }
}

export default function RunningStats({ duration, distance, pace, courseProgress }: RunningStatsProps) {
  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 페이스 포맷팅 (분:초/km)
  const formatPace = (paceInSeconds: number) => {
    if (paceInSeconds === 0 || !isFinite(paceInSeconds)) return '--:--'
    const mins = Math.floor(paceInSeconds / 60)
    const secs = Math.floor(paceInSeconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="mb-6">
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
        <div className="grid grid-cols-3 gap-4">
          {/* 시간 */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-[#00FF88] mr-2" />
              <span className="text-gray-400 text-sm">시간</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatTime(duration)}
            </div>
          </div>

          {/* 거리 */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-[#00FF88] mr-2" />
              <span className="text-gray-400 text-sm">거리</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {distance.toFixed(2)}
              <span className="text-sm text-gray-400 ml-1">km</span>
            </div>
          </div>

          {/* 페이스 */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Heart className="w-5 h-5 text-[#00FF88] mr-2" />
              <span className="text-gray-400 text-sm">페이스</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatPace(pace)}
              <span className="text-sm text-gray-400 ml-1">/km</span>
            </div>
          </div>
        </div>

        {/* 보행자 네비게이션 MVP: 코스 진행률 표시 */}
        {courseProgress && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#00FF88]" />
                <span className="text-gray-400 text-sm">코스 진행률</span>
              </div>
              <div className="text-sm text-white font-medium">
                {courseProgress.progressPercent.toFixed(1)}%
              </div>
            </div>
            
            {/* 진행률 바 */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  courseProgress.isOffCourse ? 'bg-red-500' : 'bg-[#00FF88]'
                }`}
                style={{ width: `${Math.min(courseProgress.progressPercent, 100)}%` }}
              />
            </div>
            
            {/* 거리 정보 */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div>
                통과: {(courseProgress.passedDistance / 1000).toFixed(2)}km
              </div>
              <div>
                총거리: {(courseProgress.totalDistance / 1000).toFixed(2)}km
              </div>
            </div>
            
            {/* 코스 이탈 경고 */}
            {courseProgress.isOffCourse && (
              <div className="mt-2 text-xs text-red-400 text-center">
                ⚠️ 코스에서 벗어났습니다
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
