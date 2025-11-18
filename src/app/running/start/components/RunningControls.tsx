'use client'

import { Pause, Play, Square } from 'lucide-react'

interface RunningControlsProps {
  isRunning: boolean
  isPaused: boolean
  isCompleted: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export default function RunningControls({
  isRunning,
  isPaused,
  isCompleted,
  onStart,
  onPause,
  onResume,
  onStop
}: RunningControlsProps) {
  if (isCompleted) {
    return (
      <div className="mb-6">
        <div className="bg-[#00FF88]/10 rounded-2xl p-6 border border-[#00FF88] text-center">
          <h3 className="text-xl font-bold text-[#00FF88] mb-2">🎉 런닝 완료!</h3>
          <p className="text-gray-300 text-sm">수고하셨습니다!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex gap-4 justify-center">
        {!isRunning ? (
          // 런닝 시작 버튼
          <button
            onClick={onStart}
            className="bg-[#00FF88] hover:bg-[#00E077] text-black font-bold px-8 py-4 rounded-xl transition-colors flex items-center gap-3"
          >
            <Play className="w-6 h-6 fill-current" />
            런닝 시작
          </button>
        ) : (
          // 런닝 중 컨트롤
          <>
            <button
              onClick={isPaused ? onResume : onPause}
              className={`font-bold px-6 py-4 rounded-xl transition-colors flex items-center gap-2 ${
                isPaused
                  ? 'bg-[#00FF88] hover:bg-[#00E077] text-black'
                  : 'bg-yellow-500 hover:bg-yellow-400 text-black'
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  재시작
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  일시정지
                </>
              )}
            </button>

            <button
              onClick={onStop}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-4 rounded-xl transition-colors flex items-center gap-2"
            >
              <Square className="w-5 h-5 fill-current" />
              종료
            </button>
          </>
        )}
      </div>
    </div>
  )
}
