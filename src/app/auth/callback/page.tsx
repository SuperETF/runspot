'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      // URL에서 인증 코드 확인
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('인증 콜백 오류:', error)
        setStatus('error')
        setMessage('이메일 인증 중 오류가 발생했습니다.')
        return
      }

      if (data.session) {
        // 인증 성공 - 사용자 프로필 생성 또는 업데이트
        const user = data.session.user
        
        try {
          // users 테이블에 프로필 정보 추가 (이미 존재하면 업데이트)
          const { error: profileError } = await (supabase as any)
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            })

          if (profileError && !profileError.message.includes('duplicate key')) {
            console.error('프로필 생성/업데이트 실패:', profileError)
          }
        } catch (profileError) {
          console.error('프로필 처리 중 오류:', profileError)
        }

        setStatus('success')
        setMessage('이메일 인증이 완료되었습니다!')
        
        // 2초 후 메인 페이지로 이동
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setStatus('error')
        setMessage('인증 세션을 찾을 수 없습니다.')
      }
    } catch (error) {
      console.error('인증 처리 중 오류:', error)
      setStatus('error')
      setMessage('인증 처리 중 오류가 발생했습니다.')
    }
  }

  const handleReturnToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* 로고 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#00FF88] mb-2">RunSpot</h1>
        </div>

        {/* 상태별 UI */}
        {status === 'loading' && (
          <div>
            <Loader2 className="w-16 h-16 animate-spin text-[#00FF88] mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">이메일 인증 중...</h2>
            <p className="text-gray-400">잠시만 기다려주세요.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-green-400">인증 완료!</h2>
            <p className="text-gray-400 mb-4">{message}</p>
            <p className="text-sm text-gray-500">곧 메인 페이지로 이동합니다...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-400">인증 실패</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <button
              onClick={handleReturnToLogin}
              className="bg-[#00FF88] text-black font-semibold px-6 py-3 rounded-2xl hover:bg-[#00E077] transition-colors"
            >
              로그인 페이지로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
