'use client'

import { useState, useEffect } from 'react'
import { Navigation, MapPin, AlertTriangle, CheckCircle, Clock, Zap, Target, Route } from 'lucide-react'
import { useRunningStore } from '@/stores/runningStore'

interface NavigationGuideProps {
  userLocation: { lat: number; lng: number } | null
  courseRoute: Array<{ lat: number; lng: number }>
  currentCheckpoint: number
  isRunning: boolean
  onCheckpointReached?: (checkpoint: number) => void
  onStartNavigation?: () => void
  onStopNavigation?: () => void
  isNavigationMode?: boolean
}

interface NavigationInfo {
  distanceToNext: number
  direction: string
  isOnTrack: boolean
  nextCheckpoint: { lat: number; lng: number } | null
  deviation: number
}

export default function NavigationGuide({
  userLocation,
  courseRoute,
  currentCheckpoint,
  isRunning,
  onCheckpointReached,
  onStartNavigation,
  onStopNavigation,
  isNavigationMode = false
}: NavigationGuideProps) {
  const [navigationInfo, setNavigationInfo] = useState<NavigationInfo>({
    distanceToNext: 0,
    direction: '',
    isOnTrack: true,
    nextCheckpoint: null,
    deviation: 0
  })
  const [lastAnnouncedCheckpoint, setLastAnnouncedCheckpoint] = useState(-1)
  const [lastOffTrackWarning, setLastOffTrackWarning] = useState(0)

  const totalCourseDistance = useRunningStore((state) => state.totalCourseDistance)
  const distanceAlongCourse = useRunningStore((state) => state.distanceAlongCourse)
  const remainingCourseDistance = useRunningStore((state) => state.remainingCourseDistance)
  const currentStats = useRunningStore((state) => state.currentStats)

  // 음성 안내 함수
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ko-KR'
      utterance.rate = 0.9
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }

  // 두 지점 간 거리 계산 (Haversine 공식)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000 // 지구 반지름 (미터)
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // 방향 계산 (베어링)
  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
    const dLng = (lng2 - lng1) * Math.PI / 180
    const lat1Rad = lat1 * Math.PI / 180
    const lat2Rad = lat2 * Math.PI / 180
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI
    bearing = (bearing + 360) % 360
    
    // 8방향으로 변환
    const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
    const index = Math.round(bearing / 45) % 8
    return directions[index]
  }

  // 코스에서 가장 가까운 지점 찾기
  const findNearestPointOnRoute = (userLat: number, userLng: number): { distance: number; index: number } => {
    let minDistance = Infinity
    let nearestIndex = 0
    
    for (let i = 0; i < courseRoute.length; i++) {
      const distance = calculateDistance(userLat, userLng, courseRoute[i].lat, courseRoute[i].lng)
      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = i
      }
    }
    
    return { distance: minDistance, index: nearestIndex }
  }

  // 네비게이션 정보 업데이트
  useEffect(() => {
    if (!userLocation || !courseRoute || courseRoute.length === 0 || !isRunning) return

    const nextCheckpointIndex = Math.min(currentCheckpoint + 1, courseRoute.length - 1)
    const nextCheckpoint = courseRoute[nextCheckpointIndex]
    
    if (!nextCheckpoint) return

    // 다음 체크포인트까지의 거리와 방향
    const distanceToNext = calculateDistance(
      userLocation.lat, userLocation.lng,
      nextCheckpoint.lat, nextCheckpoint.lng
    )
    
    const direction = calculateBearing(
      userLocation.lat, userLocation.lng,
      nextCheckpoint.lat, nextCheckpoint.lng
    )

    // 코스 이탈 여부 확인
    const { distance: deviation } = findNearestPointOnRoute(userLocation.lat, userLocation.lng)
    const isOnTrack = deviation < 50 // 50미터 이내면 코스 내

    // 체크포인트 도달 확인 (30미터 이내)
    if (distanceToNext < 30 && nextCheckpointIndex > currentCheckpoint) {
      onCheckpointReached?.(nextCheckpointIndex)
    }

    // 음성 안내
    const now = Date.now()
    
    // 체크포인트 접근 안내 (100미터 이내, 한 번만)
    if (distanceToNext < 100 && distanceToNext > 30 && lastAnnouncedCheckpoint !== nextCheckpointIndex) {
      speak(`체크포인트가 ${Math.round(distanceToNext)}미터 앞에 있습니다. ${direction} 방향으로 이동하세요.`)
      setLastAnnouncedCheckpoint(nextCheckpointIndex)
    }
    
    // 코스 이탈 경고 (30초마다 한 번)
    if (!isOnTrack && now - lastOffTrackWarning > 30000) {
      speak(`코스에서 벗어났습니다. 코스로 돌아가세요.`)
      setLastOffTrackWarning(now)
    }
    
    // 체크포인트 통과 안내
    if (distanceToNext < 30 && nextCheckpointIndex > currentCheckpoint) {
      if (nextCheckpointIndex === courseRoute.length - 1) {
        speak('완주 지점에 도착했습니다! 수고하셨습니다!')
      } else {
        speak(`체크포인트 ${nextCheckpointIndex + 1}을 통과했습니다.`)
      }
    }

    setNavigationInfo({
      distanceToNext,
      direction,
      isOnTrack,
      nextCheckpoint,
      deviation
    })
  }, [userLocation, courseRoute, currentCheckpoint, isRunning, onCheckpointReached])

  // 컴포넌트 언마운트 시 음성 합성 정리
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel()
      }
    }
  }, [])

  if (!isRunning || !userLocation || !navigationInfo.nextCheckpoint) {
    return null
  }

  const { distanceToNext, direction, isOnTrack, deviation } = navigationInfo
  const isNearCheckpoint = distanceToNext < 100 // 100미터 이내

  const startPoint = courseRoute[0]
  const distanceToStartPoint = startPoint && userLocation
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        startPoint.lat,
        startPoint.lng
      )
    : null

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

