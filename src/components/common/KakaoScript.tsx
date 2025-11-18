'use client'

import Script from "next/script"
import { useEffect, useState } from "react"

interface KakaoScriptProps {
  apiKey: string
  children?: React.ReactNode
}

export default function KakaoScript({ apiKey, children }: KakaoScriptProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // API 키 디버깅
  useEffect(() => {
    console.log('🔑 KakaoScript - API 키 상태:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : '없음'
    })
  }, [apiKey])

  // 이미 로드된 스크립트가 있는지 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 이미 카카오맵 SDK가 로드되어 있는지 확인
      if ((window as any).kakao?.maps) {
        console.log('✅ Kakao Maps SDK 이미 로드됨')
        setIsLoaded(true)
        return
      }

      // 이미 스크립트 태그가 있는지 확인
      const existingScript = document.querySelector(`script[src*="dapi.kakao.com"]`)
      if (existingScript) {
        console.log('🔄 Kakao Maps SDK 스크립트 로딩 중...')
        setIsLoading(true)
        
        // 기존 스크립트의 로드 완료를 기다림
        const checkLoaded = () => {
          if ((window as any).kakao?.maps) {
            setIsLoaded(true)
            setIsLoading(false)
          } else {
            setTimeout(checkLoaded, 100)
          }
        }
        checkLoaded()
        return
      }
    }
  }, [])

  const handleLoad = () => {
    console.log('✅ Kakao Maps SDK 스크립트 로드 성공')
    console.log('🔍 window.kakao 객체:', !!(window as any).kakao)
    console.log('🔍 window.kakao.maps 객체:', !!(window as any).kakao?.maps)
    
    // 카카오맵 라이브러리 수동 로드 (autoload=false이므로)
    if ((window as any).kakao?.maps?.load) {
      (window as any).kakao.maps.load(() => {
        console.log('✅ Kakao Maps 라이브러리 로드 완료')
        setIsLoaded(true)
        setIsLoading(false)
      })
    } else {
      setIsLoaded(true)
      setIsLoading(false)
    }
  }

  const handleError = (e: any) => {
    console.error('❌ Kakao Maps SDK 스크립트 로드 실패:', e)
    console.error('🔑 사용된 API 키:', apiKey ? `${apiKey.substring(0, 10)}...` : '없음')
    setIsLoading(false)
  }

  // API 키가 없으면 에러 표시
  if (!apiKey) {
    console.error('❌ Kakao Maps API 키가 설정되지 않았습니다.')
    return <>{children}</>
  }

  return (
    <>
      <Script
        id="kakao-maps-sdk"
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`}
        strategy="beforeInteractive"
        onLoad={handleLoad}
        onError={handleError}
      />
      {/* 카카오맵 SDK 로드 완료 후에만 children 렌더링 */}
      {isLoaded ? children : (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          background: '#000',
          color: '#fff'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🗺️</div>
            <div>지도 로딩 중...</div>
          </div>
        </div>
      )}
    </>
  )
}
