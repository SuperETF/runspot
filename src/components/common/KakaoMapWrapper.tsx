'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

interface KakaoMapWrapperProps {
  children: React.ReactNode
}

export default function KakaoMapWrapper({ children }: KakaoMapWrapperProps) {
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return
    
    // 환경변수에서 API 키 가져오기
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || ''
    
    console.log('🔑 환경변수 상태:', {
      hasKey: !!key,
      keyLength: key.length,
      keyPreview: key ? `${key.substring(0, 10)}...` : '없음',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('KAKAO'))
    })
    
    setApiKey(key)
    
    if (key) {
      console.log('🚀 카카오맵 SDK 백그라운드 로딩 - 앱 바로 진입')
    } else {
      console.warn('⚠️ 카카오맵 API 키가 없어서 지도 기능 비활성화')
    }
  }, [])

  const handleLoad = () => {
    console.log('✅ Kakao Maps SDK 스크립트 로드 완료 (autoload=false)')
    
    const kakao = (window as any).kakao
    if (kakao?.maps?.load) {
      console.log('🔄 카카오맵 라이브러리 수동 초기화 시작')
      
      // 수동으로 카카오맵 라이브러리 로드
      kakao.maps.load(() => {
        console.log('🎉 카카오맵 라이브러리 초기화 완료!')
        console.log('🔍 최종 Kakao 객체 상태:', {
          kakao: !!kakao,
          maps: !!kakao?.maps,
          LatLng: !!kakao?.maps?.LatLng,
          Map: !!kakao?.maps?.Map,
          ready: !!(kakao?.maps?.LatLng && kakao?.maps?.Map)
        })
      })
    } else {
      console.error('❌ kakao.maps.load 함수를 찾을 수 없습니다')
      console.log('🔍 Kakao 객체 상태:', {
        kakao: !!kakao,
        maps: !!kakao?.maps,
        load: !!kakao?.maps?.load
      })
    }
  }

  const handleError = (e: any) => {
    console.error('❌ Kakao Maps SDK 로드 실패:', e)
    console.log('🔄 지도 없이 앱 계속 실행')
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
      {/* API 키가 있을 때만 카카오맵 SDK 로딩 */}
      {apiKey && (
        <Script
          id="kakao-maps-sdk"
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`}
          strategy="afterInteractive"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {/* 바로 children 렌더링 - 카카오맵이 자체적으로 로딩 처리 */}
      {children}
    </>
  )
}
