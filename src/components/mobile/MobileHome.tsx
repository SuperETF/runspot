'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Play, MapPin, User, Home as HomeIcon, Store, Bookmark } from 'lucide-react'
import { Capacitor } from '@capacitor/core'

export default function MobileHome() {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // 모바일 앱 환경에서 간단한 초기화
    const initializeMobileApp = async () => {
      try {
        console.log('📱 모바일 앱 초기화 시작')
        
        // 간단한 지연 후 준비 완료
        setTimeout(() => {
          setIsReady(true)
          console.log('✅ 모바일 앱 초기화 완료')
        }, 1000)
        
      } catch (error) {
        console.error('❌ 모바일 앱 초기화 오류:', error)
        setIsReady(true) // 오류가 있어도 앱은 실행
      }
    }

    if (Capacitor.isNativePlatform()) {
      initializeMobileApp()
    } else {
      setIsReady(true)
    }
  }, [])

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-primary mb-2">RunSpot</h2>
          <p className="text-muted-foreground">앱을 시작하는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 상단 헤더 */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-border px-4 py-6 pt-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-1">RunSpot</h1>
          <p className="text-muted-foreground">서울의 베스트 런닝 코스</p>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="px-4 py-8">
        {/* 환영 메시지 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">런닝을 시작해보세요!</h2>
          <p className="text-muted-foreground">서울의 다양한 런닝 코스를 탐험하고 건강한 라이프스타일을 만들어보세요.</p>
        </div>

        {/* 주요 기능 버튼들 */}
        <div className="space-y-4 mb-8">
          <button
            onClick={() => router.push('/running')}
            className="w-full bg-primary text-primary-foreground p-4 rounded-2xl font-semibold text-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6" />
            런닝 시작하기
          </button>

          <button
            onClick={() => router.push('/running')}
            className="w-full bg-card text-foreground p-4 rounded-2xl font-semibold border border-border hover:bg-muted transition-colors flex items-center justify-center gap-3"
          >
            <MapPin className="w-6 h-6 text-primary" />
            코스 탐색하기
          </button>

          <button
            onClick={() => router.push('/spots')}
            className="w-full bg-card text-foreground p-4 rounded-2xl font-semibold border border-border hover:bg-muted transition-colors flex items-center justify-center gap-3"
          >
            <Store className="w-6 h-6 text-primary" />
            제휴 스팟 보기
          </button>
        </div>

        {/* 간단한 통계 카드 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-card/50 p-4 rounded-xl text-center border border-border">
            <div className="text-2xl font-bold text-primary mb-1">50+</div>
            <div className="text-sm text-muted-foreground">런닝 코스</div>
          </div>
          <div className="bg-card/50 p-4 rounded-xl text-center border border-border">
            <div className="text-2xl font-bold text-primary mb-1">100+</div>
            <div className="text-sm text-muted-foreground">제휴 스팟</div>
          </div>
        </div>

        {/* 앱 정보 */}
        <div className="text-center text-sm text-gray-500">
          <p>GPS 기반 런닝 네비게이션</p>
          <p>실시간 진행률 추적 • 코스 이탈 감지</p>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group">
            <HomeIcon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xs text-primary font-medium">홈</span>
          </button>
          <button 
            onClick={() => router.push('/running')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group"
          >
            <Play className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">런닝</span>
          </button>
          <button 
            onClick={() => router.push('/spots')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group"
          >
            <Store className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">스팟</span>
          </button>
          <button 
            onClick={() => router.push('/saved')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group"
          >
            <Bookmark className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">저장</span>
          </button>
          <button 
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group"
          >
            <User className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">프로필</span>
          </button>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-20"></div>
    </div>
  )
}
