'use client'

export interface GPSPoint {
  lat: number
  lng: number
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

// GPX 경로에서 주요 경유지 추출
export function extractWaypoints(gpsRoute: GPSPoint[], maxWaypoints: number = 8): GPSPoint[] {
  if (gpsRoute.length <= 2) {
    return gpsRoute
  }

  // 시작점과 끝점은 항상 포함
  const waypoints: GPSPoint[] = [gpsRoute[0]]
  
  if (maxWaypoints <= 2) {
    waypoints.push(gpsRoute[gpsRoute.length - 1])
    return waypoints
  }

  // 경로를 균등하게 나누어 경유지 선택
  const totalPoints = gpsRoute.length
  const waypointInterval = Math.floor(totalPoints / (maxWaypoints - 1))
  
  for (let i = waypointInterval; i < totalPoints - 1; i += waypointInterval) {
    waypoints.push(gpsRoute[i])
  }
  
  // 끝점 추가
  waypoints.push(gpsRoute[gpsRoute.length - 1])
  
  return waypoints
}

// 더 정교한 경유지 최적화 (중요한 방향 전환점 우선)
export function optimizeWaypoints(gpsRoute: GPSPoint[], maxWaypoints: number = 8): GPSPoint[] {
  if (gpsRoute.length <= maxWaypoints) {
    return gpsRoute
  }

  const waypoints: GPSPoint[] = [gpsRoute[0]] // 시작점
  const importanceScores: { index: number; score: number }[] = []

  // 각 포인트의 중요도 계산
  for (let i = 1; i < gpsRoute.length - 1; i++) {
    const prev = gpsRoute[i - 1]
    const current = gpsRoute[i]
    const next = gpsRoute[i + 1]
    
    // 방향 변화 계산 (각도 변화가 클수록 중요한 경유지)
    const angle1 = Math.atan2(current.lat - prev.lat, current.lng - prev.lng)
    const angle2 = Math.atan2(next.lat - current.lat, next.lng - current.lng)
    let angleDiff = Math.abs(angle2 - angle1)
    
    // 각도 차이를 0-π 범위로 정규화
    if (angleDiff > Math.PI) {
      angleDiff = 2 * Math.PI - angleDiff
    }
    
    // 거리 기반 가중치 (너무 가까운 포인트는 제외)
    const distanceFromPrev = calculateDistance(prev, current)
    const distanceToNext = calculateDistance(current, next)
    const minDistance = Math.min(distanceFromPrev, distanceToNext)
    
    // 중요도 점수 계산 (방향 변화 + 거리 가중치)
    const score = angleDiff * Math.min(minDistance / 100, 1) // 100m 이상일 때 최대 가중치
    
    importanceScores.push({ index: i, score })
  }

  // 중요도 순으로 정렬
  importanceScores.sort((a, b) => b.score - a.score)
  
  // 상위 중요 포인트들을 경유지로 선택
  const selectedIndices = importanceScores
    .slice(0, maxWaypoints - 2) // 시작점, 끝점 제외
    .map(item => item.index)
    .sort((a, b) => a - b) // 경로 순서대로 정렬
  
  // 선택된 경유지 추가
  selectedIndices.forEach(index => {
    waypoints.push(gpsRoute[index])
  })
  
  // 끝점 추가
  waypoints.push(gpsRoute[gpsRoute.length - 1])
  
  return waypoints
}

// 카카오맵 자전거 네비게이션 URL 생성
export function generateKakaoBicycleNavUrl(
  currentLocation: GPSPoint,
  gpsRoute: GPSPoint[],
  useOptimization: boolean = true
): string {
  // 경유지 최적화
  const waypoints = useOptimization 
    ? optimizeWaypoints(gpsRoute, 8) // 카카오맵 최대 경유지 제한
    : extractWaypoints(gpsRoute, 8)
  
  console.log('🗺️ 경유지 최적화 결과:', {
    원본포인트: gpsRoute.length,
    최적화포인트: waypoints.length,
    경유지: waypoints
  })

  const startPoint = `${currentLocation.lat},${currentLocation.lng}`
  const endPoint = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`
  
  // 중간 경유지들 (시작점과 끝점 제외)
  const viaPoints = waypoints.slice(1, -1)
    .map(point => `${point.lat},${point.lng}`)
    .join('|')
  
  // 카카오맵 자전거 네비게이션 URL 구성
  let navUrl = `kakaomap://route?sp=${startPoint}&ep=${endPoint}&by=BICYCLE`
  
  if (viaPoints) {
    navUrl += `&via=${viaPoints}`
  }
  
  return navUrl
}

// 웹 fallback URL 생성
export function generateKakaoWebFallbackUrl(gpsRoute: GPSPoint[]): string {
  const endPoint = gpsRoute[gpsRoute.length - 1]
  return `https://map.kakao.com/link/to/런닝 도착점,${endPoint.lat},${endPoint.lng}`
}

// 경로 정보 요약
export function getRouteInfo(gpsRoute: GPSPoint[]): {
  totalDistance: number
  estimatedDuration: number
  waypointCount: number
} {
  let totalDistance = 0
  
  for (let i = 1; i < gpsRoute.length; i++) {
    totalDistance += calculateDistance(gpsRoute[i - 1], gpsRoute[i])
  }
  
  // 자전거 평균 속도 15km/h로 예상 시간 계산
  const estimatedDuration = (totalDistance / 1000) / 15 * 60 // 분 단위
  
  return {
    totalDistance: Math.round(totalDistance),
    estimatedDuration: Math.round(estimatedDuration),
    waypointCount: gpsRoute.length
  }
}
