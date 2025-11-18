/**
 * 네비게이션 엔진 - 1인칭 추적 모드용
 * 카카오맵의 자전거/도보 네비게이션과 유사한 기능 구현
 * 
 * @description 순수 TypeScript 유틸리티 레이어 (KakaoMap SDK 독립적)
 * @version 1.0.0
 */

// 디버깅 플래그
const DEBUG = process.env.NODE_ENV === 'development'

export interface RoutePoint {
  lat: number
  lng: number
  order?: number
  elevation?: number // 고도 정보 (선택적)
  timestamp?: number // 타임스탬프 (선택적)
}

export interface NavigationProgress {
  progressRatio: number      // 전체 코스 진행률 (0~1)
  cumulativeDist: number     // 누적 거리 (m)
  distanceToSegment: number  // 현재 위치에서 가장 가까운 코스 선분까지의 거리 (m)
  segmentIndex: number       // 현재 위치와 가장 가까운 선분의 인덱스
  isOffRoute: boolean        // 코스 이탈 여부 (기본 30m 기준)
  totalDistance: number      // 전체 코스 거리 (m)
  remainingDistance: number  // 남은 거리 (m)
  nextWaypoint?: RoutePoint  // 다음 웨이포인트 (선택적)
  estimatedTimeToFinish?: number // 완주 예상 시간 (초, 선택적)
}

// 상수 정의
export const NAVIGATION_CONSTANTS = {
  OFF_ROUTE_THRESHOLD: 30, // 코스 이탈 판정 거리 (미터)
  EARTH_RADIUS: 6371000,   // 지구 반지름 (미터)
  MIN_SPEED_FOR_BEARING: 0.5, // 방향 계산 최소 속도 (m/s)
  BEARING_SMOOTHING_WINDOW: 3, // 방향 평활화 윈도우 크기
} as const

/**
 * Haversine 공식을 사용한 두 좌표 간 거리 계산
 * @param point1 첫 번째 좌표
 * @param point2 두 번째 좌표
 * @returns 거리 (미터 단위)
 * @description 지구 표면의 공간 거리를 정확하게 계산. NaN/Infinity 방지 로직 포함
 */
export function haversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  // 입력 검증
  if (!isValidCoordinate(point1) || !isValidCoordinate(point2)) {
    void (DEBUG && console.warn('[NavigationEngine] 잘못된 좌표:', { point1, point2 }))
    return 0
  }

  // 동일한 점인 경우 0 반환
  if (point1.lat === point2.lat && point1.lng === point2.lng) {
    return 0
  }

  try {
    const R = NAVIGATION_CONSTANTS.EARTH_RADIUS
    const dLat = (point2.lat - point1.lat) * Math.PI / 180
    const dLng = (point2.lng - point1.lng) * Math.PI / 180
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    // a가 1을 초과하는 경우 방지 (수치 오차)
    const clampedA = Math.max(0, Math.min(1, a))
    const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA))
    const distance = R * c
    
    // NaN/Infinity 방지
    return isFinite(distance) ? distance : 0
  } catch (error) {
    void (DEBUG && console.error('[NavigationEngine] haversineDistance 계산 오류:', error))
    return 0
  }
}

/**
 * 좌표 유효성 검증
 * @param coord 검증할 좌표
 * @returns 유효성 여부
 * @description 위도/경도 범위, NaN/Infinity 검사 포함
 */
function isValidCoordinate(coord: { lat: number; lng: number }): boolean {
  return (
    coord != null &&
    typeof coord.lat === 'number' &&
    typeof coord.lng === 'number' &&
    isFinite(coord.lat) &&
    isFinite(coord.lng) &&
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lng >= -180 &&
    coord.lng <= 180
  )
}

/**
 * 점을 선분에 투영하여 가장 가까운 지점과 거리를 계산
 * 
 * 이 함수는 선분 상의 가장 가까운 점과 그 거리, 그리고 진행 비율(t)을 반환합니다.
 * t=0이면 시작점, t=1이면 끝점에 가장 가까운 상태입니다.
 * 
 * @param segmentStart 선분 시작점
 * @param segmentEnd 선분 끝점
 * @param point 투영할 점
 * @returns 투영 결과 정보
 */
