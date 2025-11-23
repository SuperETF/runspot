'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Play, MapPin, History, Plus, Search, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import BookmarkButton from '@/components/BookmarkButton'
import CourseMarkerIcon from '@/components/common/CourseMarkerIcon'
import { getUserRecentCourses } from '@/lib/runningLogs'
import { getCurrentUserId } from '@/lib/auth'
import { getFilteredCourses, getAvailableAreas } from '@/lib/courses'

export default function RunningPage() {
  const router = useRouter()
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'recent' | 'explore'>('explore')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [recentCourses, setRecentCourses] = useState<any[]>([])
  const [exploreCourses, setExploreCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exploreLoading, setExploreLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedArea, setSelectedArea] = useState('all')
  const [availableAreas, setAvailableAreas] = useState<string[]>([])

  // 난이도 필터 옵션
  const difficultyFilters = [
    { id: 'all', name: '전체', icon: '🏃‍♂️' },
    { id: 'easy', name: '초급 (3km이내)', icon: '🟢' },
    { id: 'medium', name: '중급 (3km-10km)', icon: '🟡' },
    { id: 'hard', name: '고급 (10km이상)', icon: '🔴' }
  ]

  // 필터링된 코스는 이제 DB에서 직접 가져옴
  const filteredCourses = exploreCourses

  // 데이터 로드
  useEffect(() => {
    loadData()
  }, [])

  // 탐색 코스 로드 (검색어나 필터 변경 시)
  useEffect(() => {
    if (activeTab === 'explore') {
      loadExploreCourses()
    }
  }, [activeTab, searchQuery, selectedFilter, selectedArea])

  // 지역 목록 로드
  useEffect(() => {
    loadAvailableAreas()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // 사용자 ID 가져오기
      const currentUserId = await getCurrentUserId()
      setUserId(currentUserId)
      
      // 최근 코스 데이터 가져오기
      const courses = await getUserRecentCourses(currentUserId, 5)
      setRecentCourses(courses)
      
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableAreas = async () => {
    try {
      const areas = await getAvailableAreas()
      setAvailableAreas(areas as string[])
    } catch (error) {
      console.error('지역 목록 로드 실패:', error)
    }
  }

  const loadExploreCourses = async () => {
    try {
      setExploreLoading(true)
      
      // 필터 조건 설정
      const filters: any = {
        limit: 20
      }
      
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim()
      }
      
      // 난이도 필터 적용
      if (selectedFilter !== 'all') {
        filters.difficulty = selectedFilter
      }

      // 지역 필터 추가
      if (selectedArea !== 'all') {
        filters.area = selectedArea
      }
      
      // DB에서 필터링된 코스 가져오기
      const courses = await getFilteredCourses(filters)
      setExploreCourses(courses)
      
    } catch (error) {
      console.error('탐색 코스 로드 실패:', error)
    } finally {
      setExploreLoading(false)
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
    const course = [...recentCourses, ...exploreCourses].find(c => c.id === courseId)
    if (!course) {
      alert('코스 정보를 찾을 수 없습니다.')
      return
    }

    // 코스 데이터를 세션 스토리지에 저장
    const courseData = {
      id: course.id,
      name: course.name,
      description: course.description,
      gps_route: course.gps_route,
      distance: course.distance,
      duration: course.duration,
      difficulty: course.difficulty,
      area: course.area
    }
    sessionStorage.setItem('selected_course', JSON.stringify(courseData))
    
    router.push(`/running/start?courseId=${courseId}&courseName=${encodeURIComponent(course?.name || '')}`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 상단 헤더 + 탭 네비게이션 - 모바일 알림창 피하기 및 고정 */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold">런닝 코스</h1>
            <p className="text-sm text-muted-foreground">서울의 베스트 런닝 코스를 탐색하세요</p>
          </div>
          <div className="w-10"></div>
        </div>

        {/* 탭 네비게이션 - 헤더에 포함하여 고정 */}
        <div className="px-4 pb-4">
          <div className="flex bg-card/80 rounded-2xl p-1 border border-border">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-200 ${
                activeTab === 'explore'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>코스 탐색</span>
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-200 ${
                activeTab === 'recent'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <History className="w-4 h-4" />
              <span>최근 코스</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 빠른 시작 섹션 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 neon-glow animate-pulse">
            <Play className="w-10 h-10 text-primary-foreground fill-current" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">런닝을 시작하세요!</h2>
          <p className="text-muted-foreground">
            {activeTab === 'recent' 
              ? '최근 뛰었던 코스를 선택하거나 새로운 코스를 탐색해보세요'
              : '원하는 코스를 검색하고 필터링해보세요'
            }
          </p>
        </div>

        {/* 탐색 탭 - 검색창과 필터 */}
        {activeTab === 'explore' && (
          <>
            {/* 검색창 */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="코스명이나 지역을 검색하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card/80 border border-border rounded-2xl pl-12 pr-4 py-4 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* 난이도 필터 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-foreground/80 mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                난이도별 코스
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {difficultyFilters.map((filter: any) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                      selectedFilter === filter.id
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <span>{filter.icon}</span>
                    <span>{filter.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 지역 카테고리 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-foreground/80 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                지역별 코스
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedArea('all')}
                  className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                    selectedArea === 'all'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  전체 지역
                </button>
                {availableAreas.map(area => (
                  <button
                    key={area}
                    onClick={() => setSelectedArea(area)}
                    className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                      selectedArea === area
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* 검색 결과 */}
            <div className="mb-4">
              <p className="text-muted-foreground text-sm mb-4">
                {filteredCourses.length}개의 코스를 찾았습니다
              </p>
            </div>
          </>
        )}

        {/* 코스 목록 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            {activeTab === 'explore' ? (
              <>
                <Search className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">코스 목록</h3>
              </>
            ) : (
              <>
                <History className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">최근 뛰었던 코스</h3>
              </>
            )}
          </div>

          {activeTab === 'recent' ? (
            loading ? (
              <div className="space-y-4">
                {/* 최근 코스 로딩 스켈레톤 */}
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="bg-card/80 glass rounded-2xl p-4 border border-border animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-muted rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
                        <div className="flex gap-4 mb-3">
                          <div className="h-3 bg-muted rounded w-16"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                          <div className="h-3 bg-muted rounded w-12"></div>
                        </div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentCourses.length > 0 ? (
              <div className="space-y-4">
                {recentCourses.map((course: any, index: number) => (
                  <div 
                    key={course.id}
                    className={`bg-card/80 glass rounded-2xl p-4 border transition-all duration-300 cursor-pointer animate-fade-in-up ${
                      selectedCourse === course.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-border/70'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <CourseMarkerIcon 
                          courseType="running" 
                          size={48}
                          className="hover:scale-110 transition-transform duration-200"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-foreground">{course.name}</h4>
                          <div className="flex items-center gap-2">
                            {/* 완주 여부 배지 */}
                            {course.lastRunCompleted ? (
                              <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full border border-primary/30">
                                ✅ 완주
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full border border-orange-500/30">
                                ⏸️ 미완주
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex items-center gap-3 text-sm mb-2">
                            <span className="text-muted-foreground">{course.area}</span>
                            <span className="text-primary font-medium">{course.distance}km</span>
                            <span className="text-muted-foreground">총 {course.runCount}회</span>
                          </div>
                          
                          {/* 완주율 표시 */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground/70">완주율:</span>
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${course.completionRate}%` }}
                              />
                            </div>
                            <span className="text-primary font-medium">{course.completionRate}%</span>
                          </div>
                        </div>
                        
                        {/* 최근 런닝 정보 */}
                        <div className="text-xs text-muted-foreground">
                          최근 런닝: {new Date(course.lastRun).toLocaleDateString('ko-KR')} • 
                          {course.lastRunDistance ? ` ${course.lastRunDistance.toFixed(2)}km` : ''} • 
                          {course.lastRunDuration ? ` ${Math.round(course.lastRunDuration / 60)}분` : ''}
                        </div>
                      </div>
                    </div>

                    {/* 선택된 코스의 시작 버튼 */}
                    {selectedCourse === course.id && (
                      <div className="mt-4 pt-4 border-t border-border/60">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            startRunning(course.id)
                          }}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02]"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          다시 런닝하기
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* 최근 코스 없음 */
              <div className="text-center py-8 bg-card/80 glass rounded-2xl border border-border">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">아직 뛰었던 코스가 없습니다</p>
                <p className="text-sm text-muted-foreground/70">새로운 코스를 탐색해보세요!</p>
              </div>
            )
          ) : activeTab === 'explore' ? (
            exploreLoading ? (
              <div className="space-y-4">
                {/* 로딩 스켈레톤 */}
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="bg-card/80 glass rounded-2xl p-4 border border-border animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-muted rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
                        <div className="flex gap-4 mb-3">
                          <div className="h-3 bg-muted rounded w-16"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                          <div className="h-3 bg-muted rounded w-12"></div>
                        </div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="space-y-4">
                {filteredCourses.map((course: any, index: number) => (
                <div 
                  key={course.id}
                  className={`bg-card/80 glass rounded-2xl p-4 border transition-all duration-300 cursor-pointer animate-fade-in-up ${
                    selectedCourse === course.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-border/60'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <CourseMarkerIcon 
                        courseType={course.course_type} 
                        size={48}
                        className="hover:scale-110 transition-transform duration-200"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground">{course.name}</h4>
                        <BookmarkButton courseId={course.id} />
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-sm text-muted-foreground/70">{course.description || '서울의 아름다운 런닝 코스'}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{course.area}</span>
                        <span className="text-primary font-medium">{course.distance}km</span>
                      </div>
                    </div>
                  </div>

                  {/* 선택된 코스의 시작 버튼 */}
                  {selectedCourse === course.id && (
                    <div className="mt-4 pt-4 border-t border-border/60">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          startRunning(course.id)
                        }}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02]"
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
                <div className="text-center py-8 bg-card/80 glass rounded-2xl border border-border">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">아직 뛰었던 코스가 없습니다</p>
                  <p className="text-sm text-muted-foreground/70">새로운 코스를 탐색해보세요!</p>
                </div>
              )
            ) : (
              /* 탐색 탭 */
              exploreLoading ? (
                <div className="space-y-4">
                  {/* 탐색 로딩 스켈레톤 */}
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="bg-card/80 glass rounded-2xl p-4 border border-border animate-pulse">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-muted rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
                          <div className="flex gap-4">
                            <div className="h-3 bg-muted rounded w-16"></div>
                            <div className="h-3 bg-muted rounded w-16"></div>
                            <div className="h-3 bg-muted rounded w-12"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="space-y-4">
                  {filteredCourses.map((course: any, index: number) => (
                    <div 
                      key={course.id}
                      className={`bg-card/80 glass rounded-2xl p-4 border transition-all duration-300 cursor-pointer animate-fade-in-up ${
                        selectedCourse === course.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-border/70'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <CourseMarkerIcon 
                            courseType={course.course_type} 
                            size={48}
                            className="hover:scale-110 transition-transform duration-200"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-foreground">{course.name}</h4>
                          </div>
                          
                          <div className="mb-2">
                            <p className="text-sm text-muted-foreground/70">{course.description || '서울의 아름다운 런닝 코스'}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">{course.area}</span>
                            <span className="text-primary font-medium">{course.distance}km</span>
                          </div>
                        </div>
                      </div>

                      {/* 선택된 코스의 시작 버튼 */}
                      {selectedCourse === course.id && (
                        <div className="mt-4 pt-4 border-t border-border/60">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              startRunning(course.id)
                            }}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02]"
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
                /* 검색 결과 없음 */
                <div className="text-center py-8 bg-card/80 glass rounded-2xl border border-border">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">검색 결과가 없습니다</p>
                  <p className="text-sm text-muted-foreground/70">다른 검색어나 필터를 시도해보세요</p>
                </div>
              )
            )}
        </div>

        {/* 하단 여백 */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}
