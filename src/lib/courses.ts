import { supabase } from './supabase'
import { Course } from '@/types/database'

// 모든 코스 가져오기 (검증된 코스만)
export async function getCourses(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        users!courses_created_by_fkey(name)
      `)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('코스 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('코스 조회 실패:', error)
    return []
  }
}

// 인기 코스 가져오기 (조회수 기준)
export async function getPopularCourses(limit = 5) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        users!courses_created_by_fkey(name)
      `)
      .eq('is_verified', true)
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('인기 코스 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('인기 코스 조회 실패:', error)
    return []
  }
}

// 특정 코스 가져오기
export async function getCourse(id: string) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        users!courses_created_by_fkey(name),
        reviews(
          *,
          users!reviews_user_id_fkey(name, profile_image)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('코스 상세 조회 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('코스 상세 조회 실패:', error)
    return null
  }
}

// 코스 조회수 증가 (임시로 주석 처리 - 타입 오류로 인해)
export async function incrementViewCount(courseId: string) {
  // TODO: 나중에 구현
  console.log('조회수 증가:', courseId)
}
// 코스 검색
export async function searchCourses(query: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        users!courses_created_by_fkey(name)
      `)
      .eq('is_verified', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,area.ilike.%${query}%`)
      .order('rating_avg', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('코스 검색 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('코스 검색 실패:', error)
    return []
  }
}

// 지역별 코스 가져오기
export async function getCoursesByArea(area: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        users!courses_created_by_fkey(name)
      `)
      .eq('is_verified', true)
      .eq('area', area)
      .order('rating_avg', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('지역별 코스 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('지역별 코스 조회 실패:', error)
    return []
  }
}

// 난이도별 코스 가져오기
export async function getCoursesByDifficulty(difficulty: 'easy' | 'medium' | 'hard', limit = 10) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        users!courses_created_by_fkey(name)
      `)
      .eq('is_verified', true)
      .eq('difficulty', difficulty)
      .order('rating_avg', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('난이도별 코스 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('난이도별 코스 조회 실패:', error)
    return []
  }
}

// 코스 타입별 가져오기
export async function getCoursesByType(courseType: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        users!courses_created_by_fkey(name)
      `)
      .eq('is_verified', true)
      .eq('course_type', courseType)
      .order('rating_avg', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('코스 타입별 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('코스 타입별 조회 실패:', error)
    return []
  }
}

// 필터링된 코스 검색 (통합 검색)
export async function getFilteredCourses(filters: {
  search?: string
  courseType?: string
  difficulty?: string
  area?: string
  limit?: number
}) {
  try {
    let query = supabase
      .from('courses')
      .select(`
        *,
        users!courses_created_by_fkey(name)
      `)
      .eq('is_verified', true)

    // 검색어 필터
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,area.ilike.%${filters.search}%`)
    }

    // 코스 타입 필터
    if (filters.courseType && filters.courseType !== 'all') {
      query = query.eq('course_type', filters.courseType)
    }

    // 난이도 필터
    if (filters.difficulty && filters.difficulty !== 'all') {
      query = query.eq('difficulty', filters.difficulty)
    }

    // 지역 필터
    if (filters.area && filters.area !== 'all') {
      query = query.eq('area', filters.area)
    }

    const { data, error } = await query
      .order('rating_avg', { ascending: false })
      .limit(filters.limit || 20)

    if (error) {
      console.error('필터링된 코스 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('필터링된 코스 조회 실패:', error)
    return []
  }
}

// 사용 가능한 지역 목록 가져오기
export async function getAvailableAreas() {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('area')
      .eq('is_verified', true)
      .order('area')

    if (error) {
      console.error('지역 목록 조회 오류:', error)
      return []
    }

    // 중복 제거하고 정렬
    const uniqueAreas = [...new Set((data as any)?.map((item: any) => item.area) || [])]
    return uniqueAreas.filter((area: any) => area && typeof area === 'string' && area.trim() !== '')
  } catch (error) {
    console.error('지역 목록 조회 실패:', error)
    return []
  }
}

// 현재 위치 주변 코스 가져오기 (거리 계산)
export async function getNearbyCoursesFromLocation(userLat: number, userLng: number, radiusKm: number = 10, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        users!courses_created_by_fkey(name)
      `)
      .eq('is_verified', true)
      .order('rating_avg', { ascending: false })

    if (error) {
      console.error('주변 코스 조회 오류:', error)
      return []
    }

    if (!data) return []

    // 거리 계산 및 필터링
    const coursesWithDistance = data.map((course: any) => {
      // 코스의 첫 번째 GPS 포인트를 기준으로 거리 계산
      const courseGps = course.gps_route?.[0]
      if (!courseGps) return null

      const distance = calculateDistance(userLat, userLng, courseGps.lat, courseGps.lng)
      
      return {
        ...course,
        distanceFromUser: distance
      }
    }).filter((course: any) => course && course.distanceFromUser <= radiusKm)

    // 거리 순으로 정렬하고 제한
    return coursesWithDistance
      .sort((a: any, b: any) => a.distanceFromUser - b.distanceFromUser)
      .slice(0, limit)

  } catch (error) {
    console.error('주변 코스 조회 실패:', error)
    return []
  }
}

// 두 지점 간 거리 계산 (Haversine 공식, km 단위)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 새 코스 생성 (임시로 any 타입 사용)
export async function createCourse(courseData: any) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single()

    if (error) {
      console.error('코스 생성 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('코스 생성 실패:', error)
    return null
  }
}
