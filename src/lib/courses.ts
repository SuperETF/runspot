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
