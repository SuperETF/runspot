'use client'

import { CheckCircle, Navigation, Play } from 'lucide-react'

interface StartPointGuideProps {
  isAtStartPoint: boolean
  distanceToStart: number | null
  onStartRunning: () => void
  onNavigateToStart?: () => void
}

export default function StartPointGuide({ 
  isAtStartPoint, 
  distanceToStart, 
  onStartRunning,
  onNavigateToStart
}: StartPointGuideProps) {
  return (
    <div className="mb-6">
      <div className={`bg-card rounded-2xl p-6 border transition-all duration-300 shadow-lg ${
        isAtStartPoint ? 'border-primary bg-primary/10' : 'border-yellow-500 bg-yellow-500/10'
      }`}>
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isAtStartPoint ? 'bg-primary animate-pulse neon-glow' : 'bg-yellow-500'
          }`}>
            {isAtStartPoint ? (
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            ) : (
              <Navigation className="w-8 h-8 text-white" />
            )}
          </div>
          
          {isAtStartPoint ? (
            <div>
              <h3 className="text-lg font-bold text-primary mb-2">시작점 도착 완료!</h3>
              <p className="text-muted-foreground text-sm mb-4">런닝을 시작할 수 있습니다</p>
              <button
                onClick={onStartRunning}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto neon-glow"
              >
                <Play className="w-5 h-5 fill-current" />
                런닝 시작
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-bold text-yellow-600 mb-2">시작점으로 이동하세요</h3>
              <p className="text-muted-foreground text-sm mb-2">
                시작점까지 {distanceToStart ? `${(distanceToStart * 1000).toFixed(0)}m` : '계산 중...'}
              </p>
              <p className={`text-xs mb-4 ${
                distanceToStart && distanceToStart <= 0.05 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }`}>
                {distanceToStart && distanceToStart <= 0.05 
                  ? '✅ 시작점 도착! 런닝을 시작할 수 있습니다' 
                  : '시작점에서 50m 이내에 있어야 런닝을 시작할 수 있습니다'
                }
              </p>
              
              <div className="space-y-3">
                {onNavigateToStart && (
                  <button
                    onClick={onNavigateToStart}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto shadow-lg"
                  >
                    <Navigation className="w-5 h-5" />
                    시작점까지 가기
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
