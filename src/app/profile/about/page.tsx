'use client'

import { useState } from 'react'
import { ArrowLeft, Info, Heart, Mail, Star, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { submitInquiry } from '@/lib/inquiries'
import Image from 'next/image'

export default function AboutPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await submitInquiry({
        name: '사용자',
        email: 'user@runspot.com',
        subject: '앱 문의',
        message: message
      })
      alert('문의가 성공적으로 전송되었습니다!')
      setIsModalOpen(false)
      setMessage('')
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      alert('문의 전송에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">앱 정보</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 앱 정보 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 neon-glow overflow-hidden">
            <Image 
              src="/runspot.jpg" 
              alt="RunSpot Logo" 
              width={80} 
              height={80}
              className="w-full h-full object-cover rounded-3xl"
            />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">RunSpot Seoul</h2>
          <p className="text-muted-foreground mb-1">버전 1.0.0</p>
          <p className="text-sm text-muted-foreground/70">서울의 베스트 런닝 코스 플랫폼</p>
        </div>

        {/* 앱 소개 */}
        <div className="bg-card/80 glass rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold">앱 소개</h3>
          </div>
          
          <p className="text-foreground/80 leading-relaxed">
            RunSpot Seoul은 서울의 숨겨진 런닝 코스를 발견하고 공유할 수 있는 커뮤니티 플랫폼입니다. 
            GPS 실시간 추적, 코스 리뷰, 커뮤니티 기능을 통해 러너들에게 최적의 런닝 경험을 제공합니다.
          </p>
        </div>

        {/* 주요 기능 */}
        <div className="bg-card/80 glass rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">주요 기능</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-foreground/80">인터랙티브 지도와 코스 탐색</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-foreground/80">GPS 실시간 추적</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-foreground/80">코스 리뷰 및 평점 시스템</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-foreground/80">개인 런닝 통계 및 기록</span>
            </div>
          </div>
        </div>

        {/* 기술 스택 */}
        <div className="bg-card/80 glass rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">기술 스택</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-primary mb-2">Frontend</h4>
              <div className="space-y-1 text-sm text-foreground/80">
                <p>• Next.js 14</p>
                <p>• TypeScript</p>
                <p>• Tailwind CSS</p>
                <p>• Shadcn/ui</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-primary mb-2">Backend</h4>
              <div className="space-y-1 text-sm text-foreground/80">
                <p>• Supabase</p>
                <p>• PostgreSQL</p>
                <p>• Kakao Maps API</p>
                <p>• Vercel</p>
              </div>
            </div>
          </div>
        </div>

        {/* 개발자 정보 */}
        <div className="bg-card/80 glass rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold">개발자</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">R</span>
              </div>
              <div>
                <p className="text-foreground font-medium">RunSpot Team</p>
                <p className="text-sm text-muted-foreground">Seoul, South Korea</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">문의하기</span>
              </button>
            </div>
          </div>
        </div>

        {/* 라이선스 및 법적 정보 */}
        <div className="bg-card/80 glass rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">라이선스</h3>
          
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/profile/about/licenses')}
              className="w-full text-left p-3 hover:bg-muted/50 rounded-xl transition-colors"
            >
              <p className="text-foreground font-medium">오픈소스 라이선스</p>
              <p className="text-sm text-muted-foreground">사용된 오픈소스 라이브러리 정보</p>
            </button>
            
            <button 
              onClick={() => router.push('/profile/about/privacy')}
              className="w-full text-left p-3 hover:bg-muted/50 rounded-xl transition-colors"
            >
              <p className="text-foreground font-medium">개인정보 처리방침</p>
              <p className="text-sm text-muted-foreground">개인정보 수집 및 이용에 대한 정책</p>
            </button>
            
            <button 
              onClick={() => router.push('/profile/about/terms')}
              className="w-full text-left p-3 hover:bg-muted/50 rounded-xl transition-colors"
            >
              <p className="text-foreground font-medium">서비스 이용약관</p>
              <p className="text-sm text-muted-foreground">앱 사용에 관한 약관 및 조건</p>
            </button>
          </div>
        </div>

        {/* 앱 평가 */}
        <div className="bg-card/80 glass rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold">앱 평가</h3>
          </div>
          
          <p className="text-foreground/80 mb-4">
            RunSpot Seoul이 도움이 되셨나요? 앱스토어에서 평가를 남겨주세요!
          </p>
          
          <button className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors">
            ⭐ 앱 평가하기
          </button>
        </div>

        {/* 저작권 */}
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            © 2025 RunSpot Seoul. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Made with FRC in Seoul
          </p>
        </div>

        {/* 하단 여백 */}
        <div className="h-20"></div>
      </div>

      {/* 문의하기 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">문의하기</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  문의 내용 *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="문의 내용을 자세히 입력해주세요"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-muted text-foreground py-3 rounded-xl hover:bg-muted/80 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '전송 중...' : '문의 전송'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
