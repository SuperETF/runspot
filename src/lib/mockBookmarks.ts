// localStorage 키
const BOOKMARKS_STORAGE_KEY = 'runspot_bookmarks'

// 개발 환경에서 사용할 임시 북마크 데이터
let mockBookmarks: Array<{
  id: string
  user_id: string
  course_id: string
  created_at: string
  courses: {
    id: string
    name: string
    description: string
    distance: number
    duration: number
    difficulty: 'easy' | 'medium' | 'hard'
    course_type: 'park' | 'hangang' | 'urban' | 'mountain' | 'track'
    area: string
    rating_avg: number
    images: string[]
  }
}> = []

// localStorage에서 북마크 데이터 로드
const loadBookmarksFromStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY)
      if (stored) {
        mockBookmarks = JSON.parse(stored)
      }
    } catch (error) {
      console.error('북마크 데이터 로드 실패:', error)
    }
  }
}


// 초기 로드
loadBookmarksFromStorage()

// 임시 코스 데이터
const mockCourses = [
  {
    id: '550e8400-e29b-41d4-a716-446655440101',
    name: '한강공원 여의도 코스',
    description: '한강을 따라 달리는 평화로운 코스',
    distance: 5.2,
    duration: 35,
    difficulty: 'easy' as const,
    course_type: 'hangang' as const,
    area: '여의도',
    rating_avg: 4.8,
    images: []
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440102',
    name: '남산 순환로',
    description: '남산을 한바퀴 도는 도전적인 코스',
    distance: 3.8,
    duration: 45,
    difficulty: 'medium' as const,
    course_type: 'mountain' as const,
    area: '중구',
    rating_avg: 4.6,
    images: []
  }
]

export const mockGetUserBookmarks = async (userId: string) => {
  // 해당 유저의 북마크만 필터링
  return mockBookmarks.filter(bookmark => bookmark.user_id === userId)
}

export const mockAddBookmark = async (userId: string, courseId: string) => {
  // 이미 북마크되어 있는지 확인
  const existing = mockBookmarks.find(
    bookmark => bookmark.user_id === userId && bookmark.course_id === courseId
  )
  
  if (existing) {
    throw new Error('이미 저장된 코스입니다.')
  }

  // 코스 정보 찾기
  const course = mockCourses.find(c => c.id === courseId)
  if (!course) {
    throw new Error('코스를 찾을 수 없습니다.')
  }

  const newBookmark = {
    id: `bookmark-${Date.now()}`,
    user_id: userId,
    course_id: courseId,
    created_at: new Date().toISOString(),
    courses: course
  }

  mockBookmarks.push(newBookmark)
  return newBookmark
}

export const mockRemoveBookmark = async (userId: string, courseId: string) => {
  const index = mockBookmarks.findIndex(
    bookmark => bookmark.user_id === userId && bookmark.course_id === courseId
  )
  
  if (index > -1) {
    mockBookmarks.splice(index, 1)
  }
}

export const mockIsBookmarked = async (userId: string, courseId: string): Promise<boolean> => {
  return mockBookmarks.some(
    bookmark => bookmark.user_id === userId && bookmark.course_id === courseId
  )
}

export const mockToggleBookmark = async (userId: string, courseId: string) => {
  const isBookmarked = await mockIsBookmarked(userId, courseId)
  
  if (isBookmarked) {
    await mockRemoveBookmark(userId, courseId)
    return false
  } else {
    await mockAddBookmark(userId, courseId)
    return true
  }
}
