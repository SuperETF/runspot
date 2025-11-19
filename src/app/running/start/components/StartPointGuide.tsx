'use client'

import { CheckCircle, Navigation, Play, Download, ExternalLink } from 'lucide-react'

interface StartPointGuideProps {
  isAtStartPoint: boolean
  distanceToStart: number | null
  onStartRunning: () => void
  onNavigateToStart?: () => void
  onDownloadGPX?: () => void
  onOpenGoogleMaps?: () => void
}

export default function StartPointGuide({ 
  isAtStartPoint, 
  distanceToStart, 
  onStartRunning,
  onNavigateToStart,
  onDownloadGPX,
  onOpenGoogleMaps
}: StartPointGuideProps) {
  return (
    <div className="mb-6">
      <div className={`bg-gray-900/80 rounded-2xl p-6 border transition-all duration-300 ${
        isAtStartPoint ? 'border-[#00FF88] bg-[#00FF88]/10' : 'border-orange-500 bg-orange-500/10'
      }`}>
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isAtStartPoint ? 'bg-[#00FF88] animate-pulse' : 'bg-orange-500'
          }`}>
            {isAtStartPoint ? (
              <CheckCircle className="w-8 h-8 text-black" />
            ) : (
              <Navigation className="w-8 h-8 text-white" />
            )}
          </div>
          
          {isAtStartPoint ? (
            <div>
              <h3 className="text-lg font-bold text-[#00FF88] mb-2">시작점 도착 완료!</h3>
              <p className="text-gray-300 text-sm mb-4">런닝을 시작할 수 있습니다</p>
              <button
                onClick={onStartRunning}
                className="bg-[#00FF88] hover:bg-[#00E077] text-black font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5 fill-current" />
                런닝 시작
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-bold text-orange-400 mb-2">시작점으로 이동하세요</h3>
              <p className="text-gray-300 text-sm mb-2">
                시작점까지 {distanceToStart ? `${(distanceToStart * 1000).toFixed(0)}m` : '계산 중...'}
              </p>
              <p className={`text-xs mb-4 ${
                distanceToStart && distanceToStart <= 0.05 
                  ? 'text-[#00FF88]' 
                  : 'text-gray-400'
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
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Navigation className="w-5 h-5" />
                    시작점까지 가기
                  </button>
                )}
                
                {/* 추가 네비게이션 옵션들 */}
                <div className="flex gap-2 justify-center">
                  {onDownloadGPX && (
                    <button
                      onClick={onDownloadGPX}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      GPX 다운로드
                    </button>
                  )}
                  
                  {onOpenGoogleMaps && (
                    <button
                      onClick={onOpenGoogleMaps}
                      className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      구글맵
                    </button>
                  )}
                </div>
                
                <p className="text-xs text-gray-400 mt-2">
                  💡 카카오맵에서 경유지가 안 보이면 GPX 파일을 다운로드해서 직접 불러오세요
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
