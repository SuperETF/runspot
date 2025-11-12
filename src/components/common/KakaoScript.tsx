'use client'

import Script from "next/script"

interface KakaoScriptProps {
  apiKey: string
}

export default function KakaoScript({ apiKey }: KakaoScriptProps) {
  console.log('🚀 KakaoScript 컴포넌트 렌더링')
  console.log('🔑 API 키:', apiKey ? `${apiKey.substring(0, 10)}...` : '없음')
  console.log('📍 SDK URL:', `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`)
  
  return (
    <Script
      src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`}
      strategy="beforeInteractive"
      onLoad={() => {
        console.log('✅ Kakao Maps SDK 스크립트 로드 성공')
        console.log('🔍 window.kakao 객체:', !!(window as any).kakao)
        console.log('🔍 window.kakao.maps 객체:', !!(window as any).kakao?.maps)
      }}
      onError={(e) => {
        console.error('❌ Kakao Maps SDK 스크립트 로드 실패:', e)
        console.error('🔑 사용된 API 키:', apiKey ? `${apiKey.substring(0, 10)}...` : '없음')
      }}
    />
  )
}
