import { GPSCoordinate } from '@/types/database'

// 거리 계산 함수 (Haversine formula)
export const calculateDistance = (
  point1: GPSCoordinate,
  point2: GPSCoordinate
): number => {
  const R = 6371 // 지구 반지름 (km)
  const dLat = toRad(point2.lat - point1.lat)
  const dLng = toRad(point2.lng - point1.lng)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 도를 라디안으로 변환
const toRad = (value: number): number => {
  return (value * Math.PI) / 180
}

// 경로의 총 거리 계산
export const calculateRouteDistance = (route: GPSCoordinate[]): number => {
  if (route.length < 2) return 0
  
  let totalDistance = 0
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += calculateDistance(route[i], route[i + 1])
  }
  
  return totalDistance
}

// 코스 전체 거리 계산 (gps_route 기준)
// 반환: km 단위 거리
export const calculateCourseTotalDistance = (route: GPSCoordinate[]): number => {
  return calculateRouteDistance(route)
}

// 현재 위치가 코스 상에서 어느 지점까지 진행됐는지 추정
// 반환 단위: km
export const calculateCourseProgressAlongRoute = (
  route: GPSCoordinate[],
  currentPosition: GPSCoordinate
): {
  totalDistance: number
  distanceAlongRoute: number
  remainingDistance: number
  nearestIndex: number
} => {
  const totalDistance = calculateCourseTotalDistance(route)
  if (route.length === 0) {
    return {
      totalDistance,
      distanceAlongRoute: 0,
      remainingDistance: totalDistance,
      nearestIndex: -1
    }
  }

  // 가장 가까운 포인트 찾기
  let nearestIndex = 0
  let minDistance = Number.POSITIVE_INFINITY

  route.forEach((point, index) => {
    const d = calculateDistance(point, currentPosition)
    if (d < minDistance) {
      minDistance = d
      nearestIndex = index
    }
  })

  // 시작점부터 nearestIndex까지의 거리 합산
  let distanceAlongRoute = 0
  if (nearestIndex > 0) {
    for (let i = 0; i < nearestIndex; i++) {
      distanceAlongRoute += calculateDistance(route[i], route[i + 1])
    }
  }

  // 남은 거리 계산
  let remainingDistance = totalDistance - distanceAlongRoute
  if (remainingDistance < 0) remainingDistance = 0

  return {
    totalDistance,
    distanceAlongRoute,
    remainingDistance,
    nearestIndex
  }
}

// 두 점 사이의 중점 계산
export const getCenter = (points: GPSCoordinate[]): GPSCoordinate => {
  if (points.length === 0) {
    return { lat: 37.5665, lng: 126.9780 } // 서울 시청 기본값
  }
  
  const sumLat = points.reduce((sum, point) => sum + point.lat, 0)
  const sumLng = points.reduce((sum, point) => sum + point.lng, 0)
  
  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length
  }
}

// 경계 박스 계산
export const getBounds = (points: GPSCoordinate[]) => {
  if (points.length === 0) return null
  
  let minLat = points[0].lat
  let maxLat = points[0].lat
  let minLng = points[0].lng
  let maxLng = points[0].lng
  
  points.forEach(point => {
    minLat = Math.min(minLat, point.lat)
    maxLat = Math.max(maxLat, point.lat)
    minLng = Math.min(minLng, point.lng)
    maxLng = Math.max(maxLng, point.lng)
  })
  
  return { minLat, maxLat, minLng, maxLng }
}

// Kakao Maps API 로드 확인
export const isKakaoMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).kakao && !!(window as any).kakao.maps
}

// Kakao Maps API 로드 대기
export const waitForKakaoMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isKakaoMapsLoaded()) {
      resolve()
      return
    }
    
    const checkInterval = setInterval(() => {
      if (isKakaoMapsLoaded()) {
        clearInterval(checkInterval)
        resolve()
      }
    }, 100)
    
    // 10초 후 타임아웃
    setTimeout(() => {
      clearInterval(checkInterval)
      reject(new Error('Kakao Maps API 로드 실패'))
    }, 10000)
  })
}

// 좌표를 Kakao Maps LatLng 객체로 변환
export const toKakaoLatLng = (coord: GPSCoordinate) => {
  if (!isKakaoMapsLoaded()) return null
  return new (window as any).kakao.maps.LatLng(coord.lat, coord.lng)
}

