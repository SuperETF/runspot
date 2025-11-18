'use client'

export interface GPSPoint {
  lat: number
  lng: number
  timestamp: number
  accuracy: number
  speed: number | null
  heading: number | null
}

export interface TrackingSession {
  id: string
  courseId: string
  startTime: number
  endTime?: number
  isActive: boolean
  gpsPoints: GPSPoint[]
}

class BackgroundGPSTracker {
  private watchId: number | null = null
  private currentSession: TrackingSession | null = null
  private isTracking = false

  // GPS 추적 시작
  startTracking(courseId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.isTracking) {
        reject(new Error('이미 추적 중입니다.'))
        return
      }

      if (!navigator.geolocation) {
        reject(new Error('GPS를 지원하지 않는 브라우저입니다.'))
        return
      }

      // 새 추적 세션 생성
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.currentSession = {
        id: sessionId,
        courseId,
        startTime: Date.now(),
        isActive: true,
        gpsPoints: []
      }

      // GPS 추적 옵션
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000 // 5초 캐시
      }

      // GPS 추적 시작
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.handleGPSUpdate(position)
        },
        (error) => {
          console.error('GPS 추적 오류:', error)
          this.handleGPSError(error)
        },
        options
      )

      this.isTracking = true
      
      // 로컬 스토리지에 세션 저장
      this.saveSessionToStorage()
      
      console.log('🎯 백그라운드 GPS 추적 시작:', sessionId)
      resolve(sessionId)
    })
  }

  // GPS 데이터 업데이트 처리
  private handleGPSUpdate(position: GeolocationPosition) {
    if (!this.currentSession || !this.currentSession.isActive) return

    const gpsPoint: GPSPoint = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: Date.now(),
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading
    }

    // GPS 포인트 추가
    this.currentSession.gpsPoints.push(gpsPoint)
    
    // 로컬 스토리지에 실시간 저장
    this.saveSessionToStorage()
    
    console.log('📍 GPS 업데이트:', {
      lat: gpsPoint.lat.toFixed(6),
      lng: gpsPoint.lng.toFixed(6),
      accuracy: gpsPoint.accuracy,
      totalPoints: this.currentSession.gpsPoints.length
    })

    // 배터리 최적화: 100개 포인트마다 오래된 데이터 정리
    if (this.currentSession.gpsPoints.length > 1000) {
      this.currentSession.gpsPoints = this.currentSession.gpsPoints.slice(-800)
    }
  }

  // GPS 오류 처리
  private handleGPSError(error: GeolocationPositionError) {
    let errorMessage = ''
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'GPS 권한이 거부되었습니다.'
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'GPS 위치를 가져올 수 없습니다.'
        break
      case error.TIMEOUT:
        errorMessage = 'GPS 요청 시간이 초과되었습니다.'
        break
      default:
        errorMessage = 'GPS 오류가 발생했습니다.'
        break
    }
    
    console.error('GPS 오류:', errorMessage)
    
    // 오류가 발생해도 추적은 계속 시도 (일시적 오류일 수 있음)
  }

  // GPS 추적 중단
  stopTracking(): TrackingSession | null {
    if (!this.isTracking || !this.currentSession) {
      console.warn('추적 중인 세션이 없습니다.')
      return null
    }

    // GPS 추적 중단
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    // 세션 종료
    this.currentSession.isActive = false
    this.currentSession.endTime = Date.now()
    
    // 최종 저장
    this.saveSessionToStorage()
    
    const completedSession = { ...this.currentSession }
    
    console.log('🛑 GPS 추적 중단:', {
      sessionId: completedSession.id,
      duration: completedSession.endTime! - completedSession.startTime,
      totalPoints: completedSession.gpsPoints.length
    })

    // 상태 초기화
    this.currentSession = null
    this.isTracking = false

    return completedSession
  }

  // 로컬 스토리지에 세션 저장
  private saveSessionToStorage() {
    if (!this.currentSession) return

    try {
      const storageKey = `gps_session_${this.currentSession.id}`
      localStorage.setItem(storageKey, JSON.stringify(this.currentSession))
      
      // 활성 세션 ID도 저장
      localStorage.setItem('active_gps_session', this.currentSession.id)
    } catch (error) {
      console.error('GPS 세션 저장 실패:', error)
    }
  }

  // 저장된 세션 복구
  recoverSession(): TrackingSession | null {
    try {
      const activeSessionId = localStorage.getItem('active_gps_session')
      if (!activeSessionId) return null

      const storageKey = `gps_session_${activeSessionId}`
      const sessionData = localStorage.getItem(storageKey)
      if (!sessionData) return null

      const session: TrackingSession = JSON.parse(sessionData)
      
      // 세션이 24시간 이상 오래되었으면 무시
      if (Date.now() - session.startTime > 24 * 60 * 60 * 1000) {
        this.clearSession(activeSessionId)
        return null
      }

      console.log('🔄 GPS 세션 복구:', {
        sessionId: session.id,
        pointCount: session.gpsPoints.length,
        age: Date.now() - session.startTime
      })

      return session
    } catch (error) {
      console.error('GPS 세션 복구 실패:', error)
      return null
    }
  }

  // 세션 정리
  clearSession(sessionId: string) {
    try {
      localStorage.removeItem(`gps_session_${sessionId}`)
      localStorage.removeItem('active_gps_session')
      console.log('🗑️ GPS 세션 정리 완료:', sessionId)
    } catch (error) {
      console.error('GPS 세션 정리 실패:', error)
    }
  }

  // 현재 추적 상태 확인
  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      currentSession: this.currentSession,
      pointCount: this.currentSession?.gpsPoints.length || 0
    }
  }

  // 현재 세션의 GPS 데이터 가져오기
  getCurrentGPSData(): GPSPoint[] {
    return this.currentSession?.gpsPoints || []
  }
}

// 싱글톤 인스턴스
export const backgroundGPSTracker = new BackgroundGPSTracker()
