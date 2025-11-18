/**
 * 카카오 길찾기 기반 네비게이션 및 음성 안내 유틸리티
 * 
 * @description 이 파일은 카카오맵 길찾기 API를 활용한 네비게이션과 음성 안내 전용입니다.
 * 
 * **역할 구분:**
 * - navigationEngine.ts: 순수 좌표 계산 및 코스 기반 1인칭 네비게이션 (NavigationProgress)
 * - kakaoNavigation.ts: 카카오 길찾기 기반 네비게이션 및 음성 안내 (NavigationState)
 * 
 * **사용 예시:**
 * - 1인칭 모드: navigationEngine.getProgressOnRoute() 사용
 * - 카카오 네비: kakaoNavigation.createRunningNavigation() + 음성 안내
 * 
 * @version 1.0.0
 */

import { GPSCoordinate } from '@/types/database'
import { haversineDistance, calculateBearing } from './navigationEngine'

// 디버깅 플래그
const DEBUG = process.env.NODE_ENV === 'development'

// 카카오맵 길찾기 API 타입 정의
interface KakaoDirectionsResponse {
  routes: Array<{
    summary: {
      distance: number
      duration: number
    }
    sections: Array<{
      distance: number
      duration: number
      roads: Array<{
        name: string
        distance: number
        duration: number
        traffic_speed: number
        traffic_state: number
        vertexes: number[]
      }>
      guides: Array<{
        name: string
        distance: number
        duration: number
        type: number
        guidance: string
        road_index: number
        traffic_color: string
      }>
    }>
  }>
}

/**
 * 카카오 길찾기 기반 네비게이션 상태 타입
 * 
 * @description 카카오맵 Directions API를 활용한 네비게이션 상태를 나타냅니다.
 * navigationEngine.ts의 NavigationProgress와는 다른 목적으로 사용됩니다.
 * 
 * **차이점:**
 * - NavigationProgress: 코스 기반 1인칭 네비게이션 (진행률, 이탈 여부 등)
 * - NavigationState: 카카오 길찾기 기반 네비게이션 (음성 안내, 경로 지시 등)
 */
export interface NavigationState {
  isActive: boolean                    // 네비게이션 활성 상태
  currentRoute: GPSCoordinate[]        // 현재 경로 (카카오 API 결과)
  currentGuideIndex: number            // 현재 안내 인덱스
  nextGuide: {                         // 다음 안내 정보 (음성 안내용)
    instruction: string                // 안내 메시지
    distance: number                   // 다음 안내까지 거리 (m)
    direction: string                  // 방향 지시
  } | null
  totalDistance: number                // 전체 경로 거리 (km)
  remainingDistance: number            // 남은 거리 (km)
  estimatedTime: number                // 예상 소요 시간 (초)
}

// 카카오맵 길찾기 API 호출
export async function getKakaoDirections(
  origin: GPSCoordinate,
  destination: GPSCoordinate,
  waypoints?: GPSCoordinate[]
): Promise<KakaoDirectionsResponse | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY
    if (!apiKey) {
      console.error('카카오맵 API 키가 설정되지 않았습니다.')
      return null
    }

    // 실제로는 카카오 길찾기 API를 사용해야 하지만, 
    // 현재는 런닝 코스 기반으로 간단한 네비게이션 구현
    void (DEBUG && console.log('카카오 길찾기 API 호출:', { origin, destination, waypoints }))
    
    // 임시로 null 반환 (실제 API 연동 시 구현)
    return null
  } catch (error) {
    void (DEBUG && console.error('카카오 길찾기 API 오류:', error))
    return null
  }
}

/**
 * 런닝 코스 기반 네비게이션 생성 (카카오 길찾기 대신 사용)
 * 
 * @description 카카오 Directions API가 아닌 기존 코스 데이터를 활용한 네비게이션.
 * 주로 음성 안내와 경로 지시를 위해 사용됩니다.
 * 
 * **주의:** 1인칭 모드에서는 navigationEngine.getProgressOnRoute()를 사용하세요.
 * 
 * @param courseRoute 코스 경로 데이터
 * @param currentPosition 현재 위치
 * @returns NavigationState 카카오 네비게이션 상태
 */
