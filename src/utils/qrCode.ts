import QRCode from 'qrcode'

// Capacitor 환경 감지
const isCapacitorApp = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor
}

export interface QRFriendData {
  type: 'runspot_friend'
  token: string
  name: string
  expires: string
  version: string
}

/**
 * QR 코드 데이터 생성
 */
export const generateQRData = (token: string, userName: string, expiresAt: string): QRFriendData => {
  return {
    type: 'runspot_friend',
    token,
    name: userName,
    expires: expiresAt,
    version: '1.0'
  }
}

/**
 * QR 코드 이미지 생성 (Base64 Data URL)
 */
export const generateQRCodeImage = async (
  token: string, 
  userName: string, 
  expiresAt: string,
  options?: {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
  }
): Promise<string> => {
  const qrData = generateQRData(token, userName, expiresAt)
  const jsonData = JSON.stringify(qrData)

  const qrOptions = {
    width: options?.width || 256,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || '#000000',
      light: options?.color?.light || '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as const
  }

  try {
    const qrCodeDataURL = await QRCode.toDataURL(jsonData, qrOptions)
    return qrCodeDataURL
  } catch (error) {
    console.error('QR 코드 생성 실패:', error)
    throw new Error('QR 코드 생성에 실패했습니다.')
  }
}

/**
 * QR 코드 SVG 생성
 */
export const generateQRCodeSVG = async (
  token: string, 
  userName: string, 
  expiresAt: string
): Promise<string> => {
  const qrData = generateQRData(token, userName, expiresAt)
  const jsonData = JSON.stringify(qrData)

  try {
    const qrCodeSVG = await QRCode.toString(jsonData, { 
      type: 'svg',
      width: 256,
      margin: 2
    })
    return qrCodeSVG
  } catch (error) {
    console.error('QR 코드 SVG 생성 실패:', error)
    throw new Error('QR 코드 SVG 생성에 실패했습니다.')
  }
}

/**
 * QR 데이터 파싱 및 검증
 */
export const parseQRData = (qrText: string): QRFriendData | null => {
  try {
    const data = JSON.parse(qrText)
    
    // 데이터 구조 검증
    if (
      data.type === 'runspot_friend' &&
      typeof data.token === 'string' &&
      typeof data.name === 'string' &&
      typeof data.expires === 'string' &&
      data.token.length >= 16
    ) {
      return data as QRFriendData
    }
    
    return null
  } catch (error) {
    // JSON 파싱 실패 시 직접 토큰으로 간주
    if (typeof qrText === 'string' && qrText.length >= 16 && qrText.length <= 32) {
      return {
        type: 'runspot_friend',
        token: qrText,
        name: 'Unknown',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        version: '1.0'
      }
    }
    
    return null
  }
}

/**
 * QR 코드 만료 확인
 */
export const isQRCodeExpired = (expiresAt: string): boolean => {
  return new Date(expiresAt) <= new Date()
}

/**
 * QR 코드 공유용 텍스트 생성
 */
export const generateShareText = (userName: string, token: string): string => {
  return `${userName}님과 RunSpot에서 친구가 되어보세요!\n\nQR 코드: ${token}\n\n앱에서 QR 코드를 스캔하거나 토큰을 직접 입력하세요.`
}

/**
 * QR 코드 이미지 다운로드
 */
export const downloadQRCode = async (
  token: string, 
  userName: string, 
  expiresAt: string,
  filename?: string
): Promise<void> => {
  try {
    const qrCodeDataURL = await generateQRCodeImage(token, userName, expiresAt, {
      width: 512, // 고해상도
      margin: 4
    })

    // Data URL을 Blob으로 변환
    const response = await fetch(qrCodeDataURL)
    const blob = await response.blob()

    // 다운로드 링크 생성
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `runspot-qr-${userName}-${Date.now()}.png`
    
    // 다운로드 실행
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 메모리 정리
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('QR 코드 다운로드 실패:', error)
    throw new Error('QR 코드 다운로드에 실패했습니다.')
  }
}
