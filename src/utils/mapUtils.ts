import { GPSCoordinate } from '@/types/database'

// Kakao Maps API 타입 정의
declare global {
  interface Window {
    kakao: {
      maps: {
        Map: new (container: HTMLElement, options: any) => any
        LatLng: new (lat: number, lng: number) => any
        Marker: new (options: any) => any
        Polyline: new (options: any) => any
        MarkerImage: new (src: string, size: any, options?: any) => any
        Size: new (width: number, height: number) => any
        Point: new (x: number, y: number) => any
        InfoWindow: new (options: any) => any
        event: {
          addListener: (target: any, type: string, handler: Function) => void
        }
        load: (callback: () => void) => void
      }
    }
  }
}

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
  return typeof window !== 'undefined' && !!window.kakao && !!window.kakao.maps
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
  return new window.kakao.maps.LatLng(coord.lat, coord.lng)
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
