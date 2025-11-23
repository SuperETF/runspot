/**
 * 런닝 네비게이션을 위한 핵심 계산 유틸리티
 * "사람이 이 라인을 보면서 실제로 뛰기 좋게" 만드는 것이 목표
 */

export interface GPSPoint {
  lat: number
  lng: number
}

export interface RunningProgress {
  // 기본 진행률 정보
  progressPercent: number        // 0-100%
  passedDistance: number         // 지나온 거리 (미터)
  remainingDistance: number      // 남은 거리 (미터)
  totalDistance: number          // 전체 거리 (미터)
  
  // 현재 상태
  isOffCourse: boolean          // 코스 이탈 여부
  distanceToRoute: number       // 코스까지의 거리 (미터)
  currentSegmentIndex: number   // 현재 구간 인덱스
  
  // 예상 시간 (페이스 기반)
  estimatedRemainingTime: number // 남은 예상 시간 (분)
  averagePace?: number          // 평균 페이스 (분/km)
}

export interface NavigationDirection {
  type: 'straight' | 'left' | 'right' | 'sharp_left' | 'sharp_right' | 'u_turn'
  angle: number                 // 회전 각도 (-180 ~ 180)
  distance: number             // 다음 턴까지 거리 (미터)
  description: string          // "50m 후 우회전"
}

export interface CourseSegment {
  passed: GPSPoint[]           // 지나온 구간
  upcoming: GPSPoint[]         // 앞으로 갈 구간
  nextTurn?: NavigationDirection // 다음 턴 정보
}

/**
 * Haversine 공식으로 두 GPS 포인트 간 거리 계산 (미터)
 */
