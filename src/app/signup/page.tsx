'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Mail, Lock, Shield, Check, Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SignupData {
  email: string
  password: string
  confirmPassword: string
  agreements: {
    terms: boolean
    privacy: boolean
    marketing: boolean
  }
  verificationCode: string
}

export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showMarketingModal, setShowMarketingModal] = useState(false)
  
  const [signupData, setSignupData] = useState<SignupData>({
    email: '',
    password: '',
    confirmPassword: '',
    agreements: {
      terms: false,
      privacy: false,
      marketing: false
    },
    verificationCode: ''
  })

  const steps = [
    { title: '이메일을 입력하세요', icon: Mail },
    { title: '비밀번호를 입력하세요', icon: Lock },
    { title: '비밀번호를 다시 입력하세요', icon: Lock },
    { title: '약관에 동의해주세요', icon: Shield }
  ]

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return '비밀번호는 최소 6자 이상이어야 합니다.'
    }
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      return '비밀번호에 영문자가 포함되어야 합니다.'
    }
    return null
  }

  const handleNext = async () => {
    setError(null)

    // 각 단계별 검증
    switch (currentStep) {
      case 0: // 이메일
        if (!signupData.email) {
          setError('이메일을 입력해주세요.')
          return
        }
        if (!validateEmail(signupData.email)) {
          setError('올바른 이메일 형식을 입력해주세요.')
          return
        }
        // 이메일 중복 확인
        setLoading(true)
        const emailExists = await checkEmailExists(signupData.email)
        setLoading(false)
        if (emailExists) {
          setError('이미 등록된 이메일입니다.')
          return
        }
        break

      case 1: // 비밀번호
        const passwordError = validatePassword(signupData.password)
        if (passwordError) {
          setError(passwordError)
          return
        }
        break

      case 2: // 비밀번호 확인
        if (signupData.password !== signupData.confirmPassword) {
          setError('비밀번호가 일치하지 않습니다.')
          return
        }
        break

      case 3: // 약관 동의
        if (!signupData.agreements.terms || !signupData.agreements.privacy) {
          setError('필수 약관에 동의해주세요.')
          return
        }
        // 회원가입 완료
        await completeSignup()
        return
    }

    setCurrentStep(currentStep + 1)
  }

  const sendVerificationCode = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            name: signupData.email.split('@')[0],
            email: signupData.email
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError('이미 등록된 이메일입니다.')
        } else {
          setError(error.message)
        }
        return
      }

      setVerificationSent(true)
    } catch (error) {
      console.error('인증번호 발송 실패:', error)
      setError('인증번호 발송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // users 테이블에서 이메일 중복 확인
      const { data, error } = await (supabase as any)
        .from('users')
        .select('email')
        .eq('email', email)
        .limit(1)

      if (error) {
        console.error('이메일 중복 확인 오류:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('이메일 중복 확인 실패:', error)
      return false
    }
  }

  const completeSignup = async () => {
    setLoading(true)
    try {
      // 먼저 이메일 중복 확인
      const emailExists = await checkEmailExists(signupData.email)
      if (emailExists) {
        setError('이미 등록된 이메일입니다.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            name: signupData.email.split('@')[0],
            email: signupData.email
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          setError('이미 등록된 이메일입니다.')
        } else if (error.message.includes('Invalid email')) {
          setError('유효하지 않은 이메일 형식입니다.')
        } else if (error.message.includes('Password should be at least')) {
          setError('비밀번호는 최소 6자 이상이어야 합니다.')
        } else {
          setError(error.message)
        }
        return
      }

      if (data.user) {
        // 회원가입 성공 - 로그인 페이지로 이동
        localStorage.setItem('signup_email', signupData.email)
        localStorage.setItem('show_signup_message', 'true')
        router.push('/login')
      }
    } catch (error) {
      console.error('회원가입 실패:', error)
      setError('회원가입 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError(null)
    } else {
      router.back()
    }
  }

  const updateSignupData = (field: string, value: any) => {
    setSignupData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const updateAgreement = (field: keyof SignupData['agreements'], value: boolean) => {
    setSignupData(prev => ({
      ...prev,
      agreements: {
        ...prev.agreements,
        [field]: value
      }
    }))
    setError(null)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Mail className="w-16 h-16 text-[#00FF88] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">이메일을 입력하세요</h2>
              <p className="text-gray-400">회원가입에 사용할 이메일 주소를 입력해주세요</p>
            </div>
            <input
              type="email"
              value={signupData.email}
              onChange={(e) => updateSignupData('email', e.target.value)}
              className="w-full px-4 py-4 bg-gray-900 border-2 border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#00FF88] transition-colors text-lg"
              placeholder="이메일 주소"
              autoFocus
            />
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Lock className="w-16 h-16 text-[#00FF88] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">비밀번호를 입력하세요</h2>
              <p className="text-gray-400">6자 이상, 영문자를 포함해주세요</p>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={signupData.password}
                onChange={(e) => updateSignupData('password', e.target.value)}
                className="w-full px-4 py-4 bg-gray-900 border-2 border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#00FF88] transition-colors text-lg pr-12"
                placeholder="비밀번호"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Lock className="w-16 h-16 text-[#00FF88] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">비밀번호를 다시 입력하세요</h2>
              <p className="text-gray-400">입력한 비밀번호와 동일한지 확인해주세요</p>
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={signupData.confirmPassword}
                onChange={(e) => updateSignupData('confirmPassword', e.target.value)}
                className="w-full px-4 py-4 bg-gray-900 border-2 border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#00FF88] transition-colors text-lg pr-12"
                placeholder="비밀번호 확인"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Shield className="w-16 h-16 text-[#00FF88] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">약관에 동의해주세요</h2>
              <p className="text-gray-400">서비스 이용을 위해 약관 동의가 필요합니다</p>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 bg-gray-900 rounded-2xl cursor-pointer hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={signupData.agreements.terms}
                  onChange={(e) => updateAgreement('terms', e.target.checked)}
                  className="w-5 h-5 text-[#00FF88] bg-gray-700 border-gray-600 rounded focus:ring-[#00FF88] focus:ring-2"
                />
                <span className="text-white font-medium flex-1">[필수] 이용약관 동의</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowTermsModal(true)
                  }}
                  className="text-gray-400 hover:text-[#00FF88] text-sm underline"
                >
                  보기
                </button>
              </label>
              <label className="flex items-center gap-3 p-4 bg-gray-900 rounded-2xl cursor-pointer hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={signupData.agreements.privacy}
                  onChange={(e) => updateAgreement('privacy', e.target.checked)}
                  className="w-5 h-5 text-[#00FF88] bg-gray-700 border-gray-600 rounded focus:ring-[#00FF88] focus:ring-2"
                />
                <span className="text-white font-medium flex-1">[필수] 개인정보 처리방침 동의</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowPrivacyModal(true)
                  }}
                  className="text-gray-400 hover:text-[#00FF88] text-sm underline"
                >
                  보기
                </button>
              </label>
              <label className="flex items-center gap-3 p-4 bg-gray-900 rounded-2xl cursor-pointer hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={signupData.agreements.marketing}
                  onChange={(e) => updateAgreement('marketing', e.target.checked)}
                  className="w-5 h-5 text-[#00FF88] bg-gray-700 border-gray-600 rounded focus:ring-[#00FF88] focus:ring-2"
                />
                <span className="text-white font-medium flex-1">[선택] 마케팅 정보 수신 동의</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowMarketingModal(true)
                  }}
                  className="text-gray-400 hover:text-[#00FF88] text-sm underline"
                >
                  보기
                </button>
              </label>
            </div>
          </div>
        )


      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#00FF88]">RunSpot</h1>
          <p className="text-sm text-gray-400">
            {currentStep + 1} / {steps.length}
          </p>
        </div>
        <div className="w-10"></div>
      </div>

      {/* 진행률 바 */}
      <div className="mb-8">
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className="bg-[#00FF88] h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-sm mx-auto">
        {renderStep()}

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-6 text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            {error}
          </div>
        )}

        {/* 다음 버튼 */}
        <button
          onClick={handleNext}
          disabled={loading}
          className="w-full mt-8 bg-[#00FF88] text-black font-bold py-4 rounded-2xl hover:bg-[#00E077] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              처리 중...
            </>
          ) : (
            <>
              {currentStep === steps.length - 1 ? '회원가입 완료' : '다음'}
              {currentStep < steps.length - 1 && <ArrowRight className="w-5 h-5" />}
            </>
          )}
        </button>
      </div>

      {/* 이용약관 모달 */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-gray-900 rounded-3xl w-full max-w-md border border-gray-800 shadow-2xl relative max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">이용약관</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="text-gray-300 text-sm space-y-4 leading-relaxed">
                <h4 className="text-white font-semibold">제1조 (목적)</h4>
                <p>본 약관은 RunSpot(이하 "회사")이 제공하는 러닝 및 건강 관리 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                
                <h4 className="text-white font-semibold">제2조 (정의)</h4>
                <p>1. "서비스"란 회사가 제공하는 러닝 코스 안내, 위치 기반 서비스, 건강 관리, 제휴 스토어 정보 제공 등의 모든 서비스를 의미합니다.</p>
                <p>2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</p>
                <p>3. "위치정보"란 이용자의 현재 위치를 파악할 수 있는 정보를 의미합니다.</p>
                
                <h4 className="text-white font-semibold">제3조 (서비스의 제공)</h4>
                <p>1. 회사는 다음과 같은 서비스를 제공합니다:</p>
                <p>- 러닝 코스 정보 및 안내 서비스</p>
                <p>- 위치 기반 주변 정보 제공 서비스</p>
                <p>- 건강 관리 및 운동 기록 서비스</p>
                <p>- 제휴 스토어 및 할인 정보 제공 서비스</p>
                <p>- 웨어러블 기기 연동 서비스 (향후 제공 예정)</p>
                
                <h4 className="text-white font-semibold">제4조 (이용자의 의무)</h4>
                <p>1. 이용자는 서비스 이용 시 관련 법령과 본 약관을 준수해야 합니다.</p>
                <p>2. 이용자는 정확한 정보를 제공해야 하며, 변경사항이 있을 경우 즉시 수정해야 합니다.</p>
                <p>3. 이용자는 서비스를 이용하여 얻은 정보를 상업적 목적으로 이용할 수 없습니다.</p>
                
                <h4 className="text-white font-semibold">제5조 (서비스의 중단)</h4>
                <p>회사는 시스템 점검, 보수, 교체, 통신두절, 천재지변 등의 경우 서비스 제공을 일시적으로 중단할 수 있습니다.</p>
                
                <h4 className="text-white font-semibold">제6조 (면책조항)</h4>
                <p>1. 회사는 천재지변, 전쟁, 기타 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</p>
                <p>2. 회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</p>
                <p>3. 회사는 이용자가 서비스를 이용하여 기대하는 수익을 얻지 못한 것에 대해 책임을 지지 않습니다.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보 처리방침 모달 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-gray-900 rounded-3xl w-full max-w-md border border-gray-800 shadow-2xl relative max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">개인정보 처리방침</h3>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="text-gray-300 text-sm space-y-4 leading-relaxed">
                <h4 className="text-white font-semibold">1. 개인정보의 처리목적</h4>
                <p>RunSpot은 다음의 목적을 위하여 개인정보를 처리합니다:</p>
                <p>- 회원가입 및 관리</p>
                <p>- 서비스 제공 및 계약의 이행</p>
                <p>- 위치 기반 서비스 제공</p>
                <p>- 건강 관리 서비스 제공</p>
                <p>- 제휴 스토어 서비스 제공</p>
                <p>- 웨어러블 기기 연동 서비스 (향후)</p>
                
                <h4 className="text-white font-semibold">2. 처리하는 개인정보의 항목</h4>
                <p><strong>필수항목:</strong></p>
                <p>- 이메일 주소, 비밀번호</p>
                <p>- 위치정보 (GPS 좌표)</p>
                <p>- 서비스 이용 기록</p>
                <p><strong>선택항목:</strong></p>
                <p>- 건강 정보 (운동 기록, 심박수 등)</p>
                <p>- 웨어러블 기기 정보</p>
                
                <h4 className="text-white font-semibold">3. 개인정보의 처리 및 보유기간</h4>
                <p>- 회원정보: 회원탈퇴 시까지</p>
                <p>- 위치정보: 서비스 제공 완료 후 즉시 삭제</p>
                <p>- 건강정보: 이용자 요청 시까지</p>
                <p>- 서비스 이용기록: 3년</p>
                
                <h4 className="text-white font-semibold">4. 개인정보의 제3자 제공</h4>
                <p>회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:</p>
                <p>- 이용자가 사전에 동의한 경우</p>
                <p>- 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</p>
                
                <h4 className="text-white font-semibold">5. 개인정보의 안전성 확보조치</h4>
                <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
                <p>- 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</p>
                <p>- 기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</p>
                <p>- 물리적 조치: 전산실, 자료보관실 등의 접근통제</p>
                
                <h4 className="text-white font-semibold">6. 개인정보보호책임자</h4>
                <p>이메일: privacy@runspot.com</p>
                <p>개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제를 처리하고 있습니다.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 마케팅 정보 수신 동의 모달 */}
      {showMarketingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-gray-900 rounded-3xl w-full max-w-md border border-gray-800 shadow-2xl relative max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">마케팅 정보 수신 동의</h3>
              <button
                onClick={() => setShowMarketingModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="text-gray-300 text-sm space-y-4 leading-relaxed">
                <h4 className="text-white font-semibold">1. 마케팅 정보 수신 동의 목적</h4>
                <p>RunSpot은 이용자에게 다음과 같은 마케팅 정보를 제공하기 위해 동의를 요청합니다:</p>
                <p>- 새로운 러닝 코스 및 이벤트 정보</p>
                <p>- 제휴 스토어 할인 및 쿠폰 정보</p>
                <p>- 건강 관리 관련 팁 및 정보</p>
                <p>- 서비스 업데이트 및 신기능 안내</p>
                <p>- 웨어러블 기기 연동 관련 정보</p>
                
                <h4 className="text-white font-semibold">2. 수신 방법</h4>
                <p>마케팅 정보는 다음의 방법으로 제공됩니다:</p>
                <p>- 이메일</p>
                <p>- 앱 푸시 알림</p>
                <p>- 앱 내 메시지</p>
                
                <h4 className="text-white font-semibold">3. 수신 동의 철회</h4>
                <p>이용자는 언제든지 마케팅 정보 수신 동의를 철회할 수 있습니다:</p>
                <p>- 앱 내 설정 메뉴에서 수신 거부 설정</p>
                <p>- 이메일 내 수신거부 링크 클릭</p>
                <p>- 고객센터 문의를 통한 수신거부 요청</p>
                
                <h4 className="text-white font-semibold">4. 동의하지 않을 권리</h4>
                <p>이용자는 마케팅 정보 수신에 동의하지 않을 권리가 있으며, 동의하지 않더라도 RunSpot의 기본 서비스 이용에는 제한이 없습니다.</p>
                
                <h4 className="text-white font-semibold">5. 개인정보 이용</h4>
                <p>마케팅 정보 발송을 위해 다음의 개인정보를 이용합니다:</p>
                <p>- 이메일 주소</p>
                <p>- 서비스 이용 패턴</p>
                <p>- 관심 분야 (러닝, 건강 관리 등)</p>
                
                <h4 className="text-white font-semibold">6. 보유기간</h4>
                <p>마케팅 정보 수신 동의 정보는 동의 철회 시 또는 회원 탈퇴 시까지 보유됩니다.</p>
                
                <p className="text-yellow-400 bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
                  <strong>※ 선택사항 안내</strong><br />
                  마케팅 정보 수신 동의는 선택사항이며, 동의하지 않아도 RunSpot의 모든 기본 서비스를 정상적으로 이용하실 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
