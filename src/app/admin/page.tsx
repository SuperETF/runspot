'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Map, Route, Settings, Users, BarChart3, Trash2, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('courses')

  // 관리자 권한 확인 (임시)
  useEffect(() => {
    // TODO: 실제 관리자 권한 확인 로직
    const isAdmin = true // 임시
    if (!isAdmin) {
      router.push('/')
    }
  }, [router])

  const tabs = [
    { id: 'courses', name: '코스 관리', icon: Route },
    { id: 'users', name: '사용자 관리', icon: Users },
    { id: 'analytics', name: '통계', icon: BarChart3 },
    { id: 'settings', name: '설정', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 헤더 */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-[#00FF88]">RunSpot Admin</h1>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              메인으로
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 모바일: 탭 네비게이션 */}
        <div className="block lg:hidden mb-6">
          <div className="grid grid-cols-2 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center p-4 rounded-xl transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#00FF88] text-black'
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">{tab.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 데스크톱: 사이드바 레이아웃 */}
        <div className="hidden lg:flex">
          {/* 사이드바 */}
          <div className="w-64 mr-8">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#00FF88] text-black'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            {activeTab === 'courses' && <CoursesTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>

        {/* 모바일: 메인 콘텐츠 */}
        <div className="block lg:hidden">
          {activeTab === 'courses' && <CoursesTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  )
}

// 코스 관리 탭
function CoursesTab() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 저장된 코스 목록 불러오기
  const loadCourses = async () => {
    setLoading(true)
    try {
      const { data, error } = await (supabase as any)
        .from('courses')
        .select(`
          *,
          course_points (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('코스 로딩 오류:', error)
        if (error.message?.includes('relation "courses" does not exist')) {
          console.log('⚠️ 데이터베이스 테이블이 생성되지 않았습니다.')
        }
      } else {
        console.log('✅ 코스 로딩 성공:', data)
        setCourses(data || [])
      }
    } catch (error) {
      console.error('코스 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트 시 코스 로딩
  useEffect(() => {
    loadCourses()
  }, [])

  // 코스 삭제 함수
  const deleteCourse = async (courseId: string, courseName: string) => {
    if (!confirm(`"${courseName}" 코스를 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 모든 포인트 데이터도 함께 삭제됩니다.`)) {
      return
    }

    try {
      console.log('🗑️ 코스 삭제 시작:', courseId)

      // course_points는 ON DELETE CASCADE로 자동 삭제됨
      const { error } = await (supabase as any)
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) {
        console.error('❌ 코스 삭제 오류:', error)
        alert(`코스 삭제 중 오류가 발생했습니다: ${error.message}`)
        return
      }

      console.log('✅ 코스 삭제 성공')
      alert('코스가 성공적으로 삭제되었습니다.')
      
      // 목록 새로고침
      loadCourses()

    } catch (error: any) {
      console.error('💥 코스 삭제 실패:', error)
      alert(`코스 삭제 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">코스 관리</h2>
        <button
          onClick={() => router.push('/admin/course/create')}
          className="flex items-center justify-center px-4 py-3 bg-[#00FF88] text-black rounded-xl hover:bg-[#00E077] transition-colors font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" />
          새 코스 등록
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* 코스 생성 방식 선택 카드들 */}
        <div
          onClick={() => router.push('/admin/course/create?mode=click')}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 hover:border-[#00FF88] transition-colors cursor-pointer active:scale-95"
        >
          <div className="flex items-center mb-3 sm:mb-4">
            <Map className="w-6 h-6 sm:w-8 sm:h-8 text-[#00FF88] mr-3" />
            <h3 className="text-base sm:text-lg font-semibold">지도 클릭 모드</h3>
          </div>
          <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
            지도에서 직접 포인트를 클릭하여 코스를 생성합니다.
          </p>
          <div className="text-xs sm:text-sm text-gray-500">
            • 빠른 코스 생성<br />
            • 계획적 경로 설정<br />
            • 수정 용이
          </div>
        </div>

        <div
          onClick={() => router.push('/admin/course/create?mode=gps')}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 hover:border-[#00FF88] transition-colors cursor-pointer active:scale-95"
        >
          <div className="flex items-center mb-3 sm:mb-4">
            <Route className="w-6 h-6 sm:w-8 sm:h-8 text-[#00FF88] mr-3" />
            <h3 className="text-base sm:text-lg font-semibold">GPS 추적 모드</h3>
          </div>
          <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
            실제로 뛰면서 GPS로 경로를 기록합니다.
          </p>
          <div className="text-xs sm:text-sm text-gray-500">
            • 정확한 경로<br />
            • 실제 난이도 측정<br />
            • 고도 정보 포함
          </div>
        </div>

        <div
          onClick={() => router.push('/admin/course/create?mode=hybrid')}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 hover:border-[#00FF88] transition-colors cursor-pointer active:scale-95 sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center mb-3 sm:mb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#00FF88] rounded-lg flex items-center justify-center mr-3">
              <span className="text-black font-bold text-xs sm:text-sm">H</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold">하이브리드 모드</h3>
          </div>
          <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
            지도 클릭과 GPS 추적을 결합한 방식입니다.
          </p>
          <div className="text-xs sm:text-sm text-gray-500">
            • 최고의 정확성<br />
            • 유연한 편집<br />
            • 검증된 경로
          </div>
        </div>
      </div>

      {/* 기존 코스 목록 */}
      <div className="mt-6 sm:mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold">등록된 코스</h3>
          <button
            onClick={loadCourses}
            disabled={loading}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? '로딩...' : '새로고침'}
          </button>
        </div>
        
        <div className="bg-gray-900 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FF88] mx-auto mb-2"></div>
              <div className="text-gray-400">코스 목록을 불러오는 중...</div>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-2">📍</div>
              <div>등록된 코스가 없습니다.</div>
              <div className="text-sm text-gray-600 mt-1">
                위의 "새 코스 등록" 버튼을 눌러 첫 번째 코스를 만들어보세요!
              </div>
            </div>
          ) : (
            <>
              {/* 데스크톱 테이블 헤더 */}
              <div className="hidden sm:block p-4 border-b border-gray-800">
                <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-400">
                  <div>코스명</div>
                  <div>난이도</div>
                  <div>거리</div>
                  <div>예상시간</div>
                  <div>포인트 수</div>
                  <div>등록일</div>
                  <div>관리</div>
                </div>
              </div>

              {/* 데스크톱 테이블 */}
              <div className="hidden sm:block">
                {courses.map((course) => (
                  <div key={course.id} className="p-4 border-b border-gray-800 last:border-b-0 hover:bg-gray-800/50 transition-colors">
                    <div className="grid grid-cols-7 gap-4 text-sm items-center">
                      <div className="font-medium text-white">{course.name}</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium w-fit ${
                        course.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
                        course.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {course.difficulty === 'easy' ? '쉬움' : 
                         course.difficulty === 'medium' ? '보통' : '어려움'}
                      </div>
                      <div className="text-gray-300">{course.distance}km</div>
                      <div className="text-gray-300">{course.estimated_time}분</div>
                      <div className="text-gray-300">{course.course_points?.length || 0}개</div>
                      <div className="text-gray-400 text-xs">
                        {new Date(course.created_at).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            // TODO: 코스 상세보기 기능
                            alert('코스 상세보기 기능은 추후 구현 예정입니다.')
                          }}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                          title="코스 보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCourse(course.id, course.name)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400 hover:text-red-300"
                          title="코스 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 모바일 카드 */}
              <div className="block sm:hidden">
                {courses.map((course) => (
                  <div key={course.id} className="p-4 border-b border-gray-800 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-white">{course.name}</h4>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          course.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
                          course.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {course.difficulty === 'easy' ? '쉬움' : 
                           course.difficulty === 'medium' ? '보통' : '어려움'}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">{course.description}</div>
                    <div className="flex justify-between text-sm text-gray-300 mb-3">
                      <span>{course.distance}km</span>
                      <span>{course.estimated_time}분</span>
                      <span>{course.course_points?.length || 0}개 포인트</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {new Date(course.created_at).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            // TODO: 코스 상세보기 기능
                            alert('코스 상세보기 기능은 추후 구현 예정입니다.')
                          }}
                          className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          보기
                        </button>
                        <button
                          onClick={() => deleteCourse(course.id, course.name)}
                          className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// 사용자 관리 탭
function UsersTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">사용자 관리</h2>
      <div className="bg-gray-900 rounded-2xl p-6">
        <p className="text-gray-400">사용자 관리 기능을 구현 예정입니다.</p>
      </div>
    </div>
  )
}

// 통계 탭
function AnalyticsTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">통계</h2>
      <div className="bg-gray-900 rounded-2xl p-6">
        <p className="text-gray-400">통계 기능을 구현 예정입니다.</p>
      </div>
    </div>
  )
}

// 설정 탭
function SettingsTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">설정</h2>
      <div className="bg-gray-900 rounded-2xl p-6">
        <p className="text-gray-400">설정 기능을 구현 예정입니다.</p>
      </div>
    </div>
  )
}
