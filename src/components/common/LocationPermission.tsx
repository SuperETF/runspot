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
        } else {
          // prompt 상태인 경우 자동으로 권한 요청
          setTimeout(() => {
            getCurrentLocation()
          }, 500)
        }
      }).catch(() => {
        // permissions API를 지원하지 않는 경우 바로 권한 요청
        setTimeout(() => {
          getCurrentLocation()
        }, 500)
      })
    } else {
      // permissions API를 지원하지 않는 경우 바로 권한 요청
      setTimeout(() => {
        getCurrentLocation()
      }, 500)
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
            setError('위치 정보 접근이 거부되었습니다. 브라우저 주소창 옆의 위치 아이콘을 클릭하여 위치 권한을 허용해주세요.')
            break
          case error.POSITION_UNAVAILABLE:
            setError('위치 정보를 사용할 수 없습니다. GPS가 켜져 있는지 확인해주세요.')
            break
          case error.TIMEOUT:
            setError('위치 정보 요청 시간이 초과되었습니다. 다시 시도해주세요.')
            break
          default:
            setError('위치 정보를 가져올 수 없습니다. 다시 시도해주세요.')
            break
        }
        
        onPermissionDenied()
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
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
      <div className="bg-card/90 glass rounded-2xl p-6 border border-border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-foreground mb-2">위치 정보 요청 중</h3>
          <p className="text-muted-foreground text-sm">
            브라우저에서 위치 정보 접근을 허용해주세요
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card/90 glass rounded-2xl p-6 border border-border">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">위치 정보 필요</h3>
        <p className="text-muted-foreground text-sm mb-4">
          런닝 경로 추적을 위해 위치 정보가 필요합니다.<br />
          <span className="text-primary font-medium">브라우저에서 위치 허용을 선택해주세요.</span>
        </p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <div className="flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="mb-2">{error}</p>
                {error.includes('거부') && (
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>📱 <strong>모바일 브라우저:</strong></p>
                    <p>1. 주소창 옆 자물쇠/위치 아이콘 클릭</p>
                    <p>2. 위치 권한을 '허용'으로 변경</p>
                    <p>3. 페이지 새로고침</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={getCurrentLocation}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          위치 정보 허용
        </button>
        
        <div className="mt-4 text-xs text-muted-foreground/70">
          <p>• 위치 정보는 런닝 경로 추적에만 사용됩니다</p>
          <p>• 개인정보는 저장되지 않습니다</p>
          <p className="mt-2 text-primary">💡 모바일에서는 브라우저 설정에서 위치 권한을 허용해주세요</p>
        </div>
      </div>
    </div>
  )
}