export function createRunningNavigation(
  courseRoute: GPSCoordinate[],
  currentPosition: GPSCoordinate
): NavigationState {
  if (!courseRoute || courseRoute.length === 0) {
    return {
      isActive: false,
      currentRoute: [],
      currentGuideIndex: 0,
      nextGuide: null,
      totalDistance: 0,
      remainingDistance: 0,
      estimatedTime: 0
    }
  }

  // 현재 위치에서 가장 가까운 코스 포인트 찾기
  let closestIndex = 0
  let minDistance = Infinity
  
  courseRoute.forEach((point, index) => {
    const distance = calculateDistance(currentPosition, point)
    if (distance < minDistance) {
      minDistance = distance
      closestIndex = index
    }
  })

  // 남은 경로 계산
  const remainingRoute = courseRoute.slice(closestIndex)
  const totalDistance = calculateRouteDistance(courseRoute)
  const remainingDistance = calculateRouteDistance(remainingRoute)

  // 다음 안내 생성
  const nextGuide = generateNextGuide(remainingRoute, currentPosition)

  return {
    isActive: true,
    currentRoute: remainingRoute,
    currentGuideIndex: closestIndex,
    nextGuide,
    totalDistance,
    remainingDistance,
    estimatedTime: Math.round(remainingDistance / 0.2) * 60 // 12km/h 평균 속도 가정
  }
}

// 두 GPS 좌표 간 거리 계산 (km) - navigationEngine 함수 사용
function calculateDistance(point1: GPSCoordinate, point2: GPSCoordinate): number {
  return haversineDistance(point1, point2) / 1000 // 미터를 km로 변환
}

// 경로 총 거리 계산
function calculateRouteDistance(route: GPSCoordinate[]): number {
  if (route.length < 2) return 0
  
  let totalDistance = 0
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += calculateDistance(route[i], route[i + 1])
  }
  return totalDistance
}

// 다음 안내 메시지 생성
function generateNextGuide(
  remainingRoute: GPSCoordinate[],
  currentPosition: GPSCoordinate
): NavigationState['nextGuide'] {
  if (remainingRoute.length < 2) {
    return {
      instruction: "목적지에 도착했습니다",
      distance: 0,
      direction: "완료"
    }
  }

  const nextPoint = remainingRoute[1]
  const distance = calculateDistance(currentPosition, nextPoint)
  
  // 방향 계산 (간단한 방위각 기반)
  const bearing = calculateBearing(currentPosition, nextPoint)
  const direction = getDirectionFromBearing(bearing)

  return {
    instruction: `${Math.round(distance * 1000)}m 후 ${direction}`,
    distance: distance * 1000, // 미터 단위
    direction
  }
}

// 방위각 계산 - navigationEngine 함수 사용 (중복 제거)
// calculateBearing 함수는 navigationEngine에서 import하여 사용

// 방위각을 방향 텍스트로 변환
function getDirectionFromBearing(bearing: number): string {
  const directions = [
    "북쪽으로 직진",
    "북동쪽으로 이동",
    "동쪽으로 우회전",
    "남동쪽으로 이동", 
    "남쪽으로 직진",
    "남서쪽으로 이동",
    "서쪽으로 좌회전",
    "북서쪽으로 이동"
  ]
  
  const index = Math.round(bearing / 45) % 8
  return directions[index]
}

/**
 * 음성 안내 메시지 생성
 * 
 * @description NavigationState의 nextGuide 정보를 기반으로 음성 안내 메시지를 생성합니다.
 * 거리에 따라 다른 형태의 메시지를 제공합니다.
 * 
 * @param guide 다음 안내 정보
 * @returns 음성 안내용 문자열
 */
export function generateVoiceGuidance(guide: NavigationState['nextGuide']): string {
  if (!guide) return ""
  
  if (guide.distance < 50) {
    return `곧 ${guide.direction}하세요`
  } else if (guide.distance < 200) {
    return `${Math.round(guide.distance)}미터 후 ${guide.direction}하세요`
  } else {
    return `${Math.round(guide.distance / 100) * 100}미터 후 ${guide.direction}하세요`
  }
}

/**
 * 음성 안내 실행
 * 
 * @description Web Speech API를 사용하여 네비게이션 음성 안내를 실행합니다.
 * 이전 음성을 중단하고 새로운 메시지를 재생합니다.
 * 
 * @param message 음성으로 안내할 메시지
 */
export function speakNavigation(message: string): void {
  if ('speechSynthesis' in window && message.trim()) {
    // 이전 음성 중단
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.lang = 'ko-KR'
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 0.8
    
    // 에러 처리
    utterance.onerror = (event) => {
      void (DEBUG && console.error('음성 안내 오류:', event.error))
    }
    
    window.speechSynthesis.speak(utterance)
    void (DEBUG && console.log('🔊 음성 안내 실행:', message))
  }
}
