import { supabase } from '@/lib/supabase'

// 사용자의 최근 런닝 로그 가져오기 (코스 정보 포함)
export async function getRecentRunningLogs(userId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('running_logs')
      .select(`
        *,
        courses (
          id,
          name,
          area,
          distance,
          duration,
          difficulty,
          rating_avg
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('최근 런닝 로그 조회 실패:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('최근 런닝 로그 조회 중 오류:', error)
    return []
  }
}

// 특정 코스의 런닝 횟수 가져오기
export async function getCourseRunCount(userId: string, courseId: string) {
  try {
    const { count, error } = await supabase
      .from('running_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', courseId)

    if (error) {
      console.error('코스 런닝 횟수 조회 실패:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('코스 런닝 횟수 조회 중 오류:', error)
    return 0
  }
}

// 사용자가 뛴 고유 코스들과 각 코스의 최근 런닝 정보
export async function getUserRecentCourses(userId: string, limit: number = 5) {
  try {
    // 1. 사용자가 뛴 고유 코스들의 최근 런닝 로그 가져오기 (완주 정보 포함)
    const { data: recentLogs, error: logsError } = await supabase
      .from('running_logs')
      .select(`
        course_id,
        completed_at,
        distance,
        duration,
        is_completed,
        courses!inner (
          id,
          name,
          area,
          distance,
          duration,
          difficulty,
          rating_avg
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false }) as { data: any[] | null, error: any }

    if (logsError) {
      console.error('런닝 로그 조회 실패:', logsError)
      return []
    }

    if (!recentLogs || recentLogs.length === 0) {
      return []
    }

    // 2. 코스별로 그룹화하고 최근 런닝 날짜와 총 횟수, 완주 정보 계산
    const courseMap = new Map()
    
    for (const log of recentLogs) {
      const courseId = log.course_id
      
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          course: log.courses,
          lastRun: log.completed_at,
          lastRunDistance: log.distance,
          lastRunDuration: log.duration,
          lastRunCompleted: log.is_completed,
          runCount: 1,
          completedCount: log.is_completed ? 1 : 0
        })
      } else {
        const existing = courseMap.get(courseId)
        existing.runCount += 1
        if (log.is_completed) {
          existing.completedCount += 1
        }
        // 최근 날짜 유지 (이미 최신순으로 정렬되어 있음)
      }
    }

    // 3. 최근 런닝 날짜 순으로 정렬하고 제한
    const result = Array.from(courseMap.values())
      .sort((a, b) => new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime())
      .slice(0, limit)
      .map(item => ({
        id: item.course.id,
        name: item.course.name,
        area: item.course.area,
        distance: item.course.distance,
        duration: item.course.duration,
        difficulty: item.course.difficulty,
        rating: item.course.rating_avg || 0,
        lastRun: item.lastRun,
        lastRunDistance: item.lastRunDistance,
        lastRunDuration: item.lastRunDuration,
        lastRunCompleted: item.lastRunCompleted,
        runCount: item.runCount,
        completedCount: item.completedCount,
        completionRate: Math.round((item.completedCount / item.runCount) * 100)
      }))

    return result
  } catch (error) {
    console.error('사용자 최근 코스 조회 중 오류:', error)
    return []
  }
}

// 런닝 로그 저장
export async function saveRunningLog(logData: {
  userId: string
  courseId: string
  distance: number
  duration: number
  avgSpeed: number
  calories: number
  gpsPath: Array<{ lat: number; lng: number; timestamp: string }>
  isCompleted?: boolean
}) {
  try {
    const { data, error } = await (supabase
      .from('running_logs') as any)
      .insert({
        user_id: logData.userId,
        course_id: logData.courseId,
        distance: logData.distance,
        duration: logData.duration,
        avg_speed: logData.avgSpeed,
        calories: logData.calories,
        gps_path: logData.gpsPath,
        is_completed: logData.isCompleted || false,
        completed_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('런닝 로그 저장 실패:', error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error('런닝 로그 저장 중 오류:', error)
    return null
  }
}
