'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSignupMessage, setShowSignupMessage] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')

  // 회원가입 완료 메시지 확인
  useEffect(() => {
    const checkSignupMessage = () => {
      if (typeof window !== 'undefined') {
        const showMessage = localStorage.getItem('show_signup_message')
        const email = localStorage.getItem('signup_email')
        
        if (showMessage === 'true' && email) {
          setShowSignupMessage(true)
          setSignupEmail(email)
          
          // 메시지 표시 후 로컬 스토리지에서 제거
          localStorage.removeItem('show_signup_message')
          localStorage.removeItem('signup_email')
        }
      }
    }
    
    checkSignupMessage()
  }, [])

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return '비밀번호는 최소 6자 이상이어야 합니다.'
    }
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      return '비밀번호에 영문자가 포함되어야 합니다.'
    }
    return null
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 로그인
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // 로그인 에러 메시지를 한국어로 변환
        let errorMessage = error.message
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
        } else if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          errorMessage = '이메일 인증이 완료되지 않았습니다.\n이메일을 확인하고 인증 링크를 클릭해주세요.'
        } else if (error.message.includes('Invalid email')) {
          errorMessage = '유효하지 않은 이메일 형식입니다.'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.'
        } else if (error.message.includes('signup_disabled')) {
          errorMessage = '현재 회원가입이 비활성화되어 있습니다.'
        }
        setError(errorMessage)
        return
      }

      if (data.user) {
        // 이메일 인증 상태 확인
        if (!data.user.email_confirmed_at) {
          setError('이메일 인증이 완료되지 않았습니다.\n이메일을 확인하고 인증 링크를 클릭해주세요.')
          // 인증되지 않은 세션 제거
          await supabase.auth.signOut()
          return
        }
        router.push('/')
      }
    } catch (error) {
      console.error('인증 오류:', error)
      setError('인증 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = () => {
    // 게스트로 계속하기 - 로컬 스토리지에 게스트 플래그 설정
    localStorage.setItem('runspot_guest_mode', 'true')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 flex flex-col justify-center">
      <div className="w-full max-w-sm mx-auto">
        {/* 로고 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[#00FF88] mb-3">RunSpot</h1>
          <p className="text-gray-400 text-lg">서울의 러닝 코스를 발견하세요</p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleAuth} className="space-y-6">
        {/* 이메일 */}
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-4 bg-gray-900 border-2 border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#00FF88] transition-colors text-lg"
            placeholder="이메일"
            required
          />
        </div>

        {/* 비밀번호 */}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-4 bg-gray-900 border-2 border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#00FF88] transition-colors text-lg pr-12"
            placeholder="비밀번호"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            {error}
          </div>
        )}

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00FF88] text-black font-bold py-4 rounded-2xl hover:bg-[#00E077] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              로그인 중...
            </>
          ) : (
            '로그인'
          )}
        </button>

          {/* 게스트 로그인 */}
          <div className="text-center py-3">
            <button
              type="button"
              onClick={handleGuestLogin}
              className="text-gray-400 hover:text-white transition-colors text-lg font-medium inline-block"
            >
              게스트로 계속하기
            </button>
          </div>
        </form>

        {/* 회원가입 링크 */}
        <div className="text-center mt-8 max-w-sm mx-auto">
          <p className="text-gray-400">
            계정이 없으신가요?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="text-[#00FF88] hover:text-[#00E077] font-medium transition-colors"
            >
              회원가입
            </button>
          </p>
        </div>

        {/* 하단 정보 */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>계정을 생성하면 서비스 약관 및 개인정보 처리방침에 동의하게 됩니다.</p>
        </div>
      </div>

      {/* 회원가입 완료 안내 모달 */}
      {showSignupMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-gray-900 rounded-3xl w-full max-w-sm border border-gray-800 shadow-2xl animate-fade-in-up relative">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowSignupMessage(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            
            <div className="p-6 text-center">
              {/* 아이콘 */}
              <div className="mb-4">
                <Mail className="w-16 h-16 text-[#00FF88] mx-auto" />
              </div>

              {/* 제목 */}
              <h3 className="text-xl font-bold text-white mb-2">
                회원가입이 완료되었습니다!
              </h3>

              {/* 메시지 */}
              <p className="text-gray-400 mb-6 leading-relaxed">
                <span className="text-[#00FF88] font-medium">{signupEmail}</span>로<br />
                인증 이메일이 전송됩니다.<br />
                인증 후 로그인이 가능합니다.
              </p>

              {/* 확인 버튼 */}
              <button
                onClick={() => setShowSignupMessage(false)}
                className="w-full bg-[#00FF88] text-black font-semibold py-3 rounded-2xl hover:bg-[#00E077] transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
