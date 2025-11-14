import { useState, useEffect, useRef, useCallback } from 'react'
import { useAsyncDistanceCalculator } from './useAsyncDistanceCalculator'

interface OptimizedGPSPoint {
  lat: number
  lng: number
  timestamp: number
  accuracy?: number
}

interface BatteryOptimizedGPSOptions {
  onLocationUpdate?: (location: OptimizedGPSPoint) => void
  onDistanceUpdate?: (distance: number) => void
  onBatteryLevelChange?: (level: number) => void
}

interface BatteryInfo {
  level: number
  charging: boolean
  chargingTime: number
  dischargingTime: number
}

export const useBatteryOptimizedGPS = (
  isRunning: boolean, 
  options: BatteryOptimizedGPSOptions = {}
) => {
  const { onLocationUpdate, onDistanceUpdate, onBatteryLevelChange } = options
  
  const [gpsPath, setGpsPath] = useState<OptimizedGPSPoint[]>([])
  const [currentLocation, setCurrentLocation] = useState<OptimizedGPSPoint | null>(null)
  const [totalDistance, setTotalDistance] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo>({
    level: 1.0,
    charging: false,
    chargingTime: Infinity,
    dischargingTime: Infinity
  })
  
  const watchIdRef = useRef<number | null>(null)
  const lastLocationRef = useRef<OptimizedGPSPoint | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)
  const backgroundTaskRef = useRef<number | null>(null)
  
  const { calculateDistance, trackDistance, simplifyRoute } = useAsyncDistanceCalculator({
    enableBatching: true,
    batchSize: 5,
    batchDelay: 100
  })
  
  // 배터리 정보 모니터링
  useEffect(() => {
    const monitorBattery = async () => {
      try {
        // @ts-ignore - Battery API는 실험적 기능
        const battery = await navigator.getBattery?.()
        
        if (battery) {
          const updateBatteryInfo = () => {
            const info = {
              level: battery.level,
              charging: battery.charging,
              chargingTime: battery.chargingTime,
              dischargingTime: battery.dischargingTime
            }
            setBatteryInfo(info)
            onBatteryLevelChange?.(info.level)
          }
          
          updateBatteryInfo()
          
          battery.addEventListener('levelchange', updateBatteryInfo)
          battery.addEventListener('chargingchange', updateBatteryInfo)
          
          return () => {
            battery.removeEventListener('levelchange', updateBatteryInfo)
            battery.removeEventListener('chargingchange', updateBatteryInfo)
          }
        }
      } catch (error) {
        console.log('배터리 API를 사용할 수 없습니다:', error)
      }
    }
    
    monitorBattery()
  }, [onBatteryLevelChange])
  
  // 배터리 레벨에 따른 GPS 설정 조정
  const getGPSOptions = useCallback((): PositionOptions => {
    const { level, charging } = batteryInfo
    
    // 충전 중이거나 배터리가 충분한 경우
    if (charging || level > 0.5) {
      return {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    }
    
    // 배터리가 부족한 경우 (20% 미만)
    if (level < 0.2) {
      return {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 10000
      }
    }
    
    // 중간 배터리 레벨
    return {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000
    }
  }, [batteryInfo])
  
  // 업데이트 빈도 조절
  const shouldUpdateLocation = useCallback((newLocation: OptimizedGPSPoint): boolean => {
    const now = Date.now()
    const { level, charging } = batteryInfo
    
    // 최소 업데이트 간격 (ms)
    let minInterval: number
    
    if (charging || level > 0.5) {
      minInterval = 1000 // 1초 (고성능)
    } else if (level > 0.2) {
      minInterval = 3000 // 3초 (중성능)
    } else {
      minInterval = 10000 // 10초 (저전력)
    }
    
    return (now - lastUpdateTimeRef.current) >= minInterval
  }, [batteryInfo])
  
  // GPS 추적 시작
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('GPS를 지원하지 않는 브라우저입니다.')
      return
    }
    
    if (watchIdRef.current !== null) {
      return // 이미 추적 중
    }
    
    const gpsOptions = getGPSOptions()
    
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const newPoint: OptimizedGPSPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy
        }
        
        // 업데이트 빈도 체크
        if (!shouldUpdateLocation(newPoint)) {
          return
        }
        
        setCurrentLocation(newPoint)
        setError(null)
        lastUpdateTimeRef.current = Date.now()
        
        // 비동기 거리 계산
        if (lastLocationRef.current) {
          try {
            const { distance, shouldUpdate } = await trackDistance(
              newPoint,
              lastLocationRef.current,
              batteryInfo.level
            )
            
            if (shouldUpdate) {
              setGpsPath(prev => {
                const updated = [...prev, newPoint]
                // 배터리 절약을 위해 경로 단순화 (백그라운드)
                if (updated.length > 100 && batteryInfo.level < 0.3) {
                  simplifyRoute(updated, batteryInfo.level).then(simplified => {
                    const convertedPath = simplified.map(point => ({
                      ...point,
                      timestamp: point.timestamp || Date.now()
                    })) as OptimizedGPSPoint[]
                    setGpsPath(convertedPath)
                  })
                }
                return updated.length > 1000 ? updated.slice(-1000) : updated
              })
              
              setTotalDistance(prev => {
                const newTotal = prev + distance
                onDistanceUpdate?.(newTotal)
                return newTotal
              })
              
              lastLocationRef.current = newPoint
            }
          } catch (error) {
            console.error('거리 계산 오류:', error)
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
        
        // 오류 발생 시 재시도 (배터리 레벨에 따라 간격 조정)
        const retryDelay = batteryInfo.level > 0.5 ? 5000 : 15000
        setTimeout(() => {
          if (isRunning) {
            stopTracking()
            startTracking()
          }
        }, retryDelay)
      },
      gpsOptions
    )
    
    watchIdRef.current = watchId
  }, [
    getGPSOptions, 
    shouldUpdateLocation, 
    trackDistance, 
    batteryInfo, 
    onLocationUpdate, 
    onDistanceUpdate, 
    simplifyRoute,
    isRunning
  ])
  
  // GPS 추적 중지
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    
    if (backgroundTaskRef.current) {
      clearTimeout(backgroundTaskRef.current)
      backgroundTaskRef.current = null
    }
  }, [])
  
  // 백그라운드 최적화 작업
  useEffect(() => {
    if (!isRunning || gpsPath.length < 50) return
    
    // 주기적으로 경로 최적화 (배터리 레벨에 따라)
    const optimizeInterval = batteryInfo.level > 0.5 ? 30000 : 60000 // 30초 또는 1분
    
    backgroundTaskRef.current = window.setTimeout(async () => {
      if (batteryInfo.level < 0.5 && gpsPath.length > 200) {
        try {
          const simplified = await simplifyRoute(gpsPath, batteryInfo.level)
          const convertedPath = simplified.map(point => ({
            ...point,
            timestamp: point.timestamp || Date.now()
          })) as OptimizedGPSPoint[]
          setGpsPath(convertedPath)
        } catch (error) {
          console.error('경로 최적화 오류:', error)
        }
      }
    }, optimizeInterval)
    
    return () => {
      if (backgroundTaskRef.current) {
        clearTimeout(backgroundTaskRef.current)
      }
    }
  }, [isRunning, gpsPath.length, batteryInfo.level, simplifyRoute, gpsPath])
  
  // 배터리 레벨 변화에 따른 GPS 설정 업데이트
  useEffect(() => {
    if (isRunning && watchIdRef.current) {
      // GPS 설정 재조정
      stopTracking()
      setTimeout(startTracking, 1000)
    }
  }, [batteryInfo.level, batteryInfo.charging, isRunning, stopTracking, startTracking])
  
  // isRunning 상태에 따른 추적 제어
  useEffect(() => {
    if (isRunning) {
      startTracking()
    } else {
      stopTracking()
    }
    
    return stopTracking
  }, [isRunning, startTracking, stopTracking])
  
  // 경로 초기화
  const resetPath = useCallback(() => {
    setGpsPath([])
    setTotalDistance(0)
    lastLocationRef.current = null
    lastUpdateTimeRef.current = 0
  }, [])
  
  return {
    gpsPath,
    currentLocation,
    totalDistance,
    error,
    batteryInfo,
    resetPath,
    // 성능 메트릭
    getPerformanceMetrics: () => ({
      pathLength: gpsPath.length,
      batteryLevel: batteryInfo.level,
      isCharging: batteryInfo.charging,
      lastUpdateTime: lastUpdateTimeRef.current,
      trackingActive: watchIdRef.current !== null
    })
  }
}
