'use client'

import { ArrowLeft, Volume2, VolumeX } from 'lucide-react'

interface RunningHeaderProps {
  courseName: string
  courseArea: string
  voiceEnabled: boolean
  onBack: () => void
  onToggleVoice: () => void
  onShare?: () => void
}

export default function RunningHeader({
  courseName,
  courseArea,
  voiceEnabled,
  onBack,
  onToggleVoice,
  onShare
}: RunningHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        
        <div className="text-center flex-1">
          <h1 className="text-lg font-semibold text-foreground">{courseName}</h1>
          <p className="text-xs text-muted-foreground">{courseArea}</p>
        </div>
        
        <div className="flex gap-2">
          {/* 음성 안내 토글 */}
          <button
            onClick={onToggleVoice}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              voiceEnabled 
                ? 'bg-primary text-primary-foreground neon-glow' 
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
            title={voiceEnabled ? '음성 안내 끄기' : '음성 안내 켜기'}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* 공유 버튼 (필요시) */}
          {onShare && (
            <button
              onClick={onShare}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              title="코스 공유"
            >
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
