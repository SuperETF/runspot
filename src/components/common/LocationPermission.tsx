'use client'

import { useState, useEffect } from 'react'
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react'

interface LocationPermissionProps {
  onPermissionGranted: (position: GeolocationPosition) => void
  onPermissionDenied: () => void
}

export default function LocationPermission({ onPermissionGranted, onPermissionDenied }: LocationPermissionProps) {
  const [permissionState, setPermissionState] = useState<'unknown' | 'requesting' | 'granted' | 'denied'>('unknown')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 위치 권한 상태 확인
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          getCurrentLocation()
        } else if (result.state === 'denied') {
          setPermissionState('denied')
        }
      })
    }
  }, [])

  const getCurrentLocation = () => {
    setPermissionState('requesting')
    setError(null)

    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 서비스를 지원하지 않습니다.')
      setPermissionState('denied')
      onPermissionDenied()
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPermissionState('granted')
        onPermissionGranted(position)
      },
      (error) => {
        setPermissionState('denied')
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('위치 정보 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.')
            break
          case error.POSITION_UNAVAILABLE:
            setError('위치 정보를 사용할 수 없습니다.')
            break
          case error.TIMEOUT:
            setError('위치 정보 요청 시간이 초과되었습니다.')
            break
          default:
            setError('알 수 없는 오류가 발생했습니다.')
            break
        }
        
        onPermissionDenied()
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  if (permissionState === 'granted') {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>위치 정보 사용 중</span>
      </div>
    )
  }

  if (permissionState === 'requesting') {
    return (
      <div className="bg-gray-900/90 glass rounded-2xl p-6 border border-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FF88] mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">위치 정보 요청 중</h3>
          <p className="text-gray-400 text-sm">
            브라우저에서 위치 정보 접근을 허용해주세요
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/90 glass rounded-2xl p-6 border border-gray-800">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-[#00FF88] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">위치 정보 필요</h3>
        <p className="text-gray-400 text-sm mb-4">
          런닝 경로 추적을 위해 위치 정보가 필요합니다
        </p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <button
          onClick={getCurrentLocation}
          className="bg-[#00FF88] hover:bg-[#00E077] text-black font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          위치 정보 허용
        </button>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>• 위치 정보는 런닝 경로 추적에만 사용됩니다</p>
          <p>• 개인정보는 저장되지 않습니다</p>
        </div>
      </div>
    </div>
  )
}
