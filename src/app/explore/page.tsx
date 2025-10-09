'use client'

import { useState } from 'react'
import { ArrowLeft, Search, Filter, MapPin, Clock, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ExplorePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  // 샘플 코스 데이터
  const courses = [
    {
      id: '1',
      name: '한강공원 여의도 코스',
      area: '여의도',
      distance: 5.2,
      duration: 35,
      difficulty: 'easy',
      rating: 4.8,
      type: 'hangang'
    },
    {
      id: '2',
      name: '남산 순환로',
      area: '중구',
      distance: 3.8,
      duration: 45,
      difficulty: 'medium',
      rating: 4.6,
      type: 'mountain'
    },
    {
      id: '3',
      name: '올림픽공원 둘레길',
      area: '송파구',
      distance: 4.5,
      duration: 30,
      difficulty: 'easy',
      rating: 4.7,
      type: 'park'
    },
    {
      id: '4',
      name: '청계천 도심 코스',
      area: '중구',
      distance: 6.1,
      duration: 40,
      difficulty: 'easy',
      rating: 4.3,
      type: 'urban'
    }
  ]

  const filters = [
    { id: 'all', name: '전체', icon: '🏃‍♂️' },
    { id: 'hangang', name: '한강', icon: '🌊' },
    { id: 'mountain', name: '산', icon: '⛰️' },
    { id: 'park', name: '공원', icon: '🌳' },
    { id: 'urban', name: '도심', icon: '🏙️' }
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

  // 필터링된 코스
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.area.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === 'all' || course.type === selectedFilter
    return matchesSearch && matchesFilter
  })

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
          <h1 className="text-lg font-semibold">코스 탐색</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 검색창 */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="코스명이나 지역을 검색하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900/80 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#00FF88] transition-colors"
          />
        </div>

        {/* 필터 버튼들 */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                selectedFilter === filter.id
                  ? 'bg-[#00FF88] text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{filter.icon}</span>
              <span className="font-medium">{filter.name}</span>
            </button>
          ))}
        </div>

        {/* 검색 결과 */}
        <div>
          <p className="text-gray-400 text-sm mb-4">
            {filteredCourses.length}개의 코스를 찾았습니다
          </p>

          {filteredCourses.length > 0 ? (
            <div className="space-y-4">
              {filteredCourses.map((course, index) => (
                <div 
                  key={course.id}
                  className="bg-gray-900/80 glass rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{course.name}</h3>
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
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex gap-2">
                    <button className="flex-1 bg-gray-800/80 hover:bg-gray-700 text-white py-2 px-4 rounded-xl transition-colors font-medium">
                      상세보기
                    </button>
                    <button className="bg-gray-800/80 hover:bg-[#00FF88] hover:text-black text-white p-2 rounded-xl transition-all duration-300">
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 검색 결과 없음 */
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-400 mb-6">다른 검색어를 시도해보세요</p>
              <button 
                onClick={() => {
                  setSearchQuery('')
                  setSelectedFilter('all')
                }}
                className="bg-[#00FF88] hover:bg-[#00E077] text-black font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                전체 코스 보기
              </button>
            </div>
          )}
        </div>

        {/* 하단 여백 */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}