export function calculateDistance(point1: GPSPoint, point2: GPSPoint): number {
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

/**
 * 두 점 사이의 방향각 계산 (도 단위, 북쪽 기준)
 */
export function calculateBearing(from: GPSPoint, to: GPSPoint): number {
  const lat1 = from.lat * Math.PI / 180
  const lat2 = to.lat * Math.PI / 180
  const deltaLng = (to.lng - from.lng) * Math.PI / 180

  const y = Math.sin(deltaLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

  const bearing = Math.atan2(y, x) * 180 / Math.PI
  return (bearing + 360) % 360 // 0-360도로 정규화
}

/**
 * 점에서 선분까지의 최단 거리 계산
 * @param point 현재 위치
 * @param lineStart 선분 시작점
 * @param lineEnd 선분 끝점
 * @returns 최단 거리 (미터)
 */
export function distanceToLineSegment(point: GPSPoint, lineStart: GPSPoint, lineEnd: GPSPoint): number {
  const A = point.lat - lineStart.lat
  const B = point.lng - lineStart.lng
  const C = lineEnd.lat - lineStart.lat
  const D = lineEnd.lng - lineStart.lng

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  
  if (lenSq === 0) {
    // 선분의 시작점과 끝점이 같은 경우
    return calculateDistance(point, lineStart)
  }

  let param = dot / lenSq

  let closestPoint: GPSPoint
  if (param < 0) {
    closestPoint = lineStart
  } else if (param > 1) {
    closestPoint = lineEnd
  } else {
    closestPoint = {
      lat: lineStart.lat + param * C,
      lng: lineStart.lng + param * D
    }
  }

  return calculateDistance(point, closestPoint)
}

/**
 * GPX 경로에서 현재 위치에 가장 가까운 지점 찾기
 */
export function findClosestPointOnRoute(currentLocation: GPSPoint, route: GPSPoint[]): {
  closestPoint: GPSPoint
  segmentIndex: number
  distanceToRoute: number
  progressDistance: number
} {
  let minDistance = Infinity
  let closestPoint = route[0]
  let segmentIndex = 0
  let progressDistance = 0

  // 각 선분에 대해 최단 거리 계산
  for (let i = 0; i < route.length - 1; i++) {
    const distance = distanceToLineSegment(currentLocation, route[i], route[i + 1])
    
    if (distance < minDistance) {
      minDistance = distance
      segmentIndex = i
      
      // 현재 선분에서의 투영점 계산
      const A = currentLocation.lat - route[i].lat
      const B = currentLocation.lng - route[i].lng
      const C = route[i + 1].lat - route[i].lat
      const D = route[i + 1].lng - route[i].lng

      const dot = A * C + B * D
      const lenSq = C * C + D * D
      const param = Math.max(0, Math.min(1, dot / lenSq))

      closestPoint = {
        lat: route[i].lat + param * C,
        lng: route[i].lng + param * D
      }

      // 시작점부터 투영점까지의 거리 계산
      progressDistance = 0
      for (let j = 0; j < i; j++) {
        progressDistance += calculateDistance(route[j], route[j + 1])
      }
      progressDistance += calculateDistance(route[i], closestPoint)
    }
  }

  return {
    closestPoint,
    segmentIndex,
    distanceToRoute: minDistance,
    progressDistance
  }
}

/**
 * 런닝 진행률 계산
 */
export function calculateRunningProgress(
  currentLocation: GPSPoint, 
  route: GPSPoint[],
  averagePaceMinPerKm?: number
): RunningProgress {
  if (route.length < 2) {
    throw new Error('경로에 최소 2개의 포인트가 필요합니다')
  }

  // 전체 경로 거리 계산
  let totalDistance = 0
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += calculateDistance(route[i], route[i + 1])
  }

  // 현재 위치에서 가장 가까운 경로상의 점 찾기
  const closest = findClosestPointOnRoute(currentLocation, route)
  
  const progressPercent = (closest.progressDistance / totalDistance) * 100
  const remainingDistance = totalDistance - closest.progressDistance
  
  // 코스 이탈 판정 (30m 기준)
  const isOffCourse = closest.distanceToRoute > 30

  // 예상 남은 시간 계산 (페이스 기반)
  let estimatedRemainingTime = 0
  if (averagePaceMinPerKm && remainingDistance > 0) {
    estimatedRemainingTime = (remainingDistance / 1000) * averagePaceMinPerKm
  }

  return {
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
    passedDistance: closest.progressDistance,
    remainingDistance,
    totalDistance,
    isOffCourse,
    distanceToRoute: closest.distanceToRoute,
    currentSegmentIndex: closest.segmentIndex,
    estimatedRemainingTime,
    averagePace: averagePaceMinPerKm
  }
}

/**
 * 코스를 지나온 구간과 앞으로 갈 구간으로 분리
 */
export function splitCourseByProgress(
  route: GPSPoint[], 
  progress: RunningProgress
): CourseSegment {
  const segmentIndex = progress.currentSegmentIndex
  
  // 지나온 구간 (시작점부터 현재 세그먼트까지)
  const passed = route.slice(0, segmentIndex + 1)
  
  // 앞으로 갈 구간 (현재 세그먼트부터 끝점까지)
  const upcoming = route.slice(segmentIndex)

  return {
    passed,
    upcoming
  }
}

/**
 * 다음 턴 방향 계산
 */
export function calculateNextTurn(
  route: GPSPoint[], 
  currentSegmentIndex: number,
  lookAheadDistance: number = 100 // 100m 앞까지 확인
): NavigationDirection | null {
  if (currentSegmentIndex >= route.length - 2) {
    return null // 경로 끝에 도달
  }

  // 현재 방향 계산
  const currentBearing = calculateBearing(route[currentSegmentIndex], route[currentSegmentIndex + 1])
  
  // 앞으로 100m 내에서 방향 변화가 큰 지점 찾기
  let accumulatedDistance = 0
  let turnPoint = -1
  
  for (let i = currentSegmentIndex + 1; i < route.length - 1; i++) {
    accumulatedDistance += calculateDistance(route[i], route[i + 1])
    
    if (accumulatedDistance > lookAheadDistance) {
      break
    }
    
    const nextBearing = calculateBearing(route[i], route[i + 1])
    let angleDiff = nextBearing - currentBearing
    
    // 각도 차이를 -180 ~ 180 범위로 정규화
    if (angleDiff > 180) angleDiff -= 360
    if (angleDiff < -180) angleDiff += 360
    
    // 30도 이상 방향 변화가 있으면 턴으로 판정
    if (Math.abs(angleDiff) > 30) {
      turnPoint = i
      break
    }
  }
  
  if (turnPoint === -1) {
    return {
      type: 'straight',
      angle: 0,
      distance: lookAheadDistance,
      description: '직진'
    }
  }
  
  // 턴까지의 거리 계산
  let distanceToTurn = 0
  for (let i = currentSegmentIndex; i < turnPoint; i++) {
    distanceToTurn += calculateDistance(route[i], route[i + 1])
  }
  
  // 턴 방향 계산
  const turnBearing = calculateBearing(route[turnPoint], route[turnPoint + 1])
  let angle = turnBearing - currentBearing
  
  if (angle > 180) angle -= 360
  if (angle < -180) angle += 360
  
  let type: NavigationDirection['type']
  let description: string
  
  if (Math.abs(angle) < 30) {
    type = 'straight'
    description = '직진'
  } else if (angle > 0) {
    if (angle > 135) {
      type = 'u_turn'
      description = `${Math.round(distanceToTurn)}m 후 유턴`
    } else if (angle > 90) {
      type = 'sharp_right'
      description = `${Math.round(distanceToTurn)}m 후 급우회전`
    } else {
      type = 'right'
      description = `${Math.round(distanceToTurn)}m 후 우회전`
    }
  } else {
    if (angle < -135) {
      type = 'u_turn'
      description = `${Math.round(distanceToTurn)}m 후 유턴`
    } else if (angle < -90) {
      type = 'sharp_left'
      description = `${Math.round(distanceToTurn)}m 후 급좌회전`
    } else {
      type = 'left'
      description = `${Math.round(distanceToTurn)}m 후 좌회전`
    }
  }
  
  return {
    type,
    angle,
    distance: distanceToTurn,
    description
  }
}

/**
 * 완주 인증 조건 체크
 */
export interface CompletionCriteria {
  minProgressPercent: number    // 최소 진행률 (기본: 90%)
  maxOffCourseTime: number     // 최대 이탈 시간 (초, 기본: 300초 = 5분)
  minTotalTime: number         // 최소 소요 시간 (초, 기본: 600초 = 10분)
  maxTotalTime: number         // 최대 소요 시간 (초, 기본: 7200초 = 2시간)
}

export interface RunningRecord {
  timestamp: number
  location: GPSPoint
  progress: RunningProgress
  isOffCourse: boolean
}

export function checkCompletion(
  records: RunningRecord[],
  criteria: CompletionCriteria = {
    minProgressPercent: 90,
    maxOffCourseTime: 300,
    minTotalTime: 600,
    maxTotalTime: 7200
  }
): {
  isCompleted: boolean
  reason?: string
  stats: {
    maxProgress: number
    totalTime: number
    offCourseTime: number
    onCoursePercent: number
  }
} {
  if (records.length === 0) {
    return {
      isCompleted: false,
      reason: '기록이 없습니다',
      stats: { maxProgress: 0, totalTime: 0, offCourseTime: 0, onCoursePercent: 0 }
    }
  }

  const startTime = records[0].timestamp
  const endTime = records[records.length - 1].timestamp
  const totalTime = (endTime - startTime) / 1000 // 초 단위

  // 최대 진행률 계산
  const maxProgress = Math.max(...records.map(r => r.progress.progressPercent))

  // 코스 이탈 시간 계산
  let offCourseTime = 0
  for (let i = 1; i < records.length; i++) {
    if (records[i].isOffCourse) {
      const timeDiff = (records[i].timestamp - records[i - 1].timestamp) / 1000
      offCourseTime += timeDiff
    }
  }

  const onCoursePercent = ((totalTime - offCourseTime) / totalTime) * 100

  const stats = {
    maxProgress,
    totalTime,
    offCourseTime,
    onCoursePercent
  }

  // 완주 조건 체크
  if (maxProgress < criteria.minProgressPercent) {
    return {
      isCompleted: false,
      reason: `진행률 부족 (${maxProgress.toFixed(1)}% < ${criteria.minProgressPercent}%)`,
      stats
    }
  }

  if (totalTime < criteria.minTotalTime) {
    return {
      isCompleted: false,
      reason: `소요 시간이 너무 짧음 (${Math.round(totalTime)}초 < ${criteria.minTotalTime}초)`,
      stats
    }
  }

  if (totalTime > criteria.maxTotalTime) {
    return {
      isCompleted: false,
      reason: `소요 시간이 너무 김 (${Math.round(totalTime)}초 > ${criteria.maxTotalTime}초)`,
      stats
    }
  }

  if (offCourseTime > criteria.maxOffCourseTime) {
    return {
      isCompleted: false,
      reason: `코스 이탈 시간 초과 (${Math.round(offCourseTime)}초 > ${criteria.maxOffCourseTime}초)`,
      stats
    }
  }

  return {
    isCompleted: true,
    stats
  }
}
