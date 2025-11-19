// src/utils/navigationEngine.ts

/**
 * 네비게이션 엔진 - 1인칭 추적 모드용
 * 카카오맵의 자전거/도보 네비게이션과 유사한 기능 구현
 *
 * @description 순수 TypeScript 유틸리티 레이어 (KakaoMap SDK 독립적)
 * @version 1.1.0
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
  progressRatio: number // 전체 코스 진행률 (0~1)
  cumulativeDist: number // 누적 거리 (m)
  distanceToSegment: number // 현재 위치에서 가장 가까운 코스 선분까지의 거리 (m)
  segmentIndex: number // 현재 위치와 가장 가까운 선분의 인덱스
  isOffRoute: boolean // 코스 이탈 여부 (기본 30m 기준)
  totalDistance: number // 전체 코스 거리 (m)
  remainingDistance: number // 남은 거리 (m)
  nextWaypoint?: RoutePoint // 다음 웨이포인트 (선택적)
  estimatedTimeToFinish?: number // 완주 예상 시간 (초, 선택적)
}

export const NAVIGATION_CONSTANTS = {
  OFF_ROUTE_THRESHOLD: 30, // 코스 이탈 판정 거리 (미터)
  EARTH_RADIUS: 6371000, // 지구 반지름 (미터)
  MIN_SPEED_FOR_BEARING: 0.5, // 방향 계산 최소 속도 (m/s)
  BEARING_SMOOTHING_WINDOW: 3 // 방향 평활화 윈도우 크기
} as const

/**
 * 내부용: 좌표 유효성 검증
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
 * Haversine 공식을 사용한 두 좌표 간 거리 계산
 * @param point1 첫 번째 좌표
 * @param point2 두 번째 좌표
 * @returns 거리 (미터 단위)
 */
export function haversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  if (!isValidCoordinate(point1) || !isValidCoordinate(point2)) {
    void (DEBUG && console.warn('[NavigationEngine] 잘못된 좌표:', { point1, point2 }))
    return 0
  }

  if (point1.lat === point2.lat && point1.lng === point2.lng) {
    return 0
  }

  try {
    const R = NAVIGATION_CONSTANTS.EARTH_RADIUS
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180
    const dLng = ((point2.lng - point1.lng) * Math.PI) / 180

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const clampedA = Math.max(0, Math.min(1, a))
    const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA))
    const distance = R * c

    return isFinite(distance) ? distance : 0
  } catch (error) {
    void (DEBUG && console.error('[NavigationEngine] haversineDistance 계산 오류:', error))
    return 0
  }
}

/**
 * 점을 선분에 투영하여 가장 가까운 지점과 거리를 계산
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
  if (
    !isValidCoordinate(segmentStart) ||
    !isValidCoordinate(segmentEnd) ||
    !isValidCoordinate(point)
  ) {
    void (DEBUG && console.warn('[NavigationEngine] projectPointOnSegment: 잘못된 좌표 입력'))
    return {
      projectedPoint: segmentStart,
      distanceToSegment: Infinity,
      t: 0,
      segmentLength: 0
    }
  }

  const segmentLength = haversineDistance(segmentStart, segmentEnd)

  if (segmentLength < 1e-6) {
    return {
      projectedPoint: { ...segmentStart },
      distanceToSegment: haversineDistance(point, segmentStart),
      t: 0,
      segmentLength: 0
    }
  }

  const toMeters = (lat: number, lng: number) => ({
    x: lng * 111320 * Math.cos((lat * Math.PI) / 180),
    y: lat * 111320
  })

  const startMeters = toMeters(segmentStart.lat, segmentStart.lng)
  const endMeters = toMeters(segmentEnd.lat, segmentEnd.lng)
  const pointMeters = toMeters(point.lat, point.lng)

  const segmentVector = {
    x: endMeters.x - startMeters.x,
    y: endMeters.y - startMeters.y
  }

  const pointVector = {
    x: pointMeters.x - startMeters.x,
    y: pointMeters.y - startMeters.y
  }

  const dotProduct = pointVector.x * segmentVector.x + pointVector.y * segmentVector.y
  const segmentLengthSquared =
    segmentVector.x * segmentVector.x + segmentVector.y * segmentVector.y

  let t = 0
  if (segmentLengthSquared > 1e-10) {
    t = dotProduct / segmentLengthSquared
  }
  t = Math.max(0, Math.min(1, t))

  const projectedMeters = {
    x: startMeters.x + t * segmentVector.x,
    y: startMeters.y + t * segmentVector.y
  }

  const cosLat = Math.cos((segmentStart.lat * Math.PI) / 180)
  const projectedPoint = {
    lat: projectedMeters.y / 111320,
    lng:
      Math.abs(cosLat) > 1e-10
        ? projectedMeters.x / (111320 * cosLat)
        : segmentStart.lng
  }

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
 * 내부용 빈 진행률 객체 생성 (에러 상황용)
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
 */
