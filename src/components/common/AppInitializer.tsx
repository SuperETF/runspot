'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import PermissionHandler from './PermissionHandler'

interface AppInitializerProps {
  children: React.ReactNode
}

export default function AppInitializer({ children }: AppInitializerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isNativeApp, setIsNativeApp] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [showPermissionHandler, setShowPermissionHandler] = useState(false)

  useEffect(() => {
    // Capacitor 네이티브 환경인지 확인
    const isNative = Capacitor.isNativePlatform()
    setIsNativeApp(isNative)
    
    console.log('🔧 앱 환경:', isNative ? 'Native App' : 'Web Browser')

    if (isNative) {
      // 네이티브 앱인 경우 권한 체크 필요
      setShowPermissionHandler(true)
    } else {
      // 웹 브라우저인 경우 권한 체크 불필요
      setPermissionGranted(true)
    }
  }, [])

  const handlePermissionGranted = () => {
    console.log('✅ 위치 권한 허용됨')
    setPermissionGranted(true)
    setShowPermissionHandler(false)
  }

  const handlePermissionDenied = () => {
    console.log('❌ 위치 권한 거부됨')
    setPermissionGranted(false)
    setShowPermissionHandler(false) // 권한 거부되어도 앱 계속 실행
  }

  // 모바일 앱에서 홈 페이지 접근 시 게스트 모드 체크
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (isNativeApp && pathname === '/' && !showPermissionHandler) {
      // 게스트 모드 확인
      const isGuestMode = typeof window !== 'undefined' && localStorage.getItem('runspot_guest_mode') === 'true'
      
      if (!isGuestMode) {
        console.log('📱 게스트 모드 아님 → 로그인 페이지로 리다이렉트')
        router.push('/login')
      } else {
        console.log('📱 게스트 모드 → 홈 화면 허용')
        setAuthChecked(true)
      }
    } else {
      setAuthChecked(true)
    }
  }, [isNativeApp, pathname, showPermissionHandler, router])

  // 모바일 앱에서 홈 페이지 접근 시 인증 체크 중인 경우 로딩 화면
  if (isNativeApp && pathname === '/' && !showPermissionHandler && !authChecked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00FF88] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-[#00FF88] mb-2">RunSpot</h2>
          <p className="text-gray-400">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
      {isNativeApp && showPermissionHandler && (
        <PermissionHandler
          onPermissionGranted={handlePermissionGranted}
          onPermissionDenied={handlePermissionDenied}
        />
      )}
    </>
  )
}