export function projectPointOnSegment(
  segmentStart: { lat: number; lng: number },
  segmentEnd: { lat: number; lng: number },
  point: { lat: number; lng: number }
): {
  projectedPoint: { lat: number; lng: number }
  distanceToSegment: number
  t: number // 선분 상의 비율 (0~1)
  segmentLength: number
} {
  // 입력 검증
  if (!isValidCoordinate(segmentStart) || !isValidCoordinate(segmentEnd) || !isValidCoordinate(point)) {
    void (DEBUG && console.warn('[NavigationEngine] projectPointOnSegment: 잘못된 좌표 입력'))
    return {
      projectedPoint: segmentStart,
      distanceToSegment: Infinity,
      t: 0,
      segmentLength: 0
    }
  }
  const segmentLength = haversineDistance(segmentStart, segmentEnd)
  
  // 선분 길이가 0이거나 매우 작은 경우 (두 점이 거의 같은 경우)
  if (segmentLength < 1e-6) {
    return {
      projectedPoint: { ...segmentStart },
      distanceToSegment: haversineDistance(point, segmentStart),
      t: 0,
      segmentLength: 0
    }
  }

  // 벡터 계산을 위해 좌표를 미터 단위로 근사 변환
  const toMeters = (lat: number, lng: number) => ({
    x: lng * 111320 * Math.cos(lat * Math.PI / 180),
    y: lat * 111320
  })

  const startMeters = toMeters(segmentStart.lat, segmentStart.lng)
  const endMeters = toMeters(segmentEnd.lat, segmentEnd.lng)
  const pointMeters = toMeters(point.lat, point.lng)

  // 선분 벡터
  const segmentVector = {
    x: endMeters.x - startMeters.x,
    y: endMeters.y - startMeters.y
  }

  // 시작점에서 현재 점까지의 벡터
  const pointVector = {
    x: pointMeters.x - startMeters.x,
    y: pointMeters.y - startMeters.y
  }

  // 투영 비율 계산
  const dotProduct = pointVector.x * segmentVector.x + pointVector.y * segmentVector.y
  const segmentLengthSquared = segmentVector.x * segmentVector.x + segmentVector.y * segmentVector.y
  
  // 분모가 0에 가까운 경우 방지
  let t = 0
  if (segmentLengthSquared > 1e-10) {
    t = dotProduct / segmentLengthSquared
  }
  t = Math.max(0, Math.min(1, t)) // 0~1 범위로 제한

  // 투영된 점 계산
  const projectedMeters = {
    x: startMeters.x + t * segmentVector.x,
    y: startMeters.y + t * segmentVector.y
  }

  // 미터를 다시 좌표로 변환 (수치 안정성 개선)
  const cosLat = Math.cos(segmentStart.lat * Math.PI / 180)
  const projectedPoint = {
    lat: projectedMeters.y / 111320,
    lng: Math.abs(cosLat) > 1e-10 
      ? projectedMeters.x / (111320 * cosLat)
      : segmentStart.lng // 극지방 근처에서는 원본 경도 사용
  }

  // 투영된 점이 유효한지 검증
  if (!isValidCoordinate(projectedPoint)) {
    void (DEBUG && console.warn('[NavigationEngine] 투영된 점이 유효하지 않음:', projectedPoint))
    return {
      projectedPoint: { ...segmentStart },
      distanceToSegment: haversineDistance(point, segmentStart),
      t: 0,
      segmentLength
    }
  }

  const distanceToSegment = haversineDistance(point, projectedPoint)

  return {
    projectedPoint,
    distanceToSegment: isFinite(distanceToSegment) ? distanceToSegment : Infinity,
    t,
    segmentLength
  }
}

/**
 * 코스 상의 진행률과 관련 정보를 계산
 * @param routePoints 코스 경로 포인트 배열
 * @param currentPosition 현재 위치
 * @param offRouteThreshold 코스 이탈 판정 거리 (미터, 기본값: 30m)
 * @returns 네비게이션 진행 정보
 */