export function calculateRouteDistance(routePoints: RoutePoint[]): number {
  if (!Array.isArray(routePoints) || routePoints.length < 2) {
    return 0
  }

  let totalDistance = 0
  for (let i = 1; i < routePoints.length; i++) {
    totalDistance += haversineDistance(routePoints[i - 1], routePoints[i])
  }

  return isFinite(totalDistance) ? totalDistance : 0
}

/**
 * 코스 사전 계산 모델 (반복 호출 최적화용)
 */
export interface RouteModel {
  points: RoutePoint[]
  segmentDistances: number[]
  cumulativeDistances: number[] // 각 포인트까지 누적 거리
  totalDistance: number
}

/**
 * RouteModel 생성 (한 번만 계산해서 재사용)
 */
export function buildRouteModel(routePoints: RoutePoint[]): RouteModel | null {
  if (!Array.isArray(routePoints) || routePoints.length < 2) {
    void (DEBUG && console.warn('[NavigationEngine] buildRouteModel: 잘못된 경로 데이터'))
    return null
  }

  const segmentDistances: number[] = []
  const cumulativeDistances: number[] = [0]
  let totalDistance = 0

  try {
    for (let i = 0; i < routePoints.length - 1; i++) {
      const dist = haversineDistance(routePoints[i], routePoints[i + 1])
      const validDist = isFinite(dist) ? dist : 0
      segmentDistances.push(validDist)
      totalDistance += validDist
      cumulativeDistances.push(totalDistance)
    }
  } catch (error) {
    void (DEBUG && console.error('[NavigationEngine] buildRouteModel 거리 계산 오류:', error))
    return null
  }

  if (totalDistance <= 0 || !isFinite(totalDistance)) {
    void (DEBUG && console.warn('[NavigationEngine] buildRouteModel: 비정상적인 총 거리', {
      totalDistance
    }))
    return null
  }

  return {
    points: routePoints,
    segmentDistances,
    cumulativeDistances,
    totalDistance
  }
}

/**
 * 코스 상의 진행률과 관련 정보를 계산 (RouteModel 기반, 추천)
 * @param routeModel 사전 계산된 코스 모델
 * @param currentPosition 현재 위치
 * @param offRouteThreshold 코스 이탈 판정 거리 (미터, 기본값: 30m)
 * @param currentSpeedMps 현재 속도 (m/s, ETA 계산용 선택값)
 */
export function getProgressOnRouteWithModel(
  routeModel: RouteModel,
  currentPosition: { lat: number; lng: number },
  offRouteThreshold: number = NAVIGATION_CONSTANTS.OFF_ROUTE_THRESHOLD,
  currentSpeedMps?: number
): NavigationProgress {
  if (!routeModel || !Array.isArray(routeModel.points) || routeModel.points.length < 2) {
    void (DEBUG && console.warn('[NavigationEngine] getProgressOnRouteWithModel: 잘못된 routeModel'))
    return createEmptyProgress()
  }

  if (!isValidCoordinate(currentPosition)) {
    void (DEBUG && console.warn('[NavigationEngine] getProgressOnRouteWithModel: 잘못된 현재 위치'))
    return createEmptyProgress(routeModel.totalDistance)
  }

  const { points, segmentDistances, totalDistance } = routeModel

  let closestSegmentIndex = 0
  let minDistance = Infinity
  let bestProjection: ReturnType<typeof projectPointOnSegment> | null = null

  try {
    for (let i = 0; i < points.length - 1; i++) {
      const projection = projectPointOnSegment(points[i], points[i + 1], currentPosition)

      if (
        isFinite(projection.distanceToSegment) &&
        projection.distanceToSegment < minDistance
      ) {
        minDistance = projection.distanceToSegment
        closestSegmentIndex = i
        bestProjection = projection
      }
    }
  } catch (error) {
    void (DEBUG &&
      console.error('[NavigationEngine] getProgressOnRouteWithModel 투영 계산 오류:', error))
    return createEmptyProgress(totalDistance)
  }

  if (!bestProjection) {
    void (DEBUG &&
      console.warn('[NavigationEngine] getProgressOnRouteWithModel: 투영 계산 실패'))
    return createEmptyProgress(totalDistance)
  }

  let cumulativeDist = 0
  try {
    for (let i = 0; i < closestSegmentIndex; i++) {
      cumulativeDist += segmentDistances[i]
    }
    const segmentProgress =
      bestProjection.t * (segmentDistances[closestSegmentIndex] ?? 0)
    cumulativeDist += isFinite(segmentProgress) ? segmentProgress : 0
  } catch (error) {
    void (DEBUG &&
      console.error('[NavigationEngine] getProgressOnRouteWithModel 누적 거리 오류:', error))
    cumulativeDist = 0
  }

  cumulativeDist = Math.max(0, Math.min(totalDistance, cumulativeDist))

  const progressRatio = totalDistance > 0 ? cumulativeDist / totalDistance : 0
  const remainingDistance = Math.max(0, totalDistance - cumulativeDist)
  const isOffRoute = bestProjection.distanceToSegment > offRouteThreshold

  const nextWaypoint =
    closestSegmentIndex < points.length - 1 ? points[closestSegmentIndex + 1] : undefined

  let estimatedTimeToFinish: number | undefined
  if (
    typeof currentSpeedMps === 'number' &&
    isFinite(currentSpeedMps) &&
    currentSpeedMps > 0
  ) {
    estimatedTimeToFinish = remainingDistance / currentSpeedMps
  }

  const result: NavigationProgress = {
    progressRatio: Math.max(
      0,
      Math.min(1, isFinite(progressRatio) ? progressRatio : 0)
    ),
    cumulativeDist: Math.max(0, isFinite(cumulativeDist) ? cumulativeDist : 0),
    distanceToSegment: isFinite(bestProjection.distanceToSegment)
      ? bestProjection.distanceToSegment
      : Infinity,
    segmentIndex: closestSegmentIndex,
    isOffRoute,
    totalDistance: Math.max(0, isFinite(totalDistance) ? totalDistance : 0),
    remainingDistance: Math.max(
      0,
      isFinite(remainingDistance) ? remainingDistance : 0
    ),
    nextWaypoint,
    estimatedTimeToFinish
  }

  if (result.cumulativeDist > result.totalDistance) {
    void (DEBUG && console.warn('[NavigationEngine] 비정상적인 누적 거리:', result))
    result.cumulativeDist = result.totalDistance
    result.remainingDistance = 0
    result.progressRatio = 1
  }

  void (DEBUG &&
    console.log('[NavigationEngine] 진행률 계산 (with model):', {
      progressRatio: result.progressRatio.toFixed(3),
      cumulativeDist: result.cumulativeDist.toFixed(1),
      remainingDistance: result.remainingDistance.toFixed(1),
      isOffRoute: result.isOffRoute,
      segmentIndex: result.segmentIndex,
      eta: result.estimatedTimeToFinish
    }))

  return result
}

