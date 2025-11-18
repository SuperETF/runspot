'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Map, Route, Settings, Users, BarChart3, Trash2, Eye, Store, X, Edit } from 'lucide-react'
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
    { id: 'spots', name: '제휴 스팟', icon: Store },
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
            {activeTab === 'spots' && <SpotsTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>

        {/* 모바일: 메인 콘텐츠 */}
        <div className="block lg:hidden">
          {activeTab === 'courses' && <CoursesTab />}
          {activeTab === 'spots' && <SpotsTab />}
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
  const [showGPXUpload, setShowGPXUpload] = useState(false)
  const [gpxFile, setGpxFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // 저장된 코스 목록 불러오기
  const loadCourses = async () => {
    setLoading(true)
    try {
      const { data, error } = await (supabase as any)
        .from('courses')
        .select('*')
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

  // GPX 파일 업로드 처리 (API 라우트 사용)
  const handleGPXUpload = async () => {
    if (!gpxFile) {
      alert('GPX 파일을 선택해주세요.')
      return
    }

    setUploading(true)
    try {
      // FormData로 파일 전송
      const formData = new FormData()
      formData.append('gpxFile', gpxFile)
      
      // API 라우트 호출
      const response = await fetch('/api/admin/upload-gpx', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '업로드 실패')
      }
      
      alert(result.message)
      
      // 상태 초기화 및 목록 새로고침
      setShowGPXUpload(false)
      setGpxFile(null)
      loadCourses()
      
    } catch (error: any) {
      console.error('GPX 업로드 실패:', error)
      alert(`❌ GPX 업로드 실패: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

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
          className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 hover:border-[#00FF88] transition-colors cursor-pointer active:scale-95"
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

        <div
          onClick={() => setShowGPXUpload(true)}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 hover:border-[#00FF88] transition-colors cursor-pointer active:scale-95"
        >
          <div className="flex items-center mb-3 sm:mb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-xs sm:text-sm">📁</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold">GPX 파일 업로드</h3>
          </div>
          <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
            GPX 파일을 업로드하여 자동으로 코스를 생성합니다.
          </p>
          <div className="text-xs sm:text-sm text-gray-500">
            • 빠른 코스 생성<br />
            • 정확한 GPS 데이터<br />
            • 고도 정보 포함
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
                      <div className="text-gray-300">{course.duration}분</div>
                      <div className="text-gray-300">{course.gps_route?.length || 0}개</div>
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
                      <span>{course.duration}분</span>
                      <span>{course.gps_route?.length || 0}개 포인트</span>
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

      {/* GPX 업로드 모달 */}
      {showGPXUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">GPX 파일 업로드</h3>
              <button
                onClick={() => {
                  setShowGPXUpload(false)
                  setGpxFile(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GPX 파일 선택
                </label>
                <input
                  type="file"
                  accept=".gpx"
                  onChange={(e) => setGpxFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  .gpx 형식의 파일만 업로드 가능합니다.
                </p>
              </div>
              
              {gpxFile && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-sm text-gray-300">
                    <strong>선택된 파일:</strong> {gpxFile.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    크기: {(gpxFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowGPXUpload(false)
                    setGpxFile(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  disabled={uploading}
                >
                  취소
                </button>
                <button
                  onClick={handleGPXUpload}
                  disabled={!gpxFile || uploading}
                  className="flex-1 px-4 py-2 bg-[#00FF88] text-black rounded-lg hover:bg-[#00E077] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? '업로드 중...' : '업로드'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 제휴 스팟 관리 탭
function SpotsTab() {
  const [spots, setSpots] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'restaurant',
    description: '',
    signature_menu: '',
    address: '',
    phone: '',
    open_time: '',
    discount_percentage: '',
    special_offer: '',
    logo_url: '',
    images: [] as string[]
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [editingSpot, setEditingSpot] = useState<any>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // 제휴 스팟 목록 불러오기
  const loadSpots = async () => {
    setLoading(true)
    try {
      const { data, error } = await (supabase as any)
        .from('spots')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('스팟 로딩 오류:', error)
      } else {
        setSpots(data || [])
      }
    } catch (error) {
      console.error('스팟 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트 시 스팟 로딩
  useEffect(() => {
    loadSpots()
  }, [])

  // 폼 데이터 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 로고 파일 선택 핸들러
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 크기 검증 (50KB = 51200 bytes)
      if (file.size > 51200) {
        alert('로고 이미지는 50KB 이하로 업로드해주세요.')
        e.target.value = ''
        return
      }
      
      // 이미지 타입 검증
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.')
        e.target.value = ''
        return
      }
      
      setLogoFile(file)
    }
  }

  // 전경사진 파일 선택 핸들러
  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    
    for (const file of files) {
      // 파일 크기 검증 (200KB = 204800 bytes)
      if (file.size > 204800) {
        alert(`"${file.name}"은 200KB를 초과합니다. 더 작은 파일을 선택해주세요.`)
        continue
      }
      
      // 이미지 타입 검증
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}"은 이미지 파일이 아닙니다.`)
        continue
      }
      
      validFiles.push(file)
    }
    
    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles])
    }
    
    // input 초기화
    e.target.value = ''
  }

  // 전경사진 제거 핸들러
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 이미지 압축 함수
  const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // 비율 유지하면서 크기 조정
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height)
        
        // Base64로 변환 (압축 적용)
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // 파일을 Base64로 변환하는 함수 (압축 적용)
  const fileToBase64 = async (file: File): Promise<string> => {
    // 로고는 200x200, 전경사진은 800x600으로 압축
    const isLogo = file === logoFile
    const maxWidth = isLogo ? 200 : 800
    const maxHeight = isLogo ? 200 : 600
    const quality = isLogo ? 0.9 : 0.8
    
    return await compressImage(file, maxWidth, maxHeight, quality)
  }

  // 스팟 등록
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.address) {
      alert('스팟명과 주소는 필수 입력 항목입니다.')
      return
    }

    setSaving(true)
    try {
      // 주소를 좌표로 변환 (임시로 서울 중심 좌표 사용)
      const latitude = 37.5665 + (Math.random() - 0.5) * 0.1
      const longitude = 126.9780 + (Math.random() - 0.5) * 0.1

      // 이미지 처리를 병렬로 실행
      const imagePromises: Promise<string>[] = []
      
      // 로고 이미지 처리
      if (logoFile) {
        imagePromises.push(fileToBase64(logoFile))
      }

      // 전경사진들 처리 (병렬)
      const imageFilePromises = imageFiles.map(file => fileToBase64(file))
      
      // 모든 이미지를 병렬로 처리
      const [logoUrl, ...imageUrls] = await Promise.all([
        logoFile ? fileToBase64(logoFile) : Promise.resolve(''),
        ...imageFilePromises
      ])

      const spotData = {
        ...formData,
        latitude,
        longitude,
        logo_url: logoUrl,
        images: imageUrls,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
        is_active: true
      }

      const { error } = await (supabase as any)
        .from('spots')
        .insert([spotData])

      if (error) {
        console.error('스팟 등록 오류:', error)
        alert(`스팟 등록 중 오류가 발생했습니다: ${error.message}`)
        return
      }

      alert('제휴 스팟이 성공적으로 등록되었습니다!')
      setShowCreateForm(false)
      setFormData({
        name: '',
        category: 'restaurant',
        description: '',
        signature_menu: '',
        address: '',
        phone: '',
        open_time: '',
        discount_percentage: '',
        special_offer: '',
        logo_url: '',
        images: []
      })
      setLogoFile(null)
      setImageFiles([])
      loadSpots()

    } catch (error: any) {
      console.error('스팟 등록 실패:', error)
      alert(`스팟 등록 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
    } finally {
      setSaving(false)
    }
  }

  // 스팟 수정 시작
  const startEditSpot = (spot: any) => {
    setEditingSpot(spot)
    setFormData({
      name: spot.name || '',
      category: spot.category || 'restaurant',
      description: spot.description || '',
      signature_menu: spot.signature_menu || '',
      address: spot.address || '',
      phone: spot.phone || '',
      open_time: spot.open_time || '',
      discount_percentage: spot.discount_percentage?.toString() || '',
      special_offer: spot.special_offer || '',
      logo_url: spot.logo_url || '',
      images: spot.images || []
    })
    setLogoFile(null)
    setImageFiles([])
    setShowEditForm(true)
    setShowCreateForm(false)
  }

  // 스팟 수정 취소
  const cancelEdit = () => {
    setEditingSpot(null)
    setShowEditForm(false)
    setFormData({
      name: '',
      category: 'restaurant',
      description: '',
      signature_menu: '',
      address: '',
      phone: '',
      open_time: '',
      discount_percentage: '',
      special_offer: '',
      logo_url: '',
      images: []
    })
    setLogoFile(null)
    setImageFiles([])
  }

  // 스팟 수정 저장
  const updateSpot = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.address) {
      alert('스팟명과 주소는 필수 입력 항목입니다.')
      return
    }

    setSaving(true)
    try {
      // 이미지 처리를 병렬로 실행
      const [logoUrl, ...newImageUrls] = await Promise.all([
        logoFile ? fileToBase64(logoFile) : Promise.resolve(formData.logo_url),
        ...imageFiles.map(file => fileToBase64(file))
      ])

      // 기존 이미지와 새 이미지 합치기
      const imageUrls = [...formData.images, ...newImageUrls]

      const spotData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        signature_menu: formData.signature_menu,
        address: formData.address,
        phone: formData.phone || null,
        open_time: formData.open_time || null,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
        special_offer: formData.special_offer || null,
        logo_url: logoUrl,
        images: imageUrls,
        updated_at: new Date().toISOString()
      }

      const { error } = await (supabase as any)
        .from('spots')
        .update(spotData)
        .eq('id', editingSpot.id)

      if (error) {
        console.error('스팟 수정 오류:', error)
        alert(`스팟 수정 중 오류가 발생했습니다: ${error.message}`)
        return
      }

      alert('제휴 스팟이 성공적으로 수정되었습니다!')
      cancelEdit()
      loadSpots()

    } catch (error: any) {
      console.error('스팟 수정 실패:', error)
      alert(`스팟 수정 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
    } finally {
      setSaving(false)
    }
  }

  // 기존 이미지 제거
  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  // 스팟 삭제
  const deleteSpot = async (spotId: string, spotName: string) => {
    if (!confirm(`"${spotName}" 스팟을 정말 삭제하시겠습니까?`)) {
      return
    }

    try {
      const { error } = await (supabase as any)
        .from('spots')
        .delete()
        .eq('id', spotId)

      if (error) {
        console.error('스팟 삭제 오류:', error)
        alert(`스팟 삭제 중 오류가 발생했습니다: ${error.message}`)
        return
      }

      alert('스팟이 성공적으로 삭제되었습니다.')
      loadSpots()

    } catch (error: any) {
      console.error('스팟 삭제 실패:', error)
      alert(`스팟 삭제 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'restaurant': return '음식점'
      case 'cafe': return '카페'
      case 'fitness': return '피트니스'
      case 'retail': return '소매점'
      case 'service': return '서비스'
      default: return category
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">
          제휴 스팟 관리
          {showEditForm && editingSpot && (
            <span className="text-base text-gray-400 ml-2">- {editingSpot.name} 수정 중</span>
          )}
        </h2>
        <div className="flex gap-2">
          {showEditForm ? (
            <button
              onClick={cancelEdit}
              className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl transition-colors font-semibold"
            >
              <X className="w-5 h-5 mr-2" />
              수정 취소
            </button>
          ) : (
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm)
                if (showCreateForm) {
                  setFormData({
                    name: '',
                    category: 'restaurant',
                    description: '',
                    signature_menu: '',
                    address: '',
                    phone: '',
                    open_time: '',
                    discount_percentage: '',
                    special_offer: '',
                    logo_url: '',
                    images: []
                  })
                  setLogoFile(null)
                  setImageFiles([])
                }
              }}
              className="flex items-center justify-center px-4 py-3 bg-[#00FF88] text-black rounded-xl hover:bg-[#00E077] transition-colors font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              {showCreateForm ? '등록 취소' : '새 스팟 등록'}
            </button>
          )}
        </div>
      </div>

      {/* 스팟 등록 폼 */}
      {showCreateForm && (
        <div className="bg-gray-900 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">새 제휴 스팟 등록</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  스팟명 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  카테고리
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                >
                  <option value="restaurant">음식점</option>
                  <option value="cafe">카페</option>
                  <option value="fitness">피트니스</option>
                  <option value="retail">소매점</option>
                  <option value="service">서비스</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
              />
            </div>

            {/* 로고 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                로고 이미지
                <span className="text-xs text-gray-500 ml-2">
                  (권장: 200x200px, 최대 50KB, PNG/JPG)
                </span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleLogoChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#00FF88] file:text-black hover:file:bg-[#00E077]"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 정사각형 이미지가 가장 좋습니다. 원형으로 표시됩니다.
              </p>
              {logoFile && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(logoFile)}
                    alt="로고 미리보기"
                    className="w-20 h-20 object-cover rounded-full border border-gray-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    파일 크기: {(logoFile.size / 1024).toFixed(1)}KB
                  </p>
                </div>
              )}
            </div>

            {/* 전경사진 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                전경사진 (여러 장 가능)
                <span className="text-xs text-gray-500 ml-2">
                  (권장: 800x600px, 최대 200KB/장, JPG/PNG)
                </span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleImagesChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#00FF88] file:text-black hover:file:bg-[#00E077]"
              />
              <p className="text-xs text-gray-500 mt-1">
                📸 가로형 이미지가 좋습니다. 슬라이더로 표시됩니다.
              </p>
              {imageFiles.length > 0 && (
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`전경사진 ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg">
                        {(file.size / 1024).toFixed(1)}KB
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  대표 메뉴/서비스
                </label>
                <input
                  type="text"
                  name="signature_menu"
                  value={formData.signature_menu}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                주소 *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  운영시간
                </label>
                <input
                  type="text"
                  name="open_time"
                  value={formData.open_time}
                  onChange={handleInputChange}
                  placeholder="예: 09:00-22:00"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  할인율 (%)
                </label>
                <input
                  type="number"
                  name="discount_percentage"
                  value={formData.discount_percentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  특별 혜택
                </label>
                <input
                  type="text"
                  name="special_offer"
                  value={formData.special_offer}
                  onChange={handleInputChange}
                  placeholder="예: 음료 1+1"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#00FF88] hover:bg-[#00E077] text-black rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '저장 중...' : '등록하기'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 스팟 수정 폼 */}
      {showEditForm && editingSpot && (
        <div className="bg-gray-900 rounded-2xl p-6 mb-6 border-2 border-blue-500">
          <h3 className="text-lg font-semibold mb-4">제휴 스팟 수정 - {editingSpot.name}</h3>
          <form onSubmit={updateSpot} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  스팟명 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  카테고리
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                >
                  <option value="restaurant">음식점</option>
                  <option value="cafe">카페</option>
                  <option value="fitness">피트니스</option>
                  <option value="retail">소매점</option>
                  <option value="service">서비스</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
              />
            </div>

            {/* 기존 로고 표시 및 새 로고 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                로고 이미지
                <span className="text-xs text-gray-500 ml-2">
                  (권장: 200x200px, 최대 50KB, PNG/JPG)
                </span>
              </label>
              
              {/* 기존 로고 */}
              {formData.logo_url && !logoFile && (
                <div className="mb-2">
                  <p className="text-xs text-gray-400 mb-1">현재 로고:</p>
                  <img
                    src={formData.logo_url}
                    alt="현재 로고"
                    className="w-20 h-20 object-cover rounded-full border border-gray-600"
                  />
                </div>
              )}
              
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleLogoChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#00FF88] file:text-black hover:file:bg-[#00E077]"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 새 이미지를 선택하면 기존 로고가 교체됩니다.
              </p>
              
              {/* 새 로고 미리보기 */}
              {logoFile && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">새 로고 미리보기:</p>
                  <img
                    src={URL.createObjectURL(logoFile)}
                    alt="새 로고 미리보기"
                    className="w-20 h-20 object-cover rounded-full border border-gray-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    파일 크기: {(logoFile.size / 1024).toFixed(1)}KB
                  </p>
                </div>
              )}
            </div>

            {/* 기존 전경사진 및 새 전경사진 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                전경사진
                <span className="text-xs text-gray-500 ml-2">
                  (권장: 800x600px, 최대 200KB/장, JPG/PNG)
                </span>
              </label>
              
              {/* 기존 전경사진들 */}
              {formData.images && formData.images.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2">현재 전경사진들:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`기존 전경사진 ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleImagesChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#00FF88] file:text-black hover:file:bg-[#00E077]"
              />
              <p className="text-xs text-gray-500 mt-1">
                📸 새 이미지를 추가할 수 있습니다. 기존 이미지는 유지됩니다.
              </p>
              
              {/* 새 전경사진 미리보기 */}
              {imageFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-2">추가할 전경사진들:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`새 전경사진 ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg">
                          {(file.size / 1024).toFixed(1)}KB
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  대표 메뉴/서비스
                </label>
                <input
                  type="text"
                  name="signature_menu"
                  value={formData.signature_menu}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                주소 *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  운영시간
                </label>
                <input
                  type="text"
                  name="open_time"
                  value={formData.open_time}
                  onChange={handleInputChange}
                  placeholder="예: 09:00-22:00"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  할인율 (%)
                </label>
                <input
                  type="number"
                  name="discount_percentage"
                  value={formData.discount_percentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  특별 혜택
                </label>
                <input
                  type="text"
                  name="special_offer"
                  value={formData.special_offer}
                  onChange={handleInputChange}
                  placeholder="예: 음료 1+1"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF88]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '저장 중...' : '수정 완료'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 등록된 스팟 목록 */}
      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-semibold">등록된 제휴 스팟</h3>
          <button
            onClick={loadSpots}
            disabled={loading}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? '로딩...' : '새로고침'}
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FF88] mx-auto mb-2"></div>
            <div className="text-gray-400">스팟 목록을 불러오는 중...</div>
          </div>
        ) : spots.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Store className="w-12 h-12 mx-auto mb-2 text-gray-600" />
            <div>등록된 제휴 스팟이 없습니다.</div>
            <div className="text-sm text-gray-600 mt-1">
              위의 "새 스팟 등록" 버튼을 눌러 첫 번째 스팟을 등록해보세요!
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {spots.map((spot) => (
              <div key={spot.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white text-lg">{spot.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs font-medium">
                        {getCategoryText(spot.category)}
                      </span>
                      {spot.discount_percentage && (
                        <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs font-medium">
                          {spot.discount_percentage}% 할인
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditSpot(spot)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                      title="스팟 수정"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteSpot(spot.id, spot.name)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400 hover:text-red-300"
                      title="스팟 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {spot.description && (
                  <p className="text-gray-400 text-sm mb-2">{spot.description}</p>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300">
                  <div>📍 {spot.address}</div>
                  {spot.phone && <div>📞 {spot.phone}</div>}
                  {spot.open_time && <div>🕒 {spot.open_time}</div>}
                  {spot.signature_menu && <div>🍽️ {spot.signature_menu}</div>}
                </div>
                
                {spot.special_offer && (
                  <div className="mt-2 p-2 bg-[#00FF88]/10 border border-[#00FF88]/20 rounded-lg">
                    <span className="text-[#00FF88] text-sm font-medium">🎁 {spot.special_offer}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
