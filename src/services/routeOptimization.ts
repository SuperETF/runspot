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

// GPX 경로에서 주요 경유지 추출 (균등 간격)
export function extractWaypoints(gpsRoute: GPSPoint[], maxWaypoints: number = 20): GPSPoint[] {
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

// 모든 GPX 포인트를 경유지로 사용 (거리 기반 필터링)
export function extractAllWaypoints(gpsRoute: GPSPoint[], minDistance: number = 30): GPSPoint[] {
  if (gpsRoute.length <= 2) {
    return gpsRoute
  }

  const waypoints: GPSPoint[] = [gpsRoute[0]] // 시작점
  let lastWaypoint = gpsRoute[0]
  
  // 최소 거리 이상 떨어진 포인트들만 경유지로 추가
  for (let i = 1; i < gpsRoute.length - 1; i++) {
    const currentPoint = gpsRoute[i]
    const distance = calculateDistance(lastWaypoint, currentPoint)
    
    if (distance >= minDistance) {
      waypoints.push(currentPoint)
      lastWaypoint = currentPoint
    }
  }
  
  // 끝점 추가 (마지막 경유지와 충분히 떨어져 있는 경우만)
  const endPoint = gpsRoute[gpsRoute.length - 1]
  const distanceToEnd = calculateDistance(lastWaypoint, endPoint)
  
  if (distanceToEnd >= minDistance / 2) { // 끝점은 절반 거리만 확인
    waypoints.push(endPoint)
  }
  
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

// 카카오맵 자전거 네비게이션 URL 생성 (모든 GPX 포인트 사용)
export function generateKakaoBicycleNavUrl(
  currentLocation: GPSPoint,
  gpsRoute: GPSPoint[],
  useAllPoints: boolean = true
): string {
  let waypoints: GPSPoint[]
  
  if (useAllPoints) {
    // 모든 GPX 포인트를 사용 (30m 간격으로 필터링)
    waypoints = extractAllWaypoints(gpsRoute, 30)
  } else {
    // 기존 최적화 방식 (20개 경유지)
    waypoints = optimizeWaypoints(gpsRoute, 20)
  }
  
  console.log('🗺️ GPX 경로 변환 결과:', {
    원본포인트: gpsRoute.length,
    경유지포인트: waypoints.length,
    사용방식: useAllPoints ? '전체포인트(30m간격)' : '최적화(20개)',
    첫번째경유지: waypoints[0],
    마지막경유지: waypoints[waypoints.length - 1]
  })

  const startPoint = `${currentLocation.lat},${currentLocation.lng}`
  const endPoint = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`
  
  // 모든 중간 경유지들 (시작점과 끝점 제외)
  const viaPoints = waypoints.slice(1, -1)
    .map(point => `${point.lat},${point.lng}`)
    .join('|')
  
  // 카카오맵 자전거 네비게이션 URL 구성
  let navUrl = `kakaomap://route?sp=${startPoint}&ep=${endPoint}&by=BICYCLE`
  
  if (viaPoints) {
    navUrl += `&via=${viaPoints}`
  }
  
  console.log('🚴‍♂️ 카카오맵 URL 길이:', navUrl.length)
  console.log('📍 경유지 개수:', waypoints.length - 2) // 시작점, 끝점 제외
  console.log('🗺️ 생성된 카카오맵 URL:', navUrl)
  console.log('📍 경유지 좌표들:', viaPoints)
  
  // URL이 너무 길면 경유지 수를 줄여서 재시도
  if (navUrl.length > 8000) { // URL 길이 제한 (일반적으로 8KB 이하 권장)
    console.warn('⚠️ URL이 너무 깁니다. 경유지를 줄여서 재생성합니다.')
    
    // 경유지를 절반으로 줄여서 재시도
    const reducedWaypoints = extractWaypoints(gpsRoute, Math.min(10, Math.floor(waypoints.length / 2)))
    const reducedViaPoints = reducedWaypoints.slice(1, -1)
      .map(point => `${point.lat},${point.lng}`)
      .join('|')
    
    navUrl = `kakaomap://route?sp=${startPoint}&ep=${endPoint}&by=BICYCLE`
    if (reducedViaPoints) {
      navUrl += `&via=${reducedViaPoints}`
    }
    
    console.log('🔄 축소된 URL 길이:', navUrl.length)
    console.log('📍 축소된 경유지 개수:', reducedWaypoints.length - 2)
  }
  
  return navUrl
}

// 웹 카카오맵 경유지 포함 URL 생성
export function generateKakaoWebFallbackUrl(gpsRoute: GPSPoint[]): string {
  const endPoint = gpsRoute[gpsRoute.length - 1]
  
  // 웹에서는 경유지를 지원하지 않으므로 기본 도착지만 설정
  return `https://map.kakao.com/link/to/런닝 도착점,${endPoint.lat},${endPoint.lng}`
}

// GPX 파일을 KML 형식으로 변환
export function convertGPXToKML(gpsRoute: GPSPoint[], courseName: string = '런닝 코스'): string {
  const coordinates = gpsRoute.map(point => `${point.lng},${point.lat},0`).join(' ')
  
  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${courseName}</name>
    <description>RunSpot 런닝 코스</description>
    <Style id="lineStyle">
      <LineStyle>
        <color>ff0088ff</color>
        <width>4</width>
      </LineStyle>
    </Style>
    <Placemark>
      <name>${courseName} 경로</name>
      <styleUrl>#lineStyle</styleUrl>
      <LineString>
        <coordinates>${coordinates}</coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>시작점</name>
      <Point>
        <coordinates>${gpsRoute[0].lng},${gpsRoute[0].lat},0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>도착점</name>
      <Point>
        <coordinates>${gpsRoute[gpsRoute.length - 1].lng},${gpsRoute[gpsRoute.length - 1].lat},0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`
  
  return kml
}

// GPX 파일 직접 공유 URL 생성 (카카오맵 앱에서 import 가능)
export function generateGPXFileShareUrl(courseId: string): string {
  // 서버의 GPX 파일 직접 URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  
  // 코스 ID에 따른 GPX 파일 매핑
  const gpxFileMapping: { [key: string]: string } = {
    '1': 'bucheon.gpx',
    '2': 'bucheon.gpx', // 임시로 같은 파일 사용
    '3': 'bucheon.gpx', // 임시로 같은 파일 사용
  }
  
  const gpxFileName = gpxFileMapping[courseId] || 'bucheon.gpx'
  return `${baseUrl}/gpx/${gpxFileName}`
}

// 구글맵으로 GPX/KML 열기 (카카오맵 대안)
export function generateGoogleMapsGPXUrl(gpsRoute: GPSPoint[]): string {
  const startPoint = gpsRoute[0]
  const endPoint = gpsRoute[gpsRoute.length - 1]
  
  // 구글맵 길찾기 URL (경유지 포함)
  const waypoints = gpsRoute.slice(1, -1)
    .filter((_, index) => index % 10 === 0) // 10개마다 하나씩만 경유지로 사용
    .map(point => `${point.lat},${point.lng}`)
    .join('|')
  
  let googleMapsUrl = `https://www.google.com/maps/dir/${startPoint.lat},${startPoint.lng}/${endPoint.lat},${endPoint.lng}`
  
  if (waypoints) {
    googleMapsUrl += `/${waypoints}`
  }
  
  googleMapsUrl += '/@?api=1&travelmode=bicycling'
  
  return googleMapsUrl
}

// 웹 카카오맵 경로 검색 URL 생성 (경유지 포함 시도)
export function generateKakaoWebRouteUrl(
  currentLocation: GPSPoint,
  gpsRoute: GPSPoint[]
): string {
  const waypoints = extractWaypoints(gpsRoute, 5) // 웹에서는 5개 정도로 제한
  const startPoint = currentLocation
  const endPoint = waypoints[waypoints.length - 1]
  
  // 카카오맵 웹에서 길찾기 URL (경유지는 직접 지원하지 않음)
  const webUrl = `https://map.kakao.com/link/from/${startPoint.lat},${startPoint.lng}/to/${endPoint.lat},${endPoint.lng}`
  
  console.log('🌐 웹 카카오맵 URL:', webUrl)
  return webUrl
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
