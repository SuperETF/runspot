'use client'

import { Clock, Heart, Zap } from 'lucide-react'

interface RunningStatsProps {
  duration: number
  distance: number
  pace: number
}

export default function RunningStats({ duration, distance, pace }: RunningStatsProps) {
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
      </div>
    </div>
  )
}
