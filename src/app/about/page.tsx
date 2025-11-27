'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MapPin, 
  Navigation, 
  Users, 
  Store, 
  Award, 
  Zap, 
  Heart,
  TrendingUp,
  Gift,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  Globe,
  ChevronDown
} from 'lucide-react'
import Image from 'next/image'

export default function AboutPage() {
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-white">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Logo */}
          <div className="mb-8 inline-block">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden">
              <Image 
                src="/runspot.jpg" 
                alt="RunSpot Logo" 
                width={96} 
                height={96}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-tight">
            RunSpot
          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl font-light mb-4 text-gray-300 leading-relaxed px-4">
            서울의 모든 런닝 코스,<br className="sm:hidden" /> 하나의 플랫폼
          </p>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed px-4">
            달리고, 기록하고, 혜택받고.<br />
            러너와 가게가 함께 성장하는<br className="sm:hidden" /> 새로운 런닝 생태계
          </p>

          <div className="flex justify-center">
            <button 
              onClick={() => router.push('/')}
              className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            >
              지금 시작하기
            </button>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-white/50" />
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4 leading-tight px-4">
              왜 RunSpot인가?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 px-4">
              러너와 가게, 모두를 위한 솔루션
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
            {/* 러너의 문제 */}
            <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-black to-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-4 sm:mb-5 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">러너들의 고민</h3>
                <ul className="space-y-2 sm:space-y-2.5">
                  <li className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50/50 border border-red-100 group/item hover:bg-red-50 hover:border-red-200 transition-all duration-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">✗</span>
                    <span className="text-sm sm:text-base text-gray-800 font-medium">코스 찾기 어려움</span>
                  </li>
                  <li className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50/50 border border-red-100 group/item hover:bg-red-50 hover:border-red-200 transition-all duration-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">✗</span>
                    <span className="text-sm sm:text-base text-gray-800 font-medium">혜택 없음</span>
                  </li>
                  <li className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50/50 border border-red-100 group/item hover:bg-red-50 hover:border-red-200 transition-all duration-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">✗</span>
                    <span className="text-sm sm:text-base text-gray-800 font-medium">함께 달리기 어려움</span>
                  </li>
                  <li className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50/50 border border-red-100 group/item hover:bg-red-50 hover:border-red-200 transition-all duration-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">✗</span>
                    <span className="text-sm sm:text-base text-gray-800 font-medium">기록 관리 번거로움</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 가게의 문제 */}
            <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-black to-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Store className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-4 sm:mb-5 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">가게의 고민</h3>
                <ul className="space-y-2 sm:space-y-2.5">
                  <li className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50/50 border border-red-100 group/item hover:bg-red-50 hover:border-red-200 transition-all duration-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">✗</span>
                    <span className="text-sm sm:text-base text-gray-800 font-medium">고객 유치 어려움</span>
                  </li>
                  <li className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50/50 border border-red-100 group/item hover:bg-red-50 hover:border-red-200 transition-all duration-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">✗</span>
                    <span className="text-sm sm:text-base text-gray-800 font-medium">광고비 부담</span>
                  </li>
                  <li className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50/50 border border-red-100 group/item hover:bg-red-50 hover:border-red-200 transition-all duration-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">✗</span>
                    <span className="text-sm sm:text-base text-gray-800 font-medium">타겟 도달 어려움</span>
                  </li>
                  <li className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50/50 border border-red-100 group/item hover:bg-red-50 hover:border-red-200 transition-all duration-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">✗</span>
                    <span className="text-sm sm:text-base text-gray-800 font-medium">효과적 홍보 방법 부재</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section id="features" className="py-16 sm:py-20 md:py-24 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4 leading-tight">
              핵심 기능
            </h2>
            <p className="text-lg sm:text-xl text-gray-400">
              러너를 위한 완벽한 런닝 플랫폼
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {/* Feature 1 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-white/30 transition-all hover:transform hover:scale-105">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center">코스 탐색</h3>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-white/30 transition-all hover:transform hover:scale-105">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center">친구 시스템</h3>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-white/30 transition-all hover:transform hover:scale-105">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center">완주 인증</h3>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-white/30 transition-all hover:transform hover:scale-105">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center">코스 리뷰</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Section - 핵심 강조 */}
      <section className="py-16 sm:py-24 md:py-32 bg-gradient-to-br from-white via-gray-50 to-white relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" 
               style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full mb-4 sm:mb-6 font-bold text-sm sm:text-base">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>제휴 스팟 시스템</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight px-4">
              러너도 좋고, 가게도 좋은
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 font-medium px-4">
              Win-Win<br className="sm:hidden" /> 파트너십 생태계
            </p>
          </div>

          {/* Main Value Proposition */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 mb-12 sm:mb-16 md:mb-20">
            {/* 러너 혜택 */}
            <div className="bg-black text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black leading-tight">러너 혜택</h3>
                  <p className="text-sm sm:text-base text-gray-400">달리고 할인받자!</p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0 mt-0.5 sm:mt-1" />
                  <div>
                    <h4 className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 leading-tight">런닝 완주 시 즉시 쿠폰 발급</h4>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">코스를 완주하면 주변 제휴 가게에서 사용할 수 있는 할인 쿠폰을 받아요</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0 mt-0.5 sm:mt-1" />
                  <div>
                    <h4 className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 leading-tight">2시간 내 사용 가능</h4>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">런닝 직후 가장 필요한 시점에 할인 혜택을 누릴 수 있어요</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0 mt-0.5 sm:mt-1" />
                  <div>
                    <h4 className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 leading-tight">다양한 제휴 가게</h4>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">카페, 음식점, 헬스장 등 러너를 위한 맞춤형 제휴 스팟</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0 mt-0.5 sm:mt-1" />
                  <div>
                    <h4 className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 leading-tight">위치 기반 자동 추천</h4>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">완주 지점 주변의 제휴 스팟을 자동으로 추천받아요</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/20">
                <p className="text-lg sm:text-xl md:text-2xl font-black text-center">
                  🏃‍♂️ 달릴수록 더 많은 혜택!
                </p>
              </div>
            </div>

            {/* 가게 혜택 */}
            <div className="bg-white border-2 sm:border-4 border-black rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black leading-tight">가게 혜택</h3>
                  <p className="text-sm sm:text-base text-gray-600">효과적인 홍보!</p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-black flex-shrink-0 mt-0.5 sm:mt-1" />
                  <div>
                    <h4 className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 leading-tight">타겟 고객 직접 유치</h4>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">건강에 관심 많은 러너들을 우리 가게로 직접 유도할 수 있어요</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-black flex-shrink-0 mt-0.5 sm:mt-1" />
                  <div>
                    <h4 className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 leading-tight">추가 비용 없는 홍보</h4>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">할인 외 수수료나 광고비가 전혀 없어 부담 없이 홍보 효과를 누릴 수 있어요</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-black flex-shrink-0 mt-0.5 sm:mt-1" />
                  <div>
                    <h4 className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 leading-tight">신규 고객 증가</h4>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">매일 새로운 러너들이 우리 가게를 발견하고 방문해요</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-black flex-shrink-0 mt-0.5 sm:mt-1" />
                  <div>
                    <h4 className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 leading-tight">브랜드 이미지 상승</h4>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">건강한 라이프스타일을 지원하는 가게로 인식돼요</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-black/20">
                <p className="text-lg sm:text-xl md:text-2xl font-black text-center">
                  📈 고객도 늘고 매출도 UP!
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-black text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12">
            <h3 className="text-2xl sm:text-3xl font-black text-center mb-8 sm:mb-12 leading-tight px-4">
              제휴 스팟 시스템<br className="sm:hidden" /> 작동 방식
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 font-black text-lg sm:text-xl md:text-2xl">
                  1
                </div>
                <h4 className="font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">런닝 완주</h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">코스를 완주하고<br className="sm:hidden" /> GPS로 자동 인증</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 font-black text-lg sm:text-xl md:text-2xl">
                  2
                </div>
                <h4 className="font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">쿠폰 발급</h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">주변 제휴 스팟<br className="sm:hidden" /> 쿠폰 자동 발급</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 font-black text-lg sm:text-xl md:text-2xl">
                  3
                </div>
                <h4 className="font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">가게 방문</h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">2시간 내<br className="sm:hidden" /> 제휴 가게 방문</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 font-black text-lg sm:text-xl md:text-2xl">
                  4
                </div>
                <h4 className="font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">할인 적용</h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">쿠폰 사용하고<br className="sm:hidden" /> 할인 혜택 받기</p>
              </div>
            </div>
          </div>

          {/* CTA for Partnership */}
          <div className="mt-12 sm:mt-16 text-center px-4">
            <h3 className="text-2xl sm:text-3xl font-black mb-3 sm:mb-4 leading-tight">
              우리 가게도<br className="sm:hidden" /> 제휴하고 싶다면?
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8">
              RunSpot과 함께<br className="sm:hidden" /> 새로운 고객을 만나보세요
            </p>
            <button 
              onClick={() => router.push('/spot/register')}
              className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-all transform hover:scale-105 shadow-xl text-sm sm:text-base md:text-lg"
            >
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
              제휴 스팟 등록하기
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black mb-1 sm:mb-2">1000+</div>
              <div className="text-sm sm:text-base text-gray-400">등록된 코스</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black mb-1 sm:mb-2">5000+</div>
              <div className="text-sm sm:text-base text-gray-400">활성 러너</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black mb-1 sm:mb-2">200+</div>
              <div className="text-sm sm:text-base text-gray-400">제휴 스팟</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black mb-1 sm:mb-2">10K+</div>
              <div className="text-sm sm:text-base text-gray-400">완주 기록</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-24 md:py-32 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight">
            지금 바로<br className="sm:hidden" /> 시작하세요
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-12 leading-relaxed">
            서울의 모든 런닝 코스가<br className="sm:hidden" /> 당신을 기다립니다
          </p>

          <button 
            onClick={() => router.push('/')}
            className="px-8 sm:px-10 py-4 sm:py-5 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl text-base sm:text-lg"
          >
            코스 둘러보기
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-lg mb-4">RunSpot</h4>
              <p className="text-gray-400 text-sm">
                서울의 모든 런닝 코스를 하나의 플랫폼에서
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">제휴</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => router.push('/admin/spot')} className="hover:text-white">스팟 등록</button></li>
                <li><button className="hover:text-white">제휴 문의</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">정보</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => router.push('/profile/about')} className="hover:text-white">앱 정보</button></li>
                <li><button onClick={() => router.push('/profile/privacy')} className="hover:text-white">개인정보처리방침</button></li>
                <li><button className="hover:text-white">이용약관</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-400">
            <p>© 2025 RunSpot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
