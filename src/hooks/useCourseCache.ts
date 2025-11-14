import { useState, useEffect, useCallback, useRef } from 'react'
import { Course } from '@/types/database'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

interface UseCourseCache {
  getCourses: (lat: number, lng: number, radius: number, limit: number) => Promise<Course[]>
  getCourseById: (id: string) => Promise<Course | null>
  clearCache: () => void
  getCacheStats: () => { size: number; hitRate: number }
}

const CACHE_EXPIRY = 5 * 60 * 1000 // 5분
const MAX_CACHE_SIZE = 100 // 최대 캐시 항목 수
const LOCATION_PRECISION = 3 // 위치 정밀도 (소수점 자리수)

export const useCourseCache = (): UseCourseCache => {
  const cacheRef = useRef<Map<string, CacheEntry<any>>>(new Map())
  const statsRef = useRef({ hits: 0, misses: 0 })
  const [cacheSize, setCacheSize] = useState(0)

  // 캐시 키 생성
  const generateLocationKey = useCallback((lat: number, lng: number, radius: number, limit: number) => {
    const roundedLat = parseFloat(lat.toFixed(LOCATION_PRECISION))
    const roundedLng = parseFloat(lng.toFixed(LOCATION_PRECISION))
    return `courses_${roundedLat}_${roundedLng}_${radius}_${limit}`
  }, [])

  const generateCourseKey = useCallback((id: string) => {
    return `course_${id}`
  }, [])

  // 캐시에서 데이터 가져오기
  const getFromCache = useCallback(<T>(key: string): T | null => {
    const entry = cacheRef.current.get(key)
    
    if (!entry) {
      statsRef.current.misses++
      return null
    }

    if (Date.now() > entry.expiry) {
      cacheRef.current.delete(key)
      setCacheSize(cacheRef.current.size)
      statsRef.current.misses++
      return null
    }

    statsRef.current.hits++
    return entry.data
  }, [])

  // 캐시에 데이터 저장
  const setToCache = useCallback(<T>(key: string, data: T) => {
    // LRU 캐시 구현: 최대 크기 초과 시 가장 오래된 항목 제거
    if (cacheRef.current.size >= MAX_CACHE_SIZE) {
      const firstKey = cacheRef.current.keys().next().value
      if (firstKey) {
        cacheRef.current.delete(firstKey)
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + CACHE_EXPIRY
    }

    cacheRef.current.set(key, entry)
    setCacheSize(cacheRef.current.size)
  }, [])

  // 주변 코스 가져오기 (캐시 적용)
  const getCourses = useCallback(async (lat: number, lng: number, radius: number, limit: number): Promise<Course[]> => {
    const key = generateLocationKey(lat, lng, radius, limit)
    
    // 캐시에서 먼저 확인
    const cached = getFromCache<Course[]>(key)
    if (cached) {
      return cached
    }

    try {
      // 실제 API 호출 (동적 import로 번들 크기 최적화)
      const { getNearbyCoursesFromLocation } = await import('@/lib/courses')
      const courses = await getNearbyCoursesFromLocation(lat, lng, radius, limit)
      
      // 캐시에 저장
      setToCache(key, courses)
      
      return courses
    } catch (error) {
      console.error('코스 데이터 로드 실패:', error)
      return []
    }
  }, [generateLocationKey, getFromCache, setToCache])

  // 개별 코스 가져오기 (캐시 적용)
  const getCourseById = useCallback(async (id: string): Promise<Course | null> => {
    const key = generateCourseKey(id)
    
    // 캐시에서 먼저 확인
    const cached = getFromCache<Course>(key)
    if (cached) {
      return cached
    }

    try {
      // 실제 API 호출
      const { getCourse: fetchCourse } = await import('@/lib/courses')
      const course = await fetchCourse(id)
      
      if (course) {
        // 캐시에 저장
        setToCache(key, course)
      }
      
      return course
    } catch (error) {
      console.error('코스 데이터 로드 실패:', error)
      return null
    }
  }, [generateCourseKey, getFromCache, setToCache])

  // 캐시 초기화
  const clearCache = useCallback(() => {
    cacheRef.current.clear()
    setCacheSize(0)
    statsRef.current = { hits: 0, misses: 0 }
  }, [])

  // 캐시 통계
  const getCacheStats = useCallback(() => {
    const total = statsRef.current.hits + statsRef.current.misses
    const hitRate = total > 0 ? (statsRef.current.hits / total) * 100 : 0
    
    return {
      size: cacheSize,
      hitRate: Math.round(hitRate * 100) / 100
    }
  }, [cacheSize])

  // 주기적으로 만료된 캐시 정리
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now()
      let cleaned = false
      
      for (const [key, entry] of cacheRef.current.entries()) {
        if (now > entry.expiry) {
          cacheRef.current.delete(key)
          cleaned = true
        }
      }
      
      if (cleaned) {
        setCacheSize(cacheRef.current.size)
      }
    }, 60000) // 1분마다 정리

    return () => clearInterval(cleanup)
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearCache()
    }
  }, [clearCache])

  return {
    getCourses,
    getCourseById,
    clearCache,
    getCacheStats
  }
}
