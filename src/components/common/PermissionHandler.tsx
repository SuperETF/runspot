'use client'

import { useEffect, useState } from 'react'
import { Geolocation } from '@capacitor/geolocation'

interface PermissionHandlerProps {
  onPermissionGranted: () => void
  onPermissionDenied: () => void
}

export default function PermissionHandler({ 
  onPermissionGranted, 
  onPermissionDenied 
}: PermissionHandlerProps) {
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied' | 'prompt'>('checking')

  useEffect(() => {
    checkLocationPermission()
  }, [])

  const checkLocationPermission = async () => {
    try {
      // 현재 권한 상태 확인
      const permission = await Geolocation.checkPermissions()
      console.log('📍 현재 위치 권한 상태:', permission)

      if (permission.location === 'granted') {
        setPermissionStatus('granted')
        onPermissionGranted()
      } else if (permission.location === 'denied') {
        setPermissionStatus('denied')
        onPermissionDenied()
      } else {
        // 권한 요청
        setPermissionStatus('prompt')
        await requestLocationPermission()
      }
    } catch (error) {
      console.error('❌ 위치 권한 확인 오류:', error)
      setPermissionStatus('denied')
      onPermissionDenied()
    }
  }

  const requestLocationPermission = async () => {
    try {
      console.log('📍 위치 권한 요청 중...')
      const permission = await Geolocation.requestPermissions()
      console.log('📍 위치 권한 요청 결과:', permission)

      if (permission.location === 'granted') {
        setPermissionStatus('granted')
        onPermissionGranted()
      } else {
        setPermissionStatus('denied')
        onPermissionDenied()
      }
    } catch (error) {
      console.error('❌ 위치 권한 요청 오류:', error)
      setPermissionStatus('denied')
      onPermissionDenied()
    }
  }

  if (permissionStatus === 'checking') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">권한 확인 중</h3>
            <p className="text-gray-600">위치 권한을 확인하고 있습니다...</p>
          </div>
        </div>
      </div>
    )
  }

  if (permissionStatus === 'prompt') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">위치 권한 필요</h3>
            <p className="text-gray-600 mb-4">
              RunSpot이 런닝 코스 네비게이션을 제공하기 위해 위치 정보 접근 권한이 필요합니다.
            </p>
            <button
              onClick={requestLocationPermission}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              권한 허용하기
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (permissionStatus === 'denied') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">위치 권한 거부됨</h3>
            <p className="text-gray-600 mb-4">
              위치 권한이 거부되어 지도를 표시할 수 없습니다. 설정에서 위치 권한을 허용해주세요.
            </p>
            <button
              onClick={checkLocationPermission}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
