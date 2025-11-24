'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import Script from 'next/script'

interface KakaoMapWrapperProps {
  children: React.ReactNode
  lazy?: boolean // 지연 로딩 여부
}

interface KakaoMapContextType {
  isLoaded: boolean
  loadKakaoMap: () => void
}

const KakaoMapContext = createContext<KakaoMapContextType>({
  isLoaded: false,
  loadKakaoMap: () => {}
})

export const useKakaoMap = () => useContext(KakaoMapContext)

export default function KakaoMapWrapper({ children, lazy = false }: KakaoMapWrapperProps) {
  const [apiKey, setApiKey] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || ''
    setApiKey(key)
    
    // lazy가 false면 바로 로드
    if (!lazy && key) {
      setShouldLoad(true)
    }
  }, [lazy])

  const loadKakaoMap = () => {
    if (!apiKey || shouldLoad) return
    setShouldLoad(true)
  }

  const handleLoad = () => {
    const kakao = (window as any).kakao
    if (kakao?.maps?.load) {
      kakao.maps.load(() => {
        setIsLoaded(true)
      })
    }
  }

  const handleError = () => {
    setIsLoaded(false)
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
    <KakaoMapContext.Provider value={{ isLoaded, loadKakaoMap }}>
      {(shouldLoad || !lazy) && apiKey && (
        <Script
          id="kakao-maps-sdk"
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`}
          strategy="afterInteractive"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      {children}
    </KakaoMapContext.Provider>
  )
}