export function getProgressOnRoute(
  routePoints: RoutePoint[],
  currentPosition: { lat: number; lng: number },
  offRouteThreshold: number = NAVIGATION_CONSTANTS.OFF_ROUTE_THRESHOLD
): NavigationProgress {
  // 입력 검증
  if (!Array.isArray(routePoints) || routePoints.length < 2) {
    void (DEBUG && console.warn('[NavigationEngine] getProgressOnRoute: 잘못된 경로 데이터'))
    return createEmptyProgress()
  }

  if (!isValidCoordinate(currentPosition)) {
    void (DEBUG && console.warn('[NavigationEngine] getProgressOnRoute: 잘못된 현재 위치'))
    return createEmptyProgress()
  }

  // 전체 코스 거리 계산 (try-catch로 예외 처리)
  let totalDistance = 0
  const segmentDistances: number[] = []
  
  try {
    for (let i = 0; i < routePoints.length - 1; i++) {
      const segmentDist = haversineDistance(routePoints[i], routePoints[i + 1])
      // NaN/Infinity 방지
      const validSegmentDist = isFinite(segmentDist) ? segmentDist : 0
      segmentDistances.push(validSegmentDist)
      totalDistance += validSegmentDist
    }
  } catch (error) {
    void (DEBUG && console.error('[NavigationEngine] 코스 거리 계산 오류:', error))
    return createEmptyProgress()
  }
  
  // totalDistance가 0이거나 비정상인 경우
  if (totalDistance <= 0 || !isFinite(totalDistance)) {
    void (DEBUG && console.warn('[NavigationEngine] 비정상적인 코스 거리:', totalDistance))
    return createEmptyProgress()
  }

  // 현재 위치에서 가장 가까운 선분 찾기 (O(N) 알고리즘)
  let closestSegmentIndex = 0
  let minDistance = Infinity
  let bestProjection: ReturnType<typeof projectPointOnSegment> | null = null

  try {
    for (let i = 0; i < routePoints.length - 1; i++) {
      const projection = projectPointOnSegment(
        routePoints[i],
        routePoints[i + 1],
        currentPosition
      )

      // 유효한 투영 결과인지 확인
      if (isFinite(projection.distanceToSegment) && projection.distanceToSegment < minDistance) {
        minDistance = projection.distanceToSegment
        closestSegmentIndex = i
        bestProjection = projection
      }
    }
  } catch (error) {
    void (DEBUG && console.error('[NavigationEngine] 선분 투영 계산 오류:', error))
    return createEmptyProgress(totalDistance)
  }

  if (!bestProjection) {
    void (DEBUG && console.warn('[NavigationEngine] getProgressOnRoute: 투영 계산 실패'))
    return createEmptyProgress(totalDistance)
  }

  // 누적 거리 계산 (시작점부터 투영된 지점까지)
  let cumulativeDist = 0
  try {
    for (let i = 0; i < closestSegmentIndex; i++) {
      cumulativeDist += segmentDistances[i]
    }
    // 현재 선분 내에서의 진행 거리 추가
    const segmentProgress = bestProjection.t * segmentDistances[closestSegmentIndex]
    cumulativeDist += isFinite(segmentProgress) ? segmentProgress : 0
  } catch (error) {
    void (DEBUG && console.error('[NavigationEngine] 누적 거리 계산 오류:', error))
    cumulativeDist = 0
  }

  // 수치 안정성 보장
  cumulativeDist = Math.max(0, Math.min(totalDistance, cumulativeDist))

  // 진행률 계산 (0~1 범위 보장)
  const progressRatio = totalDistance > 0 ? cumulativeDist / totalDistance : 0

  // 남은 거리 계산 (0 이상 보장)
  const remainingDistance = Math.max(0, totalDistance - cumulativeDist)

  // 코스 이탈 여부
  const isOffRoute = bestProjection.distanceToSegment > offRouteThreshold

  // 다음 웨이포인트 계산
  const nextWaypoint = closestSegmentIndex < routePoints.length - 1 
    ? routePoints[closestSegmentIndex + 1] 
    : undefined

  void (DEBUG && console.log('[NavigationEngine] 진행률 계산:', {
    progressRatio: progressRatio.toFixed(3),
    cumulativeDist: cumulativeDist.toFixed(1),
    remainingDistance: remainingDistance.toFixed(1),
    isOffRoute,
    segmentIndex: closestSegmentIndex
  }))

  // 최종 반환 값 검증 및 정규화
  const result: NavigationProgress = {
    progressRatio: Math.max(0, Math.min(1, isFinite(progressRatio) ? progressRatio : 0)),
    cumulativeDist: Math.max(0, isFinite(cumulativeDist) ? cumulativeDist : 0),
    distanceToSegment: isFinite(bestProjection.distanceToSegment) ? bestProjection.distanceToSegment : Infinity,
    segmentIndex: closestSegmentIndex,
    isOffRoute,
    totalDistance: Math.max(0, isFinite(totalDistance) ? totalDistance : 0),
    remainingDistance: Math.max(0, isFinite(remainingDistance) ? remainingDistance : 0),
    nextWaypoint
  }
  
  // 결과 값 상식 검증
  if (result.cumulativeDist > result.totalDistance) {
    void (DEBUG && console.warn('[NavigationEngine] 비정상적인 누적 거리:', result))
    result.cumulativeDist = result.totalDistance
    result.remainingDistance = 0
    result.progressRatio = 1
  }
  
  return result
}

