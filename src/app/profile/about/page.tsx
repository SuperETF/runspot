'use client'

import { ArrowLeft, Info, Heart, Github, Mail, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
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
          <div className="w-20 h-20 bg-[#00FF88] rounded-3xl flex items-center justify-center mx-auto mb-4 neon-glow">
            <span className="text-3xl">🏃‍♂️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">RunSpot Seoul</h2>
          <p className="text-gray-400 mb-1">버전 1.0.0</p>
          <p className="text-sm text-gray-500">서울의 베스트 런닝 코스 플랫폼</p>
        </div>

        {/* 앱 소개 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-6 h-6 text-[#00FF88]" />
            <h3 className="text-lg font-semibold">앱 소개</h3>
          </div>
          
          <p className="text-gray-300 leading-relaxed">
            RunSpot Seoul은 서울의 숨겨진 런닝 코스를 발견하고 공유할 수 있는 커뮤니티 플랫폼입니다. 
            GPS 실시간 추적, 코스 리뷰, 커뮤니티 기능을 통해 러너들에게 최적의 런닝 경험을 제공합니다.
          </p>
        </div>

        {/* 주요 기능 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">주요 기능</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#00FF88] rounded-full"></div>
              <span className="text-gray-300">🗺️ 인터랙티브 지도와 코스 탐색</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#00FF88] rounded-full"></div>
              <span className="text-gray-300">📍 GPS 실시간 추적</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#00FF88] rounded-full"></div>
              <span className="text-gray-300">⭐ 코스 리뷰 및 평점 시스템</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#00FF88] rounded-full"></div>
              <span className="text-gray-300">📊 개인 런닝 통계 및 기록</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#00FF88] rounded-full"></div>
              <span className="text-gray-300">🌙 다크 테마 디자인</span>
            </div>
          </div>
        </div>

        {/* 기술 스택 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">기술 스택</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-[#00FF88] mb-2">Frontend</h4>
              <div className="space-y-1 text-sm text-gray-300">
                <p>• Next.js 14</p>
                <p>• TypeScript</p>
                <p>• Tailwind CSS</p>
                <p>• Shadcn/ui</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#00FF88] mb-2">Backend</h4>
              <div className="space-y-1 text-sm text-gray-300">
                <p>• Supabase</p>
                <p>• PostgreSQL</p>
                <p>• Kakao Maps API</p>
                <p>• Vercel</p>
              </div>
            </div>
          </div>
        </div>

        {/* 개발자 정보 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-[#00FF88]" />
            <h3 className="text-lg font-semibold">개발자</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#00FF88] rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-black">R</span>
              </div>
              <div>
                <p className="text-white font-medium">RunSpot Team</p>
                <p className="text-sm text-gray-400">Seoul, South Korea</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
                <Github className="w-4 h-4" />
                <span className="text-sm">GitHub</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
                <Mail className="w-4 h-4" />
                <span className="text-sm">문의하기</span>
              </button>
            </div>
          </div>
        </div>

        {/* 라이선스 및 법적 정보 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">라이선스</h3>
          
          <div className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-800/50 rounded-xl transition-colors">
              <p className="text-white font-medium">오픈소스 라이선스</p>
              <p className="text-sm text-gray-400">사용된 오픈소스 라이브러리 정보</p>
            </button>
            
            <button className="w-full text-left p-3 hover:bg-gray-800/50 rounded-xl transition-colors">
              <p className="text-white font-medium">개인정보 처리방침</p>
              <p className="text-sm text-gray-400">개인정보 수집 및 이용에 대한 정책</p>
            </button>
            
            <button className="w-full text-left p-3 hover:bg-gray-800/50 rounded-xl transition-colors">
              <p className="text-white font-medium">서비스 이용약관</p>
              <p className="text-sm text-gray-400">앱 사용에 관한 약관 및 조건</p>
            </button>
          </div>
        </div>

        {/* 앱 평가 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-6 h-6 text-[#00FF88]" />
            <h3 className="text-lg font-semibold">앱 평가</h3>
          </div>
          
          <p className="text-gray-300 mb-4">
            RunSpot Seoul이 도움이 되셨나요? 앱스토어에서 평가를 남겨주세요!
          </p>
          
          <button className="w-full bg-[#00FF88] text-black font-semibold py-3 rounded-xl hover:bg-[#00E077] transition-colors">
            ⭐ 앱 평가하기
          </button>
        </div>

        {/* 저작권 */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            © 2024 RunSpot Seoul. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Made with ❤️ in Seoul
          </p>
        </div>

        {/* 하단 여백 */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}
