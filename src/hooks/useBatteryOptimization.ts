import { useState, useEffect, useCallback, useRef } from 'react'

interface BatteryInfo {
  level: number
  charging: boolean
  chargingTime: number
  dischargingTime: number
}

interface OptimizationSettings {
  gpsAccuracy: 'high' | 'medium' | 'low'
  updateFrequency: number // milliseconds
  renderQuality: 'high' | 'medium' | 'low'
  backgroundProcessing: boolean
  cacheSize: number
  maxConcurrentTasks: number
}

interface BatteryOptimizationOptions {
  onBatteryLevelChange?: (level: number, settings: OptimizationSettings) => void
  onOptimizationChange?: (settings: OptimizationSettings) => void
  customThresholds?: {
    critical: number // 0.1 (10%)
    low: number      // 0.2 (20%)
    medium: number   // 0.5 (50%)
  }
}

export const useBatteryOptimization = (options: BatteryOptimizationOptions = {}) => {
  const { onBatteryLevelChange, onOptimizationChange, customThresholds } = options
  
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo>({
    level: 1.0,
    charging: false,
    chargingTime: Infinity,
    dischargingTime: Infinity
  })
  
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings>({
    gpsAccuracy: 'high',
    updateFrequency: 1000,
    renderQuality: 'high',
    backgroundProcessing: true,
    cacheSize: 100,
    maxConcurrentTasks: 5
  })
  
  const [isLowPowerMode, setIsLowPowerMode] = useState(false)
  const batteryRef = useRef<any>(null)
  const thresholdsRef = useRef({
    critical: customThresholds?.critical || 0.1,
    low: customThresholds?.low || 0.2,
    medium: customThresholds?.medium || 0.5
  })
  
  // 배터리 레벨에 따른 최적화 설정 계산
  const calculateOptimizationSettings = useCallback((battery: BatteryInfo): OptimizationSettings => {
    const { level, charging } = battery
    const thresholds = thresholdsRef.current
    
    // 충전 중이면 고성능 모드
    if (charging) {
      return {
        gpsAccuracy: 'high',
        updateFrequency: 1000,
        renderQuality: 'high',
        backgroundProcessing: true,
        cacheSize: 100,
        maxConcurrentTasks: 5
      }
    }
    
    // 배터리 레벨별 최적화
    if (level <= thresholds.critical) {
      // 극도로 낮은 배터리 (10% 이하)
      return {
        gpsAccuracy: 'low',
        updateFrequency: 30000, // 30초
        renderQuality: 'low',
        backgroundProcessing: false,
        cacheSize: 20,
        maxConcurrentTasks: 1
      }
    } else if (level <= thresholds.low) {
      // 낮은 배터리 (20% 이하)
      return {
        gpsAccuracy: 'low',
        updateFrequency: 10000, // 10초
        renderQuality: 'low',
        backgroundProcessing: false,
        cacheSize: 30,
        maxConcurrentTasks: 2
      }
    } else if (level <= thresholds.medium) {
      // 중간 배터리 (50% 이하)
      return {
        gpsAccuracy: 'medium',
        updateFrequency: 3000, // 3초
        renderQuality: 'medium',
        backgroundProcessing: true,
        cacheSize: 50,
        maxConcurrentTasks: 3
      }
    } else {
      // 높은 배터리 (50% 초과)
      return {
        gpsAccuracy: 'high',
        updateFrequency: 1000, // 1초
        renderQuality: 'high',
        backgroundProcessing: true,
        cacheSize: 100,
        maxConcurrentTasks: 5
      }
    }
  }, [])
  
  // 배터리 정보 업데이트
  const updateBatteryInfo = useCallback((battery: any) => {
    const info: BatteryInfo = {
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime
    }
    
    setBatteryInfo(info)
    
    // 최적화 설정 업데이트
    const newSettings = calculateOptimizationSettings(info)
    setOptimizationSettings(newSettings)
    
    // 저전력 모드 감지
    const wasLowPowerMode = isLowPowerMode
    const nowLowPowerMode = info.level <= thresholdsRef.current.low && !info.charging
    setIsLowPowerMode(nowLowPowerMode)
    
    // 콜백 호출
    onBatteryLevelChange?.(info.level, newSettings)
    
    if (wasLowPowerMode !== nowLowPowerMode || JSON.stringify(optimizationSettings) !== JSON.stringify(newSettings)) {
      onOptimizationChange?.(newSettings)
    }
  }, [calculateOptimizationSettings, isLowPowerMode, optimizationSettings, onBatteryLevelChange, onOptimizationChange])
  
  // 배터리 API 초기화
  useEffect(() => {
    const initializeBattery = async () => {
      try {
        // @ts-ignore - Battery API는 실험적 기능
        const battery = await navigator.getBattery?.()
        
        if (battery) {
          batteryRef.current = battery
          
          // 초기 상태 설정
          updateBatteryInfo(battery)
          
          // 이벤트 리스너 등록
          battery.addEventListener('levelchange', () => updateBatteryInfo(battery))
          battery.addEventListener('chargingchange', () => updateBatteryInfo(battery))
          battery.addEventListener('chargingtimechange', () => updateBatteryInfo(battery))
          battery.addEventListener('dischargingtimechange', () => updateBatteryInfo(battery))
          
          console.log('🔋 배터리 최적화 활성화:', {
            level: `${Math.round(battery.level * 100)}%`,
            charging: battery.charging
          })
        } else {
          console.log('⚠️ 배터리 API를 사용할 수 없습니다. 기본 설정을 사용합니다.')
        }
      } catch (error) {
        console.log('⚠️ 배터리 API 초기화 실패:', error)
      }
    }
    
    initializeBattery()
    
    // 정리
    return () => {
      if (batteryRef.current) {
        const battery = batteryRef.current
        battery.removeEventListener('levelchange', updateBatteryInfo)
        battery.removeEventListener('chargingchange', updateBatteryInfo)
        battery.removeEventListener('chargingtimechange', updateBatteryInfo)
        battery.removeEventListener('dischargingtimechange', updateBatteryInfo)
      }
    }
  }, [updateBatteryInfo])
  
  // GPS 설정 가져오기
  const getGPSOptions = useCallback((): PositionOptions => {
    const { gpsAccuracy, updateFrequency } = optimizationSettings
    
    switch (gpsAccuracy) {
      case 'high':
        return {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
      case 'medium':
        return {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 5000
        }
      case 'low':
        return {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 10000
        }
      default:
        return {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
    }
  }, [optimizationSettings])
  
  // 렌더링 설정 가져오기
  const getRenderSettings = useCallback(() => {
    const { renderQuality } = optimizationSettings
    
    switch (renderQuality) {
      case 'high':
        return {
          maxFPS: 60,
          enableAntialiasing: true,
          enableShadows: true,
          maxMarkers: 1000
        }
      case 'medium':
        return {
          maxFPS: 30,
          enableAntialiasing: true,
          enableShadows: false,
          maxMarkers: 500
        }
      case 'low':
        return {
          maxFPS: 15,
          enableAntialiasing: false,
          enableShadows: false,
          maxMarkers: 100
        }
      default:
        return {
          maxFPS: 60,
          enableAntialiasing: true,
          enableShadows: true,
          maxMarkers: 1000
        }
    }
  }, [optimizationSettings])
  
  // 백그라운드 작업 제어
  const shouldRunBackgroundTask = useCallback((taskType: 'cache' | 'sync' | 'analytics' | 'optimization'): boolean => {
    if (!optimizationSettings.backgroundProcessing) {
      return false
    }
    
    // 배터리 레벨에 따른 백그라운드 작업 제한
    const { level, charging } = batteryInfo
    
    if (charging) {
      return true // 충전 중이면 모든 작업 허용
    }
    
    if (level <= thresholdsRef.current.critical) {
      return false // 극도로 낮은 배터리에서는 모든 백그라운드 작업 중지
    }
    
    if (level <= thresholdsRef.current.low) {
      return taskType === 'optimization' // 낮은 배터리에서는 최적화 작업만 허용
    }
    
    return true
  }, [optimizationSettings.backgroundProcessing, batteryInfo])
  
  // 네트워크 요청 제한
  const getNetworkPolicy = useCallback(() => {
    const { level, charging } = batteryInfo
    
    if (charging || level > thresholdsRef.current.medium) {
      return {
        maxConcurrentRequests: 5,
        enablePrefetch: true,
        enableBackgroundSync: true,
        cacheStrategy: 'network-first'
      }
    }
    
    if (level > thresholdsRef.current.low) {
      return {
        maxConcurrentRequests: 3,
        enablePrefetch: false,
        enableBackgroundSync: true,
        cacheStrategy: 'cache-first'
      }
    }
    
    return {
      maxConcurrentRequests: 1,
      enablePrefetch: false,
      enableBackgroundSync: false,
      cacheStrategy: 'cache-only'
    }
  }, [batteryInfo])
  
  // 수동 최적화 설정 업데이트
  const updateOptimizationSettings = useCallback((newSettings: Partial<OptimizationSettings>) => {
    setOptimizationSettings(prev => {
      const updated = { ...prev, ...newSettings }
      onOptimizationChange?.(updated)
      return updated
    })
  }, [onOptimizationChange])
  
  // 배터리 상태 요약
  const getBatteryStatus = useCallback(() => {
    const { level, charging, dischargingTime } = batteryInfo
    
    let status: 'critical' | 'low' | 'medium' | 'high' | 'charging'
    
    if (charging) {
      status = 'charging'
    } else if (level <= thresholdsRef.current.critical) {
      status = 'critical'
    } else if (level <= thresholdsRef.current.low) {
      status = 'low'
    } else if (level <= thresholdsRef.current.medium) {
      status = 'medium'
    } else {
      status = 'high'
    }
    
    return {
      status,
      level: Math.round(level * 100),
      charging,
      estimatedTime: dischargingTime !== Infinity ? Math.round(dischargingTime / 3600) : null, // 시간 단위
      optimizationActive: isLowPowerMode
    }
  }, [batteryInfo, isLowPowerMode])
  
  return {
    batteryInfo,
    optimizationSettings,
    isLowPowerMode,
    getGPSOptions,
    getRenderSettings,
    shouldRunBackgroundTask,
    getNetworkPolicy,
    updateOptimizationSettings,
    getBatteryStatus
  }
}
