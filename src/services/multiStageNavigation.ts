'use client'

import { GPSPoint, extractWaypoints } from './routeOptimization'

export interface NavigationStage {
  id: number
  startPoint: GPSPoint
  endPoint: GPSPoint
  description: string
  isCompleted: boolean
}

export interface MultiStageNavigation {
  stages: NavigationStage[]
  currentStage: number
  totalStages: number
  isCompleted: boolean
}

// GPX 경로를 여러 단계로 나누기
export function createMultiStageNavigation(
  currentLocation: GPSPoint,
  gpsRoute: GPSPoint[],
  stageCount: number = 5
): MultiStageNavigation {
  // 주요 경유지 추출 (단계 수만큼)
  const keyWaypoints = extractWaypoints(gpsRoute, stageCount + 1) // +1은 시작점 포함
  
  const stages: NavigationStage[] = []
  
  // 첫 번째 단계: 현재 위치 → 첫 번째 경유지
  stages.push({
    id: 1,
    startPoint: currentLocation,
    endPoint: keyWaypoints[1], // keyWaypoints[0]은 원래 시작점
    description: `1단계: 첫 번째 경유지로 이동`,
    isCompleted: false
  })
  
  // 중간 단계들: 경유지 → 경유지
  for (let i = 1; i < keyWaypoints.length - 1; i++) {
    stages.push({
      id: i + 1,
      startPoint: keyWaypoints[i],
      endPoint: keyWaypoints[i + 1],
      description: `${i + 1}단계: ${i + 1}번째 경유지로 이동`,
      isCompleted: false
    })
  }
  
  console.log('🗺️ 다단계 네비게이션 생성:', {
    총단계수: stages.length,
    경유지수: keyWaypoints.length,
    단계별정보: stages.map(s => ({
      단계: s.id,
      설명: s.description,
      시작: `${s.startPoint.lat.toFixed(4)}, ${s.startPoint.lng.toFixed(4)}`,
      도착: `${s.endPoint.lat.toFixed(4)}, ${s.endPoint.lng.toFixed(4)}`
    }))
  })
  
  return {
    stages,
    currentStage: 0,
    totalStages: stages.length,
    isCompleted: false
  }
}

// 현재 단계의 카카오맵 URL 생성
export function getCurrentStageNavUrl(navigation: MultiStageNavigation): string | null {
  if (navigation.currentStage >= navigation.stages.length) {
    return null // 모든 단계 완료
  }
  
  const currentStage = navigation.stages[navigation.currentStage]
  const navUrl = `kakaomap://route?sp=${currentStage.startPoint.lat},${currentStage.startPoint.lng}&ep=${currentStage.endPoint.lat},${currentStage.endPoint.lng}&by=BICYCLE`
  
  console.log(`🚴‍♂️ ${currentStage.id}단계 네비게이션 URL:`, navUrl)
  return navUrl
}

// 다음 단계로 진행
export function proceedToNextStage(navigation: MultiStageNavigation): MultiStageNavigation {
  const updatedNavigation = { ...navigation }
  
  // 현재 단계 완료 표시
  if (updatedNavigation.currentStage < updatedNavigation.stages.length) {
    updatedNavigation.stages[updatedNavigation.currentStage].isCompleted = true
  }
  
  // 다음 단계로 진행
  updatedNavigation.currentStage += 1
  
  // 모든 단계 완료 확인
  if (updatedNavigation.currentStage >= updatedNavigation.stages.length) {
    updatedNavigation.isCompleted = true
  }
  
  console.log('➡️ 다음 단계로 진행:', {
    완료된단계: updatedNavigation.currentStage,
    총단계: updatedNavigation.totalStages,
    전체완료: updatedNavigation.isCompleted
  })
  
  return updatedNavigation
}

// 현재 단계 정보 가져오기
export function getCurrentStageInfo(navigation: MultiStageNavigation): NavigationStage | null {
  if (navigation.currentStage >= navigation.stages.length) {
    return null
  }
  
  return navigation.stages[navigation.currentStage]
}

// 진행률 계산
export function getNavigationProgress(navigation: MultiStageNavigation): {
  completedStages: number
  totalStages: number
  progressPercentage: number
} {
  const completedStages = navigation.stages.filter(stage => stage.isCompleted).length
  const progressPercentage = navigation.totalStages > 0 
    ? Math.round((completedStages / navigation.totalStages) * 100)
    : 0
  
  return {
    completedStages,
    totalStages: navigation.totalStages,
    progressPercentage
  }
}
