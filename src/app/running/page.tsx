'use client'

import { useState } from 'react'
import { ArrowLeft, Play, MapPin, Clock, Star, History, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RunningPage() {
  const router = useRouter()
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  // 최근 뛰었던 코스 데이터
  const recentCourses = [
    {
      id: '1',
      name: '한강공원 여의도 코스',
      area: '여의도',
      distance: 5.2,
      duration: 35,
      difficulty: 'easy',
      rating: 4.8,
      lastRun: '2024-01-15',
      runCount: 5
    },
    {
      id: '2',
      name: '올림픽공원 둘레길',
      area: '송파구',
      distance: 4.5,
      duration: 30,
      difficulty: 'easy',
      rating: 4.7,
      lastRun: '2024-01-10',
      runCount: 3
    },
    {
      id: '3',
      name: '남산 순환로',
      area: '중구',
      distance: 3.8,
      duration: 45,
      difficulty: 'medium',
      rating: 4.6,
      lastRun: '2024-01-05',
      runCount: 2
    }
  ]

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '초급'
      case 'medium': return '중급'
      case 'hard': return '고급'
      default: return '초급'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400'
      case 'hard': return 'bg-red-500/20 text-red-400'
      default: return 'bg-green-500/20 text-green-400'
    }
  }

  const formatLastRun = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '어제'
    if (diffDays <= 7) return `${diffDays}일 전`
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}주 전`
    return `${Math.ceil(diffDays / 30)}개월 전`
  }

  const startRunning = (courseId: string) => {
    const course = recentCourses.find(c => c.id === courseId)
    router.push(`/running/start?courseId=${courseId}&courseName=${encodeURIComponent(course?.name || '')}`)
  }

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
          <h1 className="text-lg font-semibold">런닝 시작</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 빠른 시작 섹션 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#00FF88] rounded-full flex items-center justify-center mx-auto mb-4 neon-glow animate-pulse">
            <Play className="w-10 h-10 text-black fill-current" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">런닝을 시작하세요!</h2>
          <p className="text-gray-400">최근 뛰었던 코스를 선택하거나 새로운 코스를 탐색해보세요</p>
        </div>

        {/* 최근 코스 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-[#00FF88]" />
            <h3 className="text-lg font-semibold">최근 뛰었던 코스</h3>
          </div>

          {recentCourses.length > 0 ? (
            <div className="space-y-4">
              {recentCourses.map((course, index) => (
                <div 
                  key={course.id}
                  className={`bg-gray-900/80 glass rounded-2xl p-4 border transition-all duration-300 cursor-pointer animate-fade-in-up ${
                    selectedCourse === course.id 
                      ? 'border-[#00FF88] bg-[#00FF88]/10' 
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-semibold text-white">{course.name}</h4>
                        {selectedCourse === course.id && (
                          <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{course.area}</p>
                      
                      {/* 코스 정보 */}
                      <div className="flex items-center gap-4 text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-[#00FF88]" />
                          <span className="text-[#00FF88] font-medium">{course.distance}km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{course.duration}분</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-gray-300">{course.rating}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(course.difficulty)}`}>
                          {getDifficultyText(course.difficulty)}
                        </span>
                      </div>

                      {/* 런닝 기록 */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>마지막 런닝: {formatLastRun(course.lastRun)}</span>
                        <span>총 {course.runCount}회 완주</span>
                      </div>
                    </div>
                  </div>

                  {/* 선택된 코스의 시작 버튼 */}
                  {selectedCourse === course.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          startRunning(course.id)
                        }}
                        className="w-full bg-[#00FF88] hover:bg-[#00E077] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        런닝 시작하기
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* 최근 코스 없음 */
            <div className="text-center py-8 bg-gray-900/80 glass rounded-2xl border border-gray-800">
              <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">아직 뛰었던 코스가 없습니다</p>
              <p className="text-sm text-gray-500">새로운 코스를 탐색해보세요!</p>
            </div>
          )}
        </div>

        {/* 새로운 코스 탐색 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">새로운 코스 찾기</h3>
            <p className="text-gray-400 mb-6">서울의 다양한 런닝 코스를 탐색해보세요</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => router.push('/explore')}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-xl transition-colors font-medium"
              >
                코스 탐색
              </button>
              <button 
                onClick={() => router.push('/')}
                className="flex-1 bg-[#00FF88] hover:bg-[#00E077] text-black py-3 px-4 rounded-xl transition-colors font-medium"
              >
                인기 코스
              </button>
            </div>
          </div>
        </div>

        {/* 런닝 팁 */}
        <div className="bg-gradient-to-r from-[#00FF88]/10 to-[#00E077]/10 rounded-2xl p-6 border border-[#00FF88]/20">
          <h3 className="text-lg font-semibold text-white mb-3">💡 런닝 팁</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• 런닝 전 5-10분 워밍업을 해주세요</p>
            <p>• 충분한 수분 섭취를 잊지 마세요</p>
            <p>• 자신의 페이스에 맞춰 천천히 시작하세요</p>
            <p>• 런닝 후 스트레칭으로 마무리하세요</p>
          </div>
        </div>

        {/* 하단 여백 */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}