const formatPace = (paceMinutes: number) => {
  if (!paceMinutes || paceMinutes <= 0) return "0'00\""
  const minutes = Math.floor(paceMinutes)
  const seconds = Math.round((paceMinutes - minutes) * 60)
  return `${minutes}'${seconds.toString().padStart(2, '0')}"`
}

  const remainingKm = Math.max(0, remainingCourseDistance)
  const alongKm = Math.max(0, distanceAlongCourse)
  const totalKm = Math.max(0, totalCourseDistance)
  const durationSec = currentStats.duration
  const paceMinutes = currentStats.pace

  return (
    <div className="fixed bottom-24 left-4 right-4 z-30">
      <div className={`rounded-2xl p-4 shadow-lg border-2 transition-all duration-300 ${
        !isOnTrack 
          ? 'bg-red-500 border-red-400' 
          : isNearCheckpoint 
            ? 'bg-[#00FF88] border-[#00FF88]' 
            : 'bg-white border-gray-300'
      }`}>
        <div className="flex items-center gap-3">
          {/* 상태 아이콘 */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            !isOnTrack 
              ? 'bg-white/20' 
              : isNearCheckpoint 
                ? 'bg-black/20' 
                : 'bg-gray-900/20'
          }`}>
            {!isOnTrack ? (
              <AlertTriangle className="w-5 h-5 text-white" />
            ) : isNearCheckpoint ? (
              <CheckCircle className="w-5 h-5 text-black" />
            ) : (
              <Navigation className="w-5 h-5 text-black" />
            )}
          </div>

          {/* 네비게이션 정보 */}
          <div className={`flex-1 ${
            !isOnTrack 
              ? 'text-white' 
              : isNearCheckpoint 
                ? 'text-black' 
                : 'text-black'
          }`}>
            {!isOnTrack ? (
              <div>
                <p className="font-bold text-sm">⚠️ 코스 이탈</p>
                <p className="text-xs opacity-90">
                  코스에서 {Math.round(deviation)}m 벗어났습니다. 코스로 돌아가세요.
                </p>
              </div>
            ) : isNearCheckpoint ? (
              <div>
                <p className="font-bold text-sm text-black">🎯 체크포인트 접근</p>
                <p className="text-xs text-black/80">
                  {Math.round(distanceToNext)}m 앞 • {direction} 방향
                </p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-sm text-black">📍 다음 체크포인트</p>
                <p className="text-xs text-black/70">
                  {Math.round(distanceToNext)}m 앞 • {direction} 방향
                </p>
              </div>
            )}
          </div>

          {/* 다음 체크포인트까지 거리 & 네비게이션 버튼 */}
          <div className="text-right flex items-center gap-2">
            <div>
              <div className={`text-lg font-bold ${
                !isOnTrack ? 'text-white' : isNearCheckpoint ? 'text-black' : 'text-black'
              }`}>
                {Math.round(distanceToNext)}m
              </div>
              <div className={`text-xs ${
                !isOnTrack ? 'text-white/80' : isNearCheckpoint ? 'text-black/80' : 'text-black/70'
              }`}>
                {currentCheckpoint + 1}/{courseRoute.length}
              </div>
            </div>
            
            {/* 네비게이션 버튼 */}
            {isRunning && (
              <button
                onClick={isNavigationMode ? onStopNavigation : onStartNavigation}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isNavigationMode 
                    ? 'bg-orange-500 hover:bg-orange-600' 
                    : !isOnTrack 
                      ? 'bg-white/20 hover:bg-white/30'
                      : 'bg-black/20 hover:bg-black/30'
                }`}
                title={isNavigationMode ? '네비게이션 종료' : '길찾기 시작'}
              >
                <Route className={`w-4 h-4 ${
                  isNavigationMode 
                    ? 'text-white' 
                    : !isOnTrack 
                      ? 'text-white' 
                      : 'text-black'
                }`} />
              </button>
            )}
          </div>
        </div>

        {/* 하단: 코스 네비게이션 요약 (자동차 내비 스타일) */}
        <div className={`mt-4 flex flex-col gap-2 text-xs ${
          !isOnTrack ? 'text-white' : 'text-black'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-1 ${
              !isOnTrack ? 'text-white/80' : 'text-black/70'
            }`}>
              <Navigation className="w-3 h-3" />
              남은 거리
            </span>
            <span className={`text-sm font-semibold ${
              !isOnTrack ? 'text-white' : 'text-black'
            }`}>
              {remainingKm.toFixed(2)} km
            </span>
          </div>

          {distanceToStartPoint !== null && (
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1 ${
                !isOnTrack ? 'text-white/80' : 'text-black/70'
              }`}>
                <MapPin className="w-3 h-3" />
                시작점까지
              </span>
              <span className={`text-sm font-semibold ${
                !isOnTrack ? 'text-white' : 'text-black'
              }`}>
                {Math.round(distanceToStartPoint)} m
              </span>
            </div>
          )}

          {/* 페이스 정보 */}
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-1 ${
              !isOnTrack ? 'text-white/80' : 'text-black/70'
            }`}>
              <Zap className="w-3 h-3" />
              페이스
            </span>
            <span className={`text-sm font-semibold ${
              !isOnTrack ? 'text-white' : 'text-black'
            }`}>
              {formatPace(paceMinutes)}
            </span>
          </div>

          {/* 코스 진행률 */}
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-1 ${
              !isOnTrack ? 'text-white/80' : 'text-black/70'
            }`}>
              <Target className="w-3 h-3" />
              진행률
            </span>
            <span className={`text-sm font-semibold ${
              !isOnTrack ? 'text-white' : 'text-black'
            }`}>
              {totalKm > 0 ? `${((alongKm / totalKm) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>

          <div className={`flex items-center justify-between ${
            !isOnTrack ? 'text-white/70' : 'text-black/60'
          }`}>
            <span>
              진행 {alongKm.toFixed(2)} km / 전체 {totalKm.toFixed(2)} km
            </span>
          </div>

          <div className={`flex items-center justify-between ${
            !isOnTrack ? 'text-white/60' : 'text-black/50'
          }`}>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              경과 {formatTime(durationSec)}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              페이스 {formatPace(paceMinutes)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
