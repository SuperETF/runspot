// 카카오맵 SDK 기반 앱 내 네비게이션 서비스

export interface KakaoRoutePoint {
  lat: number
  lng: number
}

export interface KakaoRouteSegment {
  points: KakaoRoutePoint[]
  distance: number // 미터
  duration: number // 초
  instruction: string
  turnType: 'straight' | 'left' | 'right' | 'u-turn'
}

export interface KakaoNavigationRoute {
  segments: KakaoRouteSegment[]
  totalDistance: number
  totalDuration: number
  bounds: {
    sw: KakaoRoutePoint
    ne: KakaoRoutePoint
  }
}

export interface TurnInstruction {
  distance: number // 다음 턴까지 거리 (m)
  instruction: string // "200m 후 좌회전하세요"
  turnType: 'straight' | 'left' | 'right' | 'u-turn'
  streetName?: string
  coordinates: KakaoRoutePoint
}

export class KakaoNavigationService {
  private kakao: any
  
  constructor() {
    this.kakao = (window as any).kakao
  }

  /**
   * 카카오맵 길찾기 API로 경로 계산
   */
  async calculateRoute(
    origin: KakaoRoutePoint, 
    destination: KakaoRoutePoint,
    waypoints: KakaoRoutePoint[] = []
  ): Promise<KakaoNavigationRoute> {
    try {
      // 카카오맵 길찾기 서비스 사용
      const ps = new this.kakao.maps.services.Places()
      
      // 실제로는 카카오 Mobility API 또는 다른 길찾기 서비스 필요
      // 여기서는 단순한 직선 경로로 MVP 구현
      const route = this.createSimpleRoute(origin, destination, waypoints)
      
      return route
    } catch (error) {
      console.error('카카오 길찾기 실패:', error)
      throw error
    }
  }

  /**
   * 단순한 직선 경로 생성 (MVP용)
   * 실제로는 카카오 Mobility API 사용 필요
   */
  private createSimpleRoute(
    origin: KakaoRoutePoint, 
    destination: KakaoRoutePoint,
    waypoints: KakaoRoutePoint[] = []
  ): KakaoNavigationRoute {
    const allPoints = [origin, ...waypoints, destination]
    const segments: KakaoRouteSegment[] = []
    
    for (let i = 0; i < allPoints.length - 1; i++) {
      const start = allPoints[i]
      const end = allPoints[i + 1]
      
      const distance = this.calculateDistance(start, end)
      const duration = distance / 50 * 3.6 // 50km/h 가정
      
      segments.push({
        points: [start, end],
        distance,
        duration,
        instruction: i === 0 ? '목적지까지 직진하세요' : `${Math.round(distance)}m 후 직진하세요`,
        turnType: 'straight'
      })
    }

    const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0)
    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0)

    return {
      segments,
      totalDistance,
      totalDuration,
      bounds: {
        sw: { 
          lat: Math.min(origin.lat, destination.lat), 
          lng: Math.min(origin.lng, destination.lng) 
        },
        ne: { 
          lat: Math.max(origin.lat, destination.lat), 
          lng: Math.max(origin.lng, destination.lng) 
        }
      }
    }
  }

  /**
   * 현재 위치 기준 다음 턴 안내 계산
   */
  getNextTurnInstruction(
    route: KakaoNavigationRoute, 
    currentPosition: KakaoRoutePoint
  ): TurnInstruction | null {
    // 현재 위치에서 가장 가까운 경로 세그먼트 찾기
    let nearestSegment = route.segments[0]
    let minDistance = Infinity
    
    for (const segment of route.segments) {
      for (const point of segment.points) {
        const distance = this.calculateDistance(currentPosition, point)
        if (distance < minDistance) {
          minDistance = distance
          nearestSegment = segment
        }
      }
    }

    // 다음 턴까지의 거리 계산
    const distanceToTurn = this.calculateDistance(
      currentPosition, 
      nearestSegment.points[nearestSegment.points.length - 1]
    )

    return {
      distance: Math.round(distanceToTurn),
      instruction: nearestSegment.instruction,
      turnType: nearestSegment.turnType,
      coordinates: nearestSegment.points[nearestSegment.points.length - 1]
    }
  }

  /**
   * Haversine 거리 계산 (미터)
   */
  private calculateDistance(point1: KakaoRoutePoint, point2: KakaoRoutePoint): number {
    const R = 6371000 // 지구 반지름 (미터)
    const dLat = this.toRad(point2.lat - point1.lat)
    const dLng = this.toRad(point2.lng - point1.lng)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180
  }

  /**
   * 턴 타입에 따른 아이콘 반환
   */
  getTurnIcon(turnType: string): string {
    switch (turnType) {
      case 'left': return '↰'
      case 'right': return '↱'
      case 'u-turn': return '↶'
      case 'straight': 
      default: return '↑'
    }
  }
}

// 싱글톤 인스턴스
export const kakaoNavService = new KakaoNavigationService()