// Kakao Maps LatLng 객체를 좌표로 변환
export const fromKakaoLatLng = (latLng: { getLat(): number; getLng(): number }): GPSCoordinate => {
  return {
    lat: latLng.getLat(),
    lng: latLng.getLng()
  }
}

// 지도 줌 레벨 계산 (거리에 따라)
export const getZoomLevel = (distance: number): number => {
  if (distance < 1) return 6      // 1km 미만
  if (distance < 3) return 5      // 3km 미만
  if (distance < 5) return 4      // 5km 미만
  if (distance < 10) return 3     // 10km 미만
  return 2                        // 10km 이상
}

// 현재 위치 가져오기
export const getCurrentPosition = (): Promise<GPSCoordinate> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation이 지원되지 않습니다'))
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}

// 위치 추적 시작
export const watchPosition = (
  callback: (position: GPSCoordinate) => void,
  errorCallback?: (error: GeolocationPositionError) => void
): number => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation이 지원되지 않습니다')
  }
  
  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: new Date().toISOString()
      })
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 1000
    }
  )
}

// 위치 추적 중지
export const clearWatch = (watchId: number): void => {
  navigator.geolocation.clearWatch(watchId)
}

// 서울 지역 확인
export const isInSeoul = (coord: GPSCoordinate): boolean => {
  // 서울 대략적인 경계
  const seoulBounds = {
    north: 37.7,
    south: 37.4,
    east: 127.2,
    west: 126.7
  }
  
  return (
    coord.lat >= seoulBounds.south &&
    coord.lat <= seoulBounds.north &&
    coord.lng >= seoulBounds.west &&
    coord.lng <= seoulBounds.east
  )
}

// 보행자 네비게이션 MVP: 경로 포인트에 distanceFromStart 추가
export interface RoutePointWithDistance extends GPSCoordinate {
  distanceFromStart: number // meters
}

// GPX 경로를 distanceFromStart가 포함된 RoutePoint로 변환
export const prepareRoutePoints = (gpsRoute: GPSCoordinate[]): RoutePointWithDistance[] => {
  if (gpsRoute.length === 0) return []
  
  const routePoints: RoutePointWithDistance[] = []
  let cumulativeDistance = 0
  
  for (let i = 0; i < gpsRoute.length; i++) {
    if (i > 0) {
      // 이전 포인트와의 거리를 미터 단위로 계산
      const segmentDistance = calculateDistance(gpsRoute[i - 1], gpsRoute[i]) * 1000
      cumulativeDistance += segmentDistance
    }
    
    routePoints.push({
      lat: gpsRoute[i].lat,
      lng: gpsRoute[i].lng,
      timestamp: gpsRoute[i].timestamp,
      distanceFromStart: cumulativeDistance
    })
  }
  
  return routePoints
}

// 보행자 네비게이션 MVP: 진행률 계산
export interface NavigationProgress {
  nearestIndex: number
  passedDistance: number // meters
  totalDistance: number // meters
  progressPercent: number // 0-100
  isOffCourse: boolean
  distanceToRoute: number // meters
}

// 코스 이탈 임계값 (미터)
export const OFF_COURSE_THRESHOLD = 40

// 현재 위치 기준 네비게이션 진행률 계산
export const calculateNavigationProgress = (
  routePoints: RoutePointWithDistance[],
  currentPosition: GPSCoordinate
): NavigationProgress => {
  if (routePoints.length === 0) {
    return {
      nearestIndex: -1,
      passedDistance: 0,
      totalDistance: 0,
      progressPercent: 0,
      isOffCourse: true,
      distanceToRoute: Infinity
    }
  }
  
  // 가장 가까운 포인트 찾기
  let nearestIndex = 0
  let minDistance = Number.POSITIVE_INFINITY
  
  routePoints.forEach((point, index) => {
    const distance = calculateDistance(point, currentPosition) * 1000 // 미터 변환
    if (distance < minDistance) {
      minDistance = distance
      nearestIndex = index
    }
  })
  
  const totalDistance = routePoints[routePoints.length - 1].distanceFromStart
  const passedDistance = routePoints[nearestIndex].distanceFromStart
  const progressPercent = totalDistance > 0 ? (passedDistance / totalDistance) * 100 : 0
  const isOffCourse = minDistance > OFF_COURSE_THRESHOLD
  
  return {
    nearestIndex,
    passedDistance,
    totalDistance,
    progressPercent,
    isOffCourse,
    distanceToRoute: minDistance
  }
}
