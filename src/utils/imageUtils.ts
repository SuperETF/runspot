// 이미지를 base64로 변환하는 유틸리티
export const getRunSpotLogoBase64 = async (): Promise<string> => {
  try {
    const response = await fetch('/maker.svg')
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('RunSpot 로고 로드 실패:', error)
    return ''
  }
}

// RunSpot 마커 SVG 생성 - 이미지 자체를 마커로 사용
export const createRunSpotMarkerSvg = (logoBase64: string, uniqueId: string = 'default'): string => {
  // logoBase64가 있으면 이미지 자체를 반환, 없으면 기본 마커
  if (logoBase64) {
    return logoBase64
  }
  
  // 폴백용 기본 마커
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="#00FF88" stroke="#000" stroke-width="2"/>
    <text x="20" y="26" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#000">R</text>
  </svg>`)}`
}
