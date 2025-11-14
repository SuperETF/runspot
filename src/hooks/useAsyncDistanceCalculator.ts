import { useCallback, useRef } from 'react'
import { useWebWorker } from './useWebWorker'

interface GPSPoint {
  lat: number
  lng: number
  timestamp?: number
  accuracy?: number
}

interface DistanceCalculatorOptions {
  enableBatching?: boolean
  batchSize?: number
  batchDelay?: number
}

export const useAsyncDistanceCalculator = (options: DistanceCalculatorOptions = {}) => {
  const { enableBatching = true, batchSize = 10, batchDelay = 50 } = options
  
  const { executeTask } = useWebWorker({
    workerPath: '/workers/distance-calculator.js',
    maxConcurrentTasks: 3,
    timeout: 5000
  })
  
  const batchQueueRef = useRef<Array<{
    task: any
    resolve: (result: number) => void
    reject: (error: Error) => void
  }>>([])
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 배치 처리 실행
  const processBatch = useCallback(async () => {
    if (batchQueueRef.current.length === 0) return
    
    const batch = batchQueueRef.current.splice(0, batchSize)
    
    try {
      const tasks = batch.map(item => ({
        type: 'distance',
        ...item.task
      }))
      
      const results = await executeTask<number[]>('BATCH_PROCESS', { tasks })
      
      batch.forEach((item, index) => {
        item.resolve(results[index])
      })
    } catch (error) {
      batch.forEach(item => {
        item.reject(error as Error)
      })
    }
  }, [executeTask, batchSize])
  
  // 배치 타이머 설정
  const scheduleBatch = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
    }
    
    batchTimeoutRef.current = setTimeout(() => {
      processBatch()
    }, batchDelay)
  }, [processBatch, batchDelay])
  
  // 단일 거리 계산
  const calculateDistance = useCallback(async (
    lat1: number, lng1: number, 
    lat2: number, lng2: number
  ): Promise<number> => {
    if (enableBatching) {
      return new Promise((resolve, reject) => {
        batchQueueRef.current.push({
          task: { lat1, lng1, lat2, lng2 },
          resolve,
          reject
        })
        
        if (batchQueueRef.current.length >= batchSize) {
          processBatch()
        } else {
          scheduleBatch()
        }
      })
    } else {
      return executeTask<number>('CALCULATE_DISTANCE', { lat1, lng1, lat2, lng2 })
    }
  }, [enableBatching, executeTask, batchSize, processBatch, scheduleBatch])
  
  // 경로 총 거리 계산
  const calculateRouteDistance = useCallback(async (points: GPSPoint[]): Promise<number> => {
    return executeTask<number>('CALCULATE_ROUTE_DISTANCE', { points })
  }, [executeTask])
  
  // 여러 지점과의 거리 계산 (주변 코스 검색용)
  const calculateMultipleDistances = useCallback(async (
    userLat: number, 
    userLng: number, 
    points: GPSPoint[]
  ): Promise<Array<GPSPoint & { distance: number }>> => {
    return executeTask('CALCULATE_MULTIPLE_DISTANCES', { userLat, userLng, points })
  }, [executeTask])
  
  // 경로 단순화 (배터리 최적화)
  const simplifyRoute = useCallback(async (
    points: GPSPoint[], 
    batteryLevel: number = 1.0
  ): Promise<GPSPoint[]> => {
    return executeTask('SIMPLIFY_ROUTE', { points, batteryLevel })
  }, [executeTask])
  
  // 실시간 거리 추적 (배터리 최적화 포함)
  const trackDistance = useCallback(async (
    currentPoint: GPSPoint,
    previousPoint: GPSPoint | null,
    batteryLevel: number = 1.0
  ): Promise<{ distance: number; shouldUpdate: boolean }> => {
    if (!previousPoint) {
      return { distance: 0, shouldUpdate: true }
    }
    
    // 배터리 레벨에 따른 업데이트 빈도 조절
    const minDistance = batteryLevel > 0.5 ? 0.005 : // 5m (고배터리)
                       batteryLevel > 0.2 ? 0.01 :   // 10m (중배터리)  
                       0.02 // 20m (저배터리)
    
    const distance = await calculateDistance(
      currentPoint.lat, currentPoint.lng,
      previousPoint.lat, previousPoint.lng
    )
    
    return {
      distance,
      shouldUpdate: distance >= minDistance
    }
  }, [calculateDistance])
  
  return {
    calculateDistance,
    calculateRouteDistance,
    calculateMultipleDistances,
    simplifyRoute,
    trackDistance
  }
}
