'use client'

import { useEffect } from 'react'

const KakaoMapScript = () => {
  useEffect(() => {
    // 이미 로드되어 있는지 확인
    if (window.kakao && window.kakao.maps) {
      return
    }

    // API 키 확인
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY
    if (!apiKey) {
      const error = new Error('Kakao Maps API 키가 설정되지 않았습니다.')
      console.error(error)
      return
    }

    // 스크립트 태그 생성
    const script = document.createElement('script')
    script.async = true
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`
    
    script.onload = () => {
      // Kakao Maps API 초기화
      window.kakao.maps.load(() => {
        console.log('Kakao Maps API 로드 완료')
      })
    }

    script.onerror = () => {
      const error = new Error('Kakao Maps API 스크립트 로드 실패')
      console.error(error)
    }

    // 스크립트를 head에 추가
    document.head.appendChild(script)

    // 컴포넌트 언마운트 시 스크립트 제거
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  return null // 이 컴포넌트는 렌더링되지 않음
}

export default KakaoMapScript