/**
 * 기존 시그니처 유지용: RoutePoint 배열 직접 입력 버전
 * @param routePoints 코스 경로 포인트 배열
 * @param currentPosition 현재 위치
 * @param offRouteThreshold 코스 이탈 판정 거리 (미터, 기본값: 30m)
 * @param currentSpeedMps 현재 속도 (m/s, ETA 계산용 선택값)
 */
export function getProgressOnRoute(
  routePoints: RoutePoint[],
  currentPosition: { lat: number; lng: number },
  offRouteThreshold: number = NAVIGATION_CONSTANTS.OFF_ROUTE_THRESHOLD,
  currentSpeedMps?: number
): NavigationProgress {
  const model = buildRouteModel(routePoints)
  if (!model) {
    return createEmptyProgress()
  }
  return getProgressOnRouteWithModel(
    model,
    currentPosition,
    offRouteThreshold,
    currentSpeedMps
  )
}

/**
 * 두 점 사이의 방향각 계산 (북쪽 기준, 도 단위)
 * @returns 방향각 (0~360도). from == to인 경우 0 반환
 */
export function calculateBearing(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  if (!isValidCoordinate(from) || !isValidCoordinate(to)) {
    void (DEBUG && console.warn('[NavigationEngine] calculateBearing: 잘못된 좌표'))
    return 0
  }

  if (from.lat === to.lat && from.lng === to.lng) {
    return 0
  }

  try {
    const dLng = ((to.lng - from.lng) * Math.PI) / 180
    const lat1 = (from.lat * Math.PI) / 180
    const lat2 = (to.lat * Math.PI) / 180

    const y = Math.sin(dLng) * Math.cos(lat2)
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

    let bearing = (Math.atan2(y, x) * 180) / Math.PI
    bearing = (bearing + 360) % 360

    return isFinite(bearing) ? bearing : 0
  } catch (error) {
    void (DEBUG && console.error('[NavigationEngine] calculateBearing 계산 오류:', error))
    return 0
  }
}

/**
 * 부드러운 방향각 계산 (여러 포인트의 평균, 0/360 경계 보정 포함)
 * @param positions 위치 히스토리 배열
 * @param windowSize 평활화 윈도우 크기
 */
export function calculateSmoothBearing(
  positions: { lat: number; lng: number; timestamp?: number }[],
  windowSize: number = NAVIGATION_CONSTANTS.BEARING_SMOOTHING_WINDOW
): number {
  if (!Array.isArray(positions) || positions.length < 2) return 0

  const recentPositions = positions.slice(-windowSize)
  if (recentPositions.length < 2) return 0

  let sinSum = 0
  let cosSum = 0
  let count = 0

  for (let i = 1; i < recentPositions.length; i++) {
    const bearing = calculateBearing(recentPositions[i - 1], recentPositions[i])
    const rad = (bearing * Math.PI) / 180
    sinSum += Math.sin(rad)
    cosSum += Math.cos(rad)
    count++
  }

  if (count === 0) return 0

  const avgRad = Math.atan2(sinSum / count, cosSum / count)
  let avgDeg = (avgRad * 180) / Math.PI
  if (avgDeg < 0) avgDeg += 360

  return isFinite(avgDeg) ? avgDeg : 0
}
