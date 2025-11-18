import { supabase } from './supabase'

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

    if (data) {
      const courseData = data as any
      console.log('📊 getCourse 결과:', {
        id: courseData.id,
        name: courseData.name,
        gps_route: courseData.gps_route,
        gps_route_length: courseData.gps_route?.length || 0,
        startPoint: courseData.gps_route?.[0],
        endPoint: courseData.gps_route?.[courseData.gps_route?.length - 1]
      })

      // GPS 경로가 없거나 비어있는 경우 임시 데이터 추가
      if (!courseData.gps_route || courseData.gps_route.length === 0) {
        console.warn('⚠️ GPS 경로가 없어서 임시 데이터 생성')
        
        // 코스 ID를 문자열로 변환하여 처리
        const courseIdStr = String(courseData.id)
        
        // 코스 ID에 따라 다른 시작점 생성 (임시)
        const tempRoutes: { [key: string]: any[] } = {
          '1': [
            { lat: 37.5285, lng: 126.9367 }, // 여의도
            { lat: 37.5290, lng: 126.9380 },
            { lat: 37.5295, lng: 126.9390 }
          ],
          '2': [
            { lat: 37.5172, lng: 127.0473 }, // 강남
            { lat: 37.5175, lng: 127.0480 },
            { lat: 37.5180, lng: 127.0490 }
          ],
          '3': [
            { lat: 37.5796, lng: 126.9770 }, // 광화문
            { lat: 37.5800, lng: 126.9775 },
            { lat: 37.5805, lng: 126.9780 }
          ],
          '4': [
            { lat: 37.5663, lng: 126.9779 }, // 서울역
            { lat: 37.5668, lng: 126.9785 },
            { lat: 37.5673, lng: 126.9790 }
          ],
          '5': [
            { lat: 37.5219, lng: 127.0411 }, // 잠실
            { lat: 37.5224, lng: 127.0416 },
            { lat: 37.5229, lng: 127.0421 }
          ]
        }
        
        // 코스 ID에 해당하는 경로가 있으면 사용, 없으면 고유한 위치 생성
        if (tempRoutes[courseIdStr]) {
          courseData.gps_route = tempRoutes[courseIdStr]
        } else {
          // 코스 ID를 시드로 사용하여 각 코스마다 다른 위치 생성
          // UUID의 경우 해시값을 생성하여 시드로 사용
          let seed = 1
          if (courseIdStr) {
            // 문자열의 각 문자 코드를 합산하여 시드 생성
            seed = courseIdStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
          }
          
          console.log('🔍 시드 생성:', { courseId: courseIdStr, seed })
          
          // 서울 주요 지역들의 기준점들
          const baseLocations = [
            { lat: 37.5665, lng: 126.9780 }, // 서울역
            { lat: 37.5796, lng: 126.9770 }, // 광화문
            { lat: 37.5172, lng: 127.0473 }, // 강남
            { lat: 37.5285, lng: 126.9367 }, // 여의도
            { lat: 37.5219, lng: 127.0411 }, // 잠실
            { lat: 37.5663, lng: 126.9779 }, // 명동
            { lat: 37.5443, lng: 127.0557 }, // 건대
            { lat: 37.4979, lng: 127.0276 }, // 사당
            { lat: 37.5014, lng: 127.0396 }, // 교대
            { lat: 37.5326, lng: 126.9652 }  // 한강공원
          ]
          
          // 코스 ID에 따라 기준점 선택
          const locationIndex = seed % baseLocations.length
          const baseLocation = baseLocations[locationIndex]
          
          console.log('📍 기준점 선택:', { 
            seed, 
            locationIndex, 
            baseLocation,
            locationName: ['서울역', '광화문', '강남', '여의도', '잠실', '명동', '건대', '사당', '교대', '한강공원'][locationIndex]
          })
          
          // 기준점 주변에 작은 변화를 주어 경로 생성
          const smallOffset1 = 0.001 // 약 100m
          const smallOffset2 = 0.002 // 약 200m
          
          courseData.gps_route = [
            { 
              lat: baseLocation.lat, 
              lng: baseLocation.lng 
            },
            { 
              lat: baseLocation.lat + smallOffset1, 
              lng: baseLocation.lng + smallOffset1 
            },
            { 
              lat: baseLocation.lat + smallOffset2, 
              lng: baseLocation.lng + smallOffset2 
            }
          ]
        }
        
        console.log('🔧 임시 GPS 경로 생성:', {
          courseId: courseIdStr,
          route: courseData.gps_route,
          startPoint: courseData.gps_route[0]
        })
      }
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
