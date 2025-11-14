'use client'

import { useState, useEffect } from 'react'
import { Clock, Gift, X } from 'lucide-react'

interface RunningLog {
  id: string
  course_id: string | null
  completed_at: string
  expires_at: string
  authentication_count: number
  distance: number
}

interface AuthenticationBannerProps {
  userId: string
}

export default function AuthenticationBanner({ userId }: AuthenticationBannerProps) {
  const [activeLog, setActiveLog] = useState<RunningLog | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  // 최근 완주 기록 중 인증 가능한 것 조회
  const loadActiveRunningLog = async () => {
    if (!userId) return

    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { data, error } = await supabase
        .from('running_logs')
        .select(`
          id,
          course_id,
          completed_at,
          expires_at,
          authentication_count,
          distance
        `)
        .eq('user_id', userId)
        .not('expires_at', 'is', null)
        .gt('expires_at', new Date().toISOString()) // 아직 만료되지 않은 것
        .lt('authentication_count', 2) // 아직 2곳에서 인증하지 않은 것
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        setActiveLog(null)
        setIsVisible(false)
        return
      }

      setActiveLog(data)
      setIsVisible(true)
    } catch (error) {
      console.error('인증 가능한 완주 기록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 남은 시간 계산
  const calculateTimeRemaining = () => {
    if (!activeLog?.expires_at) return ''

    const now = new Date()
    const expiresAt = new Date(activeLog.expires_at)
    const diff = expiresAt.getTime() - now.getTime()

    if (diff <= 0) {
      setIsVisible(false)
      return '만료됨'
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    } else {
      return `${minutes}분`
    }
  }

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadActiveRunningLog()
  }, [userId])

  // 1분마다 남은 시간 업데이트
  useEffect(() => {
    if (!activeLog) return

    const updateTimer = () => {
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)
    }

    updateTimer() // 즉시 실행
    const interval = setInterval(updateTimer, 60000) // 1분마다

    return () => clearInterval(interval)
  }, [activeLog])

  // 배너 닫기
  const closeBanner = () => {
    setIsVisible(false)
  }

  if (loading || !isVisible || !activeLog) return null

  const remainingAuth = 2 - (activeLog.authentication_count || 0)

  return (
    <div className="fixed top-20 left-4 right-4 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-[#00FF88] to-[#00E077] rounded-2xl p-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 text-white">
              <h3 className="font-bold text-sm mb-1">🎉 인증 혜택 사용 가능!</h3>
              <p className="text-xs opacity-90 mb-2">
                <strong>런닝 코스</strong> 완주 인증으로
              </p>
              
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{timeRemaining} 남음</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  <span>{remainingAuth}곳 인증 가능</span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={closeBanner}
            className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
        
        <div className="mt-3 pt-3 border-t border-white/20">
          <p className="text-xs text-white/80 text-center">
            제휴 스팟에서 <strong>"런닝 인증하기"</strong>를 눌러 할인 혜택을 받아보세요!
          </p>
        </div>
      </div>
    </div>
  )
}

// CSS 애니메이션 (globals.css에 추가 필요)
/*
@keyframes slide-down {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}
*/
