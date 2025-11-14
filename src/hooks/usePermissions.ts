import { useState, useEffect } from 'react'
import { usePlatformDetection } from './usePlatformDetection'

export type PermissionType = 
  | 'geolocation'
  | 'camera'
  | 'microphone'
  | 'notifications'
  | 'storage'
  | 'contacts'
  | 'calendar'
  | 'motion'
  | 'bluetooth'

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown'

type PermissionState = {
  [key in PermissionType]: PermissionStatus
}

interface PermissionRequest {
  type: PermissionType
  reason: string
  required: boolean
}

export const usePermissions = () => {
  const { isIOS, isAndroid, platform } = usePlatformDetection()
  const [permissions, setPermissions] = useState<PermissionState>({
    geolocation: 'unknown',
    camera: 'unknown',
    microphone: 'unknown',
    notifications: 'unknown',
    storage: 'unknown',
    contacts: 'unknown',
    calendar: 'unknown',
    motion: 'unknown',
    bluetooth: 'unknown'
  })

  // 권한 상태 확인
  const checkPermission = async (type: PermissionType): Promise<PermissionStatus> => {
    try {
      switch (type) {
        case 'geolocation':
          if ('geolocation' in navigator) {
            // 웹에서는 직접적인 권한 상태 확인이 제한적
            return new Promise((resolve) => {
              navigator.geolocation.getCurrentPosition(
                () => resolve('granted'),
                (error) => {
                  if (error.code === error.PERMISSION_DENIED) {
                    resolve('denied')
                  } else {
                    resolve('prompt')
                  }
                },
                { timeout: 1000 }
              )
            })
          }
          break

        case 'camera':
          if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true })
              stream.getTracks().forEach(track => track.stop())
              return 'granted'
            } catch (error: any) {
              if (error.name === 'NotAllowedError') {
                return 'denied'
              }
              return 'prompt'
            }
          }
          break

        case 'microphone':
          if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
              stream.getTracks().forEach(track => track.stop())
              return 'granted'
            } catch (error: any) {
              if (error.name === 'NotAllowedError') {
                return 'denied'
              }
              return 'prompt'
            }
          }
          break

        case 'notifications':
          if ('Notification' in window) {
            return Notification.permission as PermissionStatus
          }
          break

        case 'storage':
          if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
              await navigator.storage.estimate()
              return 'granted'
            } catch {
              return 'denied'
            }
          }
          break

        case 'motion':
          if ('DeviceMotionEvent' in window) {
            // iOS 13+에서는 권한 요청 필요
            if (isIOS && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
              try {
                const permission = await (DeviceMotionEvent as any).requestPermission()
                return permission === 'granted' ? 'granted' : 'denied'
              } catch {
                return 'denied'
              }
            }
            return 'granted'
          }
          break

        default:
          return 'unknown'
      }
    } catch (error) {
      console.error(`Error checking ${type} permission:`, error)
      return 'unknown'
    }

    return 'unknown'
  }

  // 권한 요청
  const requestPermission = async (type: PermissionType): Promise<PermissionStatus> => {
    try {
      let status: PermissionStatus = 'unknown'

      switch (type) {
        case 'geolocation':
          status = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => resolve('granted'),
              (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                  resolve('denied')
                } else {
                  resolve('prompt')
                }
              }
            )
          })
          break

        case 'camera':
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            stream.getTracks().forEach(track => track.stop())
            status = 'granted'
          } catch (error: any) {
            status = error.name === 'NotAllowedError' ? 'denied' : 'prompt'
          }
          break

        case 'microphone':
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            stream.getTracks().forEach(track => track.stop())
            status = 'granted'
          } catch (error: any) {
            status = error.name === 'NotAllowedError' ? 'denied' : 'prompt'
          }
          break

        case 'notifications':
          if ('Notification' in window) {
            if (Notification.permission === 'default') {
              const permission = await Notification.requestPermission()
              status = permission as PermissionStatus
            } else {
              status = Notification.permission as PermissionStatus
            }
          }
          break

        case 'motion':
          if (isIOS && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            try {
              const permission = await (DeviceMotionEvent as any).requestPermission()
              status = permission === 'granted' ? 'granted' : 'denied'
            } catch {
              status = 'denied'
            }
          } else {
            status = 'granted'
          }
          break

        default:
          status = 'unknown'
      }

      setPermissions(prev => ({ ...prev, [type]: status }))
      return status
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error)
      return 'denied'
    }
  }

  // 여러 권한 일괄 요청
  const requestMultiplePermissions = async (requests: PermissionRequest[]) => {
    const results: { [key in PermissionType]?: PermissionStatus } = {}
    
    for (const request of requests) {
      try {
        const status = await requestPermission(request.type)
        results[request.type] = status
        
        // 필수 권한이 거부된 경우 중단
        if (request.required && status === 'denied') {
          throw new Error(`Required permission ${request.type} was denied`)
        }
      } catch (error) {
        console.error(`Failed to request ${request.type} permission:`, error)
        results[request.type] = 'denied'
      }
    }
    
    return results
  }

  // 모든 권한 상태 확인
  const checkAllPermissions = async () => {
    const permissionTypes: PermissionType[] = [
      'geolocation', 'camera', 'microphone', 'notifications', 
      'storage', 'motion'
    ]
    
    const results: Partial<PermissionState> = {}
    
    for (const type of permissionTypes) {
      results[type] = await checkPermission(type)
    }
    
    setPermissions(prev => ({ ...prev, ...results }))
    return results
  }

  // 권한 설정 페이지로 이동
  const openPermissionSettings = () => {
    if (isIOS) {
      // iOS 설정 앱으로 이동
      window.location.href = 'app-settings:'
    } else if (isAndroid) {
      // Android 앱 설정으로 이동
      window.location.href = 'intent://settings/application_details_settings?package=com.runspot.seoul#Intent;scheme=android-app;end'
    } else {
      // 웹에서는 브라우저 설정 안내
      alert('브라우저 설정에서 권한을 변경할 수 있습니다.')
    }
  }

  // 권한별 설명 메시지
  const getPermissionDescription = (type: PermissionType): string => {
    const descriptions = {
      geolocation: '현재 위치를 확인하여 주변 런닝 코스를 추천하고 GPS 추적 기능을 제공합니다.',
      camera: '런닝 인증 사진 촬영 및 프로필 사진 등록을 위해 사용됩니다.',
      microphone: '런닝 중 음성 메모나 음성 명령을 위해 사용됩니다.',
      notifications: '런닝 리마인더, 목표 달성 알림, 친구 활동 알림을 보내기 위해 사용됩니다.',
      storage: '런닝 기록과 사진을 저장하기 위해 사용됩니다.',
      contacts: '연락처에 있는 친구들을 찾아 함께 런닝할 수 있도록 도와드립니다.',
      calendar: '런닝 일정을 캘린더에 추가하고 관리할 수 있도록 도와드립니다.',
      motion: '걸음 수 측정 및 운동 활동 감지를 위해 사용됩니다.',
      bluetooth: '스마트워치나 피트니스 트래커와 연동하여 더 정확한 운동 데이터를 제공합니다.'
    }
    
    return descriptions[type] || '앱 기능 향상을 위해 사용됩니다.'
  }

  // 초기 권한 상태 확인
  useEffect(() => {
    checkAllPermissions()
  }, [])

  return {
    permissions,
    checkPermission,
    requestPermission,
    requestMultiplePermissions,
    checkAllPermissions,
    openPermissionSettings,
    getPermissionDescription
  }
}