/**
 * 두 점 사이의 방향각 계산 (북쪽 기준, 도 단위)
 * 
 * @param from 시작점
 * @param to 끝점
 * @returns 방향각 (0~360도). from == to인 경우 0 반환
 * @description 지리적 방위각 계산. 북쪽이 0도, 동쪽이 90도
 */
export function calculateBearing(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  // 입력 검증
  if (!isValidCoordinate(from) || !isValidCoordinate(to)) {
    void (DEBUG && console.warn('[NavigationEngine] calculateBearing: 잘못된 좌표'))
    return 0
  }

  // 동일한 점인 경우 0 반환 (방향 계산 불가)
  if (from.lat === to.lat && from.lng === to.lng) {
    return 0
  }

  try {
    const dLng = (to.lng - from.lng) * Math.PI / 180
    const lat1 = from.lat * Math.PI / 180
    const lat2 = to.lat * Math.PI / 180

    const y = Math.sin(dLng) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

    let bearing = Math.atan2(y, x) * 180 / Math.PI
    
    // 0~360도로 정규화
    bearing = (bearing + 360) % 360
    
    // NaN/Infinity 방지
    return isFinite(bearing) ? bearing : 0
  } catch (error) {
    void (DEBUG && console.error('[NavigationEngine] calculateBearing 계산 오류:', error))
    return 0
  }
}

/**
 * 빈 진행률 객체 생성 (에러 상황용)
 * @param totalDistance 전체 거리 (선택적)
 * @returns 빈 NavigationProgress 객체
 */
function createEmptyProgress(totalDistance: number = 0): NavigationProgress {
  return {
    progressRatio: 0,
    cumulativeDist: 0,
    distanceToSegment: Infinity,
    segmentIndex: -1,
    isOffRoute: true,
    totalDistance,
    remainingDistance: totalDistance
  }
}

/**
 * 경로의 총 거리 계산
 * @param routePoints 경로 포인트 배열
 * @returns 총 거리 (미터)
 */
export function calculateRouteDistance(routePoints: RoutePoint[]): number {
  if (!Array.isArray(routePoints) || routePoints.length < 2) {
    return 0
  }

  let totalDistance = 0
  for (let i = 1; i < routePoints.length; i++) {
    totalDistance += haversineDistance(routePoints[i - 1], routePoints[i])
  }

  return totalDistance
}

/**
 * 부드러운 방향각 계산 (여러 포인트의 평균)
 * @param positions 위치 히스토리 배열
 * @param windowSize 평활화 윈도우 크기
 * @returns 평활화된 방향각
 */
export function calculateSmoothBearing(
  positions: { lat: number; lng: number; timestamp?: number }[],
  windowSize: number = NAVIGATION_CONSTANTS.BEARING_SMOOTHING_WINDOW
): number {
  if (positions.length < 2) return 0
  
  const recentPositions = positions.slice(-windowSize)
  if (recentPositions.length < 2) return 0
  
  let totalBearing = 0
  let validBearings = 0
  
  for (let i = 1; i < recentPositions.length; i++) {
    const bearing = calculateBearing(recentPositions[i-1], recentPositions[i])
    totalBearing += bearing
    validBearings++
  }
  
  return validBearings > 0 ? totalBearing / validBearings : 0
}
