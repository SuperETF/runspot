import { useState, useEffect, useRef, useCallback } from 'react'

interface GPSPoint {
  lat: number
  lng: number
  timestamp: number
  accuracy?: number
}

interface UseGPSTrackingOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  onLocationUpdate?: (location: GPSPoint) => void
  onDistanceUpdate?: (distance: number) => void
}

export const useGPSTracking = (isRunning: boolean, options: UseGPSTrackingOptions = {}) => {
  const [gpsPath, setGpsPath] = useState<GPSPoint[]>([])
  const [currentLocation, setCurrentLocation] = useState<GPSPoint | null>(null)
  const [totalDistance, setTotalDistance] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const watchIdRef = useRef<number | null>(null)
  const lastLocationRef = useRef<GPSPoint | null>(null)
  
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 1000,
    onLocationUpdate,
    onDistanceUpdate
  } = options

  // Haversine 거리 계산 (메모이제이션)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }, [])

  // GPS 추적 시작
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('GPS를 지원하지 않는 브라우저입니다.')
      return
    }

    if (watchIdRef.current !== null) {
      return // 이미 추적 중
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newPoint: GPSPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy
        }

        setCurrentLocation(newPoint)
        setError(null)

        // 거리 계산 및 경로 업데이트
        if (lastLocationRef.current) {
          const distance = calculateDistance(
            lastLocationRef.current.lat,
            lastLocationRef.current.lng,
            newPoint.lat,
            newPoint.lng
          )

          // 최소 이동 거리 필터 (5m 이상)
          if (distance >= 0.005) {
            setGpsPath(prev => {
              const updated = [...prev, newPoint]
              // 메모리 절약을 위해 최대 1000개 포인트로 제한
              return updated.length > 1000 ? updated.slice(-1000) : updated
            })

            setTotalDistance(prev => {
              const newTotal = prev + distance
              onDistanceUpdate?.(newTotal)
              return newTotal
            })

            lastLocationRef.current = newPoint
          }
        } else {
          // 첫 번째 포인트
          setGpsPath([newPoint])
          lastLocationRef.current = newPoint
        }

        onLocationUpdate?.(newPoint)
      },
      (error) => {
        console.error('GPS 추적 오류:', error)
        setError(`GPS 오류: ${error.message}`)
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    )

    watchIdRef.current = watchId
  }, [calculateDistance, enableHighAccuracy, timeout, maximumAge, onLocationUpdate, onDistanceUpdate])

  // GPS 추적 중지
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  // 경로 초기화
  const resetPath = useCallback(() => {
    setGpsPath([])
    setTotalDistance(0)
    lastLocationRef.current = null
  }, [])

  // isRunning 상태에 따른 추적 제어
  useEffect(() => {
    if (isRunning) {
      startTracking()
    } else {
      stopTracking()
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      stopTracking()
    }
  }, [isRunning, startTracking, stopTracking])

  return {
    gpsPath,
    currentLocation,
    totalDistance,
    error,
    startTracking,
    stopTracking,
    resetPath
  }
}
