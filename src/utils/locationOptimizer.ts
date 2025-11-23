/**
 * 위치 업데이트 주기 최적화 유틸리티
 * 런닝 상황, 배터리, 속도 등을 고려한 동적 조정
 */

export interface RunningContext {
  speed?: number // km/h
  distance?: number // km
  batteryLevel?: number // 0-100
  isRacing?: boolean
  isGroupRun?: boolean
  friendsNearby?: number
  networkQuality?: 'excellent' | 'good' | 'poor'
}

export interface LocationUpdateConfig {
  interval: number // 초
  reason: string
  batteryImpact: 'low' | 'medium' | 'high'
}

/**
 * 최적 위치 업데이트 주기 계산
 */
export const getOptimalUpdateInterval = (context: RunningContext = {}): LocationUpdateConfig => {
  const {
    speed = 0,
    distance = 0,
    batteryLevel = 100,
    isRacing = false,
    isGroupRun = false,
    friendsNearby = 0,
    networkQuality = 'good'
  } = context

  // 1. 긴급 상황 (레이스, 그룹 런닝)
  if (isRacing) {
    return {
      interval: 3,
      reason: '레이스 모드 - 실시간 경쟁',
      batteryImpact: 'high'
    }
  }

  if (isGroupRun && friendsNearby > 0) {
    return {
      interval: 4,
      reason: '그룹 런닝 - 동기화 필요',
      batteryImpact: 'high'
    }
  }

  // 2. 배터리 절약 모드
  if (batteryLevel < 15) {
    return {
      interval: 20,
      reason: '배터리 절약 모드',
      batteryImpact: 'low'
    }
  }

  if (batteryLevel < 30) {
    return {
      interval: 12,
      reason: '배터리 보존',
      batteryImpact: 'medium'
    }
  }

  // 3. 속도 기반 조정
  if (speed > 15) { // 고속 런닝
    return {
      interval: 4,
      reason: '고속 런닝 - 정확한 추적 필요',
      batteryImpact: 'high'
    }
  }

  if (speed > 10) { // 일반 런닝
    return {
      interval: 5,
      reason: '일반 런닝 속도',
      batteryImpact: 'medium'
    }
  }

  if (speed > 5) { // 조깅
    return {
      interval: 8,
      reason: '조깅 속도',
      batteryImpact: 'medium'
    }
  }

  if (speed > 0) { // 걷기
    return {
      interval: 15,
      reason: '걷기 속도',
      batteryImpact: 'low'
    }
  }

  // 4. 거리 기반 조정
  if (distance > 20) { // 장거리
    return {
      interval: 10,
      reason: '장거리 런닝 - 배터리 효율',
      batteryImpact: 'medium'
    }
  }

  // 5. 네트워크 상태 고려
  if (networkQuality === 'poor') {
    return {
      interval: 12,
      reason: '네트워크 불안정',
      batteryImpact: 'medium'
    }
  }

  // 6. 친구 근처 여부
  if (friendsNearby > 2) {
    return {
      interval: 6,
      reason: '다수 친구 근처',
      batteryImpact: 'medium'
    }
  }

  if (friendsNearby > 0) {
    return {
      interval: 7,
      reason: '친구 근처',
      batteryImpact: 'medium'
    }
  }

  // 7. 기본값
  return {
    interval: 8,
    reason: '표준 모드',
    batteryImpact: 'medium'
  }
}

/**
 * 배터리 영향도 계산
 */
export const calculateBatteryImpact = (interval: number): number => {
  // 1시간 기준 배터리 소모량 (%)
  const baseConsumption = 3600 / interval * 0.01 // 업데이트당 0.01%
  return Math.min(baseConsumption, 50) // 최대 50%
}

/**
 * 네트워크 효율성 고려한 조정
 */
export const adjustForNetworkEfficiency = (
  interval: number, 
  networkQuality: 'excellent' | 'good' | 'poor'
): number => {
  switch (networkQuality) {
    case 'excellent':
      return Math.max(interval - 1, 3) // 1초 단축, 최소 3초
    case 'poor':
      return interval + 3 // 3초 증가
    default:
      return interval
  }
}

/**
 * 실시간 조정 권장사항
 */
export const getRealtimeRecommendation = (context: RunningContext): {
  currentOptimal: number
  suggestions: string[]
} => {
  const config = getOptimalUpdateInterval(context)
  const suggestions: string[] = []

  if (config.batteryImpact === 'high' && (context.batteryLevel || 100) < 50) {
    suggestions.push('배터리가 부족합니다. 업데이트 주기를 늘리는 것을 권장합니다.')
  }

  if (context.isGroupRun && config.interval > 5) {
    suggestions.push('그룹 런닝 중입니다. 더 자주 위치를 업데이트하시겠습니까?')
  }

  if ((context.speed || 0) > 12 && config.interval > 6) {
    suggestions.push('고속 런닝 중입니다. 정확한 추적을 위해 업데이트 주기를 단축하시겠습니까?')
  }

  return {
    currentOptimal: config.interval,
    suggestions
  }
}

/**
 * 프리셋 설정
 */
export const LOCATION_UPDATE_PRESETS = {
  RACING: {
    interval: 3,
    name: '레이스 모드',
    description: '실시간 경쟁, 최고 정확도',
    batteryImpact: 'high' as const
  },
  REALTIME: {
    interval: 5,
    name: '실시간 모드',
    description: '친구와 실시간 공유',
    batteryImpact: 'medium' as const
  },
  BALANCED: {
    interval: 8,
    name: '균형 모드',
    description: '성능과 배터리 균형',
    batteryImpact: 'medium' as const
  },
  EFFICIENT: {
    interval: 12,
    name: '효율 모드',
    description: '배터리 절약 우선',
    batteryImpact: 'low' as const
  },
  MARATHON: {
    interval: 15,
    name: '마라톤 모드',
    description: '장거리 런닝 최적화',
    batteryImpact: 'low' as const
  }
} as const

/**
 * 사용자 설정 기반 조정
 */
export const getUserPreferredInterval = (
  userPreset: keyof typeof LOCATION_UPDATE_PRESETS,
  context: RunningContext
): number => {
  const preset = LOCATION_UPDATE_PRESETS[userPreset]
  let interval = preset.interval

  // 긴급 상황에서는 사용자 설정보다 최적화 우선
  if (context.isRacing && interval > 5) {
    interval = 3
  }

  if (context.batteryLevel && context.batteryLevel < 20 && interval < 10) {
    interval = 15
  }

  return interval
}
