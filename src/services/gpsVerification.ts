'use client'

import { GPSPoint, TrackingSession } from './backgroundGPSTracker'

export interface VerificationResult {
  isValid: boolean
  confidence: number
  issues: string[]
  metrics: {
    dataQuality: number
    routeConsistency: number
    speedProfile: number
    duration: number
    distance: number
  }
  recommendation: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'SCREENSHOT_REQUIRED'
}

export interface CourseRoute {
  id: string
  gps_route: Array<{ lat: number; lng: number }>
}

// 두 GPS 포인트 간 거리 계산 (Haversine formula)
function calculateDistance(point1: GPSPoint, point2: GPSPoint): number {
  const R = 6371000 // 지구 반지름 (미터)
  const lat1Rad = (point1.lat * Math.PI) / 180
  const lat2Rad = (point2.lat * Math.PI) / 180
  const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180
  const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// GPS 데이터 품질 검증
function assessDataQuality(gpsPoints: GPSPoint[]): { score: number; issues: string[] } {
  const issues: string[] = []
  let score = 1.0

  // 1. 데이터 충분성 검사
  if (gpsPoints.length < 10) {
    issues.push('GPS 데이터가 부족합니다 (최소 10개 필요)')
    score *= 0.3
  } else if (gpsPoints.length < 30) {
    issues.push('GPS 데이터가 적습니다')
    score *= 0.7
  }

  // 2. 정확도 검사
  const accuracyIssues = gpsPoints.filter(point => point.accuracy > 50).length
  const accuracyRatio = accuracyIssues / gpsPoints.length
  
  if (accuracyRatio > 0.5) {
    issues.push('GPS 정확도가 낮습니다')
    score *= 0.6
  } else if (accuracyRatio > 0.3) {
    issues.push('일부 GPS 데이터의 정확도가 낮습니다')
    score *= 0.8
  }

  // 3. 시간 간격 일관성 검사
  const timeGaps = []
  for (let i = 1; i < gpsPoints.length; i++) {
    const gap = gpsPoints[i].timestamp - gpsPoints[i - 1].timestamp
    timeGaps.push(gap)
  }
  
  const largeGaps = timeGaps.filter(gap => gap > 60000).length // 1분 이상 간격
  if (largeGaps > gpsPoints.length * 0.2) {
    issues.push('GPS 신호 끊김이 많습니다')
    score *= 0.7
  }

  return { score: Math.max(0, score), issues }
}

// 속도 프로필 검증
function assessSpeedProfile(gpsPoints: GPSPoint[]): { score: number; issues: string[] } {
  const issues: string[] = []
  let score = 1.0

  if (gpsPoints.length < 2) {
    return { score: 0, issues: ['속도 계산을 위한 데이터가 부족합니다'] }
  }

  const speeds: number[] = []
  
  // 각 구간별 속도 계산
  for (let i = 1; i < gpsPoints.length; i++) {
    const distance = calculateDistance(gpsPoints[i - 1], gpsPoints[i])
    const timeDiff = (gpsPoints[i].timestamp - gpsPoints[i - 1].timestamp) / 1000 // 초
    
    if (timeDiff > 0) {
      const speed = (distance / timeDiff) * 3.6 // km/h로 변환
      speeds.push(speed)
    }
  }

  if (speeds.length === 0) {
    return { score: 0, issues: ['속도 데이터를 계산할 수 없습니다'] }
  }

  const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
  const maxSpeed = Math.max(...speeds)

  // 런닝/자전거 속도 범위 검증
  if (avgSpeed < 3) {
    issues.push('평균 속도가 너무 낮습니다 (걷기 속도)')
    score *= 0.6
  } else if (avgSpeed > 50) {
    issues.push('평균 속도가 너무 높습니다 (차량 이용 의심)')
    score *= 0.3
  }

  if (maxSpeed > 80) {
    issues.push('최고 속도가 비현실적입니다')
    score *= 0.4
  }

  // 속도 변화의 자연스러움 검사
  const speedVariations = []
  for (let i = 1; i < speeds.length; i++) {
    speedVariations.push(Math.abs(speeds[i] - speeds[i - 1]))
  }
  
  const avgVariation = speedVariations.reduce((sum, v) => sum + v, 0) / speedVariations.length
  if (avgVariation > 20) {
    issues.push('속도 변화가 부자연스럽습니다')
    score *= 0.7
  }

  return { score: Math.max(0, score), issues }
}

// 경로 일관성 검증 (기본적인 버전)
function assessRouteConsistency(gpsPoints: GPSPoint[], courseRoute?: CourseRoute): { score: number; issues: string[] } {
  const issues: string[] = []
  let score = 1.0

  if (gpsPoints.length < 2) {
    return { score: 0, issues: ['경로 분석을 위한 데이터가 부족합니다'] }
  }

  // 1. 총 이동 거리 계산
  let totalDistance = 0
  for (let i = 1; i < gpsPoints.length; i++) {
    totalDistance += calculateDistance(gpsPoints[i - 1], gpsPoints[i])
  }

  // 2. 직선 거리와 실제 이동 거리 비교
  const startPoint = gpsPoints[0]
  const endPoint = gpsPoints[gpsPoints.length - 1]
  const straightDistance = calculateDistance(startPoint, endPoint)
  
  const detourRatio = totalDistance / Math.max(straightDistance, 100) // 최소 100m로 나누기
  
  if (detourRatio > 10) {
    issues.push('이동 경로가 비효율적입니다')
    score *= 0.7
  }

  // 3. 최소 이동 거리 검증
  if (totalDistance < 500) { // 최소 500m
    issues.push('이동 거리가 너무 짧습니다')
    score *= 0.5
  }

  // 4. 코스 경로와의 비교 (있는 경우)
  if (courseRoute && courseRoute.gps_route.length > 0) {
    // TODO: 더 정교한 경로 매칭 알고리즘 구현 예정
    // 현재는 시작점과 끝점만 간단히 비교
    const courseStart = courseRoute.gps_route[0]
    const courseEnd = courseRoute.gps_route[courseRoute.gps_route.length - 1]
    
    const startDistance = calculateDistance(
      { ...startPoint, accuracy: 0, speed: null, heading: null },
      { ...courseStart, timestamp: 0, accuracy: 0, speed: null, heading: null }
    )
    
    const endDistance = calculateDistance(
      { ...endPoint, accuracy: 0, speed: null, heading: null },
      { ...courseEnd, timestamp: 0, accuracy: 0, speed: null, heading: null }
    )
    
    if (startDistance > 200) { // 시작점에서 200m 이상 떨어짐
      issues.push('시작점이 코스와 다릅니다')
      score *= 0.8
    }
    
    if (endDistance > 200) { // 끝점에서 200m 이상 떨어짐
      issues.push('도착점이 코스와 다릅니다')
      score *= 0.8
    }
  }

  return { score: Math.max(0, score), issues }
}

// 운동 시간 검증
function assessDuration(session: TrackingSession): { score: number; issues: string[] } {
  const issues: string[] = []
  let score = 1.0

  if (!session.endTime) {
    return { score: 0, issues: ['운동 종료 시간이 기록되지 않았습니다'] }
  }

  const duration = session.endTime - session.startTime
  const durationMinutes = duration / (1000 * 60)

  // 최소 운동 시간 검증
  if (durationMinutes < 2) {
    issues.push('운동 시간이 너무 짧습니다')
    score *= 0.4
  } else if (durationMinutes < 5) {
    issues.push('운동 시간이 짧습니다')
    score *= 0.7
  }

  // 최대 운동 시간 검증 (비현실적으로 긴 시간)
  if (durationMinutes > 480) { // 8시간 이상
    issues.push('운동 시간이 비현실적으로 깁니다')
    score *= 0.5
  }

  return { score: Math.max(0, score), issues }
}

// 종합 검증 함수
export function verifyGPSSession(session: TrackingSession, courseRoute?: CourseRoute): VerificationResult {
  const gpsPoints = session.gpsPoints
  
  // 각 항목별 검증
  const dataQuality = assessDataQuality(gpsPoints)
  const speedProfile = assessSpeedProfile(gpsPoints)
  const routeConsistency = assessRouteConsistency(gpsPoints, courseRoute)
  const duration = assessDuration(session)

  // 총 거리 계산
  let totalDistance = 0
  for (let i = 1; i < gpsPoints.length; i++) {
    totalDistance += calculateDistance(gpsPoints[i - 1], gpsPoints[i])
  }

  // 종합 점수 계산 (가중 평균)
  const weights = {
    dataQuality: 0.3,
    speedProfile: 0.25,
    routeConsistency: 0.3,
    duration: 0.15
  }

  const overallScore = 
    dataQuality.score * weights.dataQuality +
    speedProfile.score * weights.speedProfile +
    routeConsistency.score * weights.routeConsistency +
    duration.score * weights.duration

  // 모든 이슈 수집
  const allIssues = [
    ...dataQuality.issues,
    ...speedProfile.issues,
    ...routeConsistency.issues,
    ...duration.issues
  ]

  // 추천 결정
  let recommendation: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'SCREENSHOT_REQUIRED'
  
  if (overallScore >= 0.8 && allIssues.length <= 1) {
    recommendation = 'AUTO_APPROVE'
  } else if (overallScore >= 0.6 && allIssues.length <= 3) {
    recommendation = 'MANUAL_REVIEW'
  } else {
    recommendation = 'SCREENSHOT_REQUIRED'
  }

  return {
    isValid: overallScore >= 0.6,
    confidence: overallScore,
    issues: allIssues,
    metrics: {
      dataQuality: dataQuality.score,
      routeConsistency: routeConsistency.score,
      speedProfile: speedProfile.score,
      duration: duration.score,
      distance: totalDistance / 1000 // km로 변환
    },
    recommendation
  }
}
