import { supabase } from './supabase'

export interface UserRunningStats {
  totalDistance: number
  totalRuns: number
  totalTime: number // 분 단위
  averagePace: number // 분/km
  currentLevel: string
  nextLevelTarget: number
  levelProgress: number
}

// 사용자의 런닝 통계 계산
export const calculateRunningStats = async (userId: string): Promise<UserRunningStats> => {
  try {
    // 런닝 로그에서 통계 데이터 가져오기
    const { data: runningLogs, error } = await supabase
      .from('running_logs')
      .select('distance, duration, avg_speed')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching running logs:', error)
      throw error
    }

    // 기본값 설정
    if (!runningLogs || runningLogs.length === 0) {
      return {
        totalDistance: 0,
        totalRuns: 0,
        totalTime: 0,
        averagePace: 0,
        currentLevel: '입문',
        nextLevelTarget: 10,
        levelProgress: 0
      }
    }

    // 통계 계산
    const totalDistance = runningLogs.reduce((sum, log) => sum + (log as any).distance, 0)
    const totalRuns = runningLogs.length
    const totalTime = runningLogs.reduce((sum, log) => sum + (log as any).duration, 0) // 초 단위를 분으로 변환
    const averageSpeed = runningLogs.reduce((sum, log) => sum + ((log as any).avg_speed || 0), 0) / totalRuns
    const averagePace = averageSpeed > 0 ? 60 / averageSpeed : 0 // km/h를 분/km로 변환

    // 레벨 계산
    const { currentLevel, nextLevelTarget, levelProgress } = calculateLevel(totalDistance)

    return {
      totalDistance: Math.round(totalDistance * 10) / 10, // 소수점 1자리
      totalRuns,
      totalTime: Math.round(totalTime / 60), // 초를 분으로 변환
      averagePace: Math.round(averagePace * 10) / 10,
      currentLevel,
      nextLevelTarget,
      levelProgress
    }
  } catch (error) {
    console.error('Error calculating running stats:', error)
    throw error
  }
}

// 거리 기반 레벨 계산 (올바른 로직)
const calculateLevel = (totalDistance: number) => {
  // 레벨 정의: 10km 넘으면 중급, 30km 넘으면 고급, 50km 넘으면 마스터
  if (totalDistance >= 100) {
    return { currentLevel: '마스터', nextLevelTarget: 100, levelProgress: 100 }
  } else if (totalDistance >= 50) {
    const progress = Math.min(((totalDistance - 50) / (100 - 50)) * 100, 100)
    return { currentLevel: '마스터', nextLevelTarget: 100, levelProgress: Math.round(progress) }
  } else if (totalDistance >= 30) {
    const progress = Math.min(((totalDistance - 30) / (50 - 30)) * 100, 100)
    return { currentLevel: '고급', nextLevelTarget: 50, levelProgress: Math.round(progress) }
  } else if (totalDistance >= 10) {
    const progress = Math.min(((totalDistance - 10) / (30 - 10)) * 100, 100)
    return { currentLevel: '중급', nextLevelTarget: 30, levelProgress: Math.round(progress) }
  } else {
    const progress = Math.min((totalDistance / 10) * 100, 100)
    return { currentLevel: '입문', nextLevelTarget: 10, levelProgress: Math.round(progress) }
  }
}

// 사용자 프로필에 통계 업데이트
export const updateUserStats = async (userId: string, stats: UserRunningStats) => {
  try {
    const { error } = await (supabase as any)
      .from('users')
      .update({
        total_distance: stats.totalDistance,
        total_runs: stats.totalRuns,
        total_time: stats.totalTime,
        avg_pace: stats.averagePace
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user stats:', error)
      throw error
    }
  } catch (error) {
    console.error('Error updating user stats:', error)
    throw error
  }
}
