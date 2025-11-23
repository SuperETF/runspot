// QR 스캐너 유틸리티 (qr-scanner 패키지 설치 후 사용)

export interface QRScanResult {
  success: boolean
  data?: string
  error?: string
}

/**
 * 카메라로 QR 코드 스캔
 */
export const scanQRFromCamera = async (): Promise<QRScanResult> => {
  try {
    // 카메라 권한 확인
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        success: false,
        error: '이 브라우저는 카메라를 지원하지 않습니다.'
      }
    }

    // 카메라 스트림 요청
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment' // 후면 카메라 우선
      }
    })

    return {
      success: true,
      data: 'camera_stream_ready'
    }
  } catch (error) {
    console.error('카메라 접근 실패:', error)
    return {
      success: false,
      error: '카메라 접근 권한이 필요합니다.'
    }
  }
}

/**
 * 이미지 파일에서 QR 코드 스캔
 */
export const scanQRFromFile = async (file: File): Promise<QRScanResult> => {
  try {
    // 파일이 이미지인지 확인
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: '이미지 파일만 업로드할 수 있습니다.'
      }
    }

    // 파일을 Data URL로 변환
    const dataURL = await fileToDataURL(file)
    
    // 실제로는 QR 스캐너 라이브러리 사용
    // 여기서는 임시로 파일명 기반 처리
    if (file.name.toLowerCase().includes('qr')) {
      return {
        success: true,
        data: 'demo_qr_token_from_file'
      }
    }

    return {
      success: false,
      error: 'QR 코드를 찾을 수 없습니다.'
    }
  } catch (error) {
    console.error('파일 스캔 실패:', error)
    return {
      success: false,
      error: '파일 처리 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 파일을 Data URL로 변환
 */
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 카메라 권한 확인
 */
export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false
    }

    // 권한 상태 확인 (지원하는 브라우저에서만)
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      return permission.state === 'granted'
    }

    // 권한 API가 없는 경우 직접 테스트
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop()) // 스트림 정리
      return true
    } catch {
      return false
    }
  } catch {
    return false
  }
}

/**
 * 모바일 환경 감지
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * PWA 환경 감지
 */
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true
}

/**
 * Capacitor 환경 감지
 */
export const isCapacitorApp = (): boolean => {
  return !!(window as any).Capacitor
}
