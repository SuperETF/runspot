import { useEffect } from 'react'
import { useRunningStore } from '@/stores/runningStore'
import { useFriendsStore } from '@/stores/friendsStore'

/**
 * 런닝 중 자동 위치 공유를 관리하는 훅
 * RunningStore와 FriendsStore를 연동하여 런닝 상태에 따라 위치 공유를 제어
 */
export const useLocationSharing = () => {
  const trackingState = useRunningStore((state) => state.trackingState)
  const courseData = useRunningStore((state) => state.courseData)
  const currentPosition = useRunningStore((state) => state.currentPosition)
  
  const {
    locationSettings,
    isLocationSharing,
    startLocationSharing,
    stopLocationSharing,
    shareCurrentLocation,
    loadLocationSettings
  } = useFriendsStore()

  // 위치 설정 로드
  useEffect(() => {
    if (!locationSettings) {
      loadLocationSettings()
    }
  }, [locationSettings, loadLocationSettings])

  // 런닝 상태 변경에 따른 위치 공유 제어
  useEffect(() => {
    if (!locationSettings) return

    const isRunning = trackingState === 'running'
    const shouldShare = locationSettings.sharing_status !== 'disabled' && 
                       locationSettings.share_during_running

    if (isRunning && shouldShare && !isLocationSharing) {
      // 런닝 시작 시 위치 공유 시작
      startLocationSharing({
        isRunning: true,
        courseId: courseData?.id
      })
    } else if (!isRunning && isLocationSharing) {
      // 런닝 종료 시 위치 공유 중단 (running_only 모드인 경우)
      if (locationSettings.sharing_status === 'running_only') {
        stopLocationSharing()
      }
    }
  }, [
    trackingState, 
    locationSettings, 
    isLocationSharing, 
    courseData?.id,
    startLocationSharing,
    stopLocationSharing
  ])

  // 현재 위치 변경 시 즉시 위치 공유 (런닝 중일 때)
  useEffect(() => {
    if (
      currentPosition && 
      trackingState === 'running' && 
      locationSettings?.share_during_running &&
      isLocationSharing
    ) {
      shareCurrentLocation(
        currentPosition.lat,
        currentPosition.lng,
        {
          isRunning: true,
          courseId: courseData?.id
        }
      )
    }
  }, [
    currentPosition,
    trackingState,
    locationSettings?.share_during_running,
    isLocationSharing,
    courseData?.id,
    shareCurrentLocation
  ])

  return {
    isLocationSharing,
    locationSettings,
    startLocationSharing,
    stopLocationSharing
  }
}
