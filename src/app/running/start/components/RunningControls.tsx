'use client'

import { Pause, Play, Square } from 'lucide-react'

interface RunningControlsProps {
  isRunning: boolean
  isPaused: boolean
  isCompleted: boolean
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export default function RunningControls({
  isRunning,
  isPaused,
  isCompleted,
  onPause,
  onResume,
  onStop
}: RunningControlsProps) {
  if (isCompleted) {
    return (
      <div className="mb-6">
        <div className="bg-primary/10 rounded-2xl p-6 border border-primary text-center">
          <h3 className="text-xl font-bold text-primary mb-2">🎉 런닝 완료!</h3>
          <p className="text-muted-foreground text-sm">수고하셨습니다!</p>
        </div>
      </div>
    )
  }

  // 런닝 중일 때만 컨트롤 표시
  if (!isRunning) {
    return null
  }

  return (
    <div className="mb-6">
      <div className="flex gap-4 justify-center">
        <button
          onClick={isPaused ? onResume : onPause}
          className={`font-bold px-6 py-4 rounded-xl transition-colors flex items-center gap-2 ${
            isPaused
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground neon-glow'
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
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold px-6 py-4 rounded-xl transition-colors flex items-center gap-2"
        >
          <Square className="w-5 h-5 fill-current" />
          종료
        </button>
      </div>
    </div>
  )
}
