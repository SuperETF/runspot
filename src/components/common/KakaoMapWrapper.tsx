'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

interface KakaoMapWrapperProps {
  children: React.ReactNode
}

export default function KakaoMapWrapper({ children }: KakaoMapWrapperProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [loadTimeout, setLoadTimeout] = useState(false)

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return
    
    // 환경변수에서 API 키 가져오기
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || ''
    setApiKey(key)
    
    // 이미 카카오맵 SDK가 로드되어 있는지 확인
    if ((window as any).kakao?.maps) {
      console.log('✅ Kakao Maps SDK 이미 로드됨')
      setIsLoaded(true)
      return
    }

    // 10초 후 타임아웃 - 로딩이 너무 오래 걸리면 children 렌더링
    const timeout = setTimeout(() => {
      console.warn('⚠️ 카카오맵 로딩 타임아웃 - children 렌더링')
      setLoadTimeout(true)
      setIsLoaded(true)
    }, 10000)

    return () => clearTimeout(timeout)
  }, [])

  const handleLoad = () => {
    console.log('✅ Kakao Maps SDK 로드 완료')
    
    // 카카오맵 라이브러리 수동 로드
    if ((window as any).kakao?.maps?.load) {
      (window as any).kakao.maps.load(() => {
        console.log('✅ Kakao Maps 라이브러리 초기화 완료')
        setIsLoaded(true)
      })
    } else {
      setIsLoaded(true)
    }
  }

  const handleError = (e: any) => {
    console.error('❌ Kakao Maps SDK 로드 실패:', e)
    console.log('🔄 지도 없이 앱 계속 실행')
    setIsLoaded(true) // 오류가 있어도 앱은 계속 실행
  }

  // 서버사이드에서는 바로 children 렌더링
  if (typeof window === 'undefined') {
    return <>{children}</>
  }

  // API 키가 없으면 children만 렌더링 (지도 기능 없이)
  if (!apiKey) {
    console.warn('⚠️ Kakao Maps API 키가 없습니다. 지도 없이 앱 실행')
    return <>{children}</>
  }

  return (
    <>
      {!isLoaded && (
        <Script
          id="kakao-maps-sdk"
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`}
          strategy="beforeInteractive"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {/* 카카오맵 SDK 로드 완료 후 또는 이미 로드된 경우 children 렌더링 */}
      {isLoaded ? children : (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#00FF88] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-[#00FF88] mb-2">RunSpot</h2>
            <p className="text-gray-400">지도 기능을 준비하고 있습니다...</p>
            <p className="text-gray-500 text-sm mt-2">10초 후 자동으로 계속됩니다</p>
          </div>
        </div>
      )}
    </>
  )
}
