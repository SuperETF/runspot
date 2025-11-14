import { useState, useEffect } from 'react'
import { usePlatformDetection } from './usePlatformDetection'

interface SafeAreaInsets {
  top: number
  bottom: number
  left: number
  right: number
}

interface ViewportInfo {
  width: number
  height: number
  isLandscape: boolean
  isTablet: boolean
  devicePixelRatio: number
}

interface SafeAreaHook {
  safeAreaInsets: SafeAreaInsets
  viewport: ViewportInfo
  cssVars: Record<string, string>
  isNotchDevice: boolean
  isDynamicIsland: boolean
  hasHomeIndicator: boolean
}

export const useSafeArea = (): SafeAreaHook => {
  const { isIOS, isAndroid, platform, version } = usePlatformDetection()
  
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  })
  
  const [viewport, setViewport] = useState<ViewportInfo>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isLandscape: false,
    isTablet: false,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1
  })

  // iOS 기기별 노치/다이나믹 아일랜드 감지
  const detectiOSDevice = () => {
    if (!isIOS) return { isNotch: false, isDynamicIsland: false, hasHomeIndicator: false }
    
    const { width, height } = viewport
    const pixelRatio = viewport.devicePixelRatio
    
    // 실제 물리적 해상도
    const physicalWidth = width * pixelRatio
    const physicalHeight = height * pixelRatio
    
    // iPhone 14 Pro/Pro Max (다이나믹 아일랜드)
    const isDynamicIsland = (
      (physicalWidth === 1179 && physicalHeight === 2556) || // iPhone 14 Pro
      (physicalWidth === 1290 && physicalHeight === 2796) || // iPhone 14 Pro Max
      (physicalWidth === 1206 && physicalHeight === 2622) || // iPhone 15 Pro
      (physicalWidth === 1320 && physicalHeight === 2868)    // iPhone 15 Pro Max
    )
    
    // iPhone X 시리즈 (노치)
    const isNotch = (
      (physicalWidth === 1125 && physicalHeight === 2436) || // iPhone X, XS, 11 Pro
      (physicalWidth === 1242 && physicalHeight === 2688) || // iPhone XS Max, 11 Pro Max
      (physicalWidth === 828 && physicalHeight === 1792) ||  // iPhone XR, 11
      (physicalWidth === 1170 && physicalHeight === 2532) || // iPhone 12/13/14
      (physicalWidth === 1284 && physicalHeight === 2778)    // iPhone 12/13/14 Pro Max
    )
    
    // 홈 인디케이터가 있는 기기 (iPhone X 이후)
    const hasHomeIndicator = isNotch || isDynamicIsland
    
    return { isNotch, isDynamicIsland, hasHomeIndicator }
  }

  // CSS 환경 변수에서 Safe Area 값 읽기
  const getSafeAreaFromCSS = (): SafeAreaInsets => {
    if (typeof window === 'undefined') {
      return { top: 0, bottom: 0, left: 0, right: 0 }
    }

    const computedStyle = getComputedStyle(document.documentElement)
    
    const parsePx = (value: string): number => {
      const parsed = parseFloat(value.replace('px', ''))
      return isNaN(parsed) ? 0 : parsed
    }

    return {
      top: parsePx(computedStyle.getPropertyValue('--safe-area-inset-top')),
      bottom: parsePx(computedStyle.getPropertyValue('--safe-area-inset-bottom')),
      left: parsePx(computedStyle.getPropertyValue('--safe-area-inset-left')),
      right: parsePx(computedStyle.getPropertyValue('--safe-area-inset-right'))
    }
  }

  // 뷰포트 정보 업데이트
  const updateViewport = () => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    const height = window.innerHeight
    const isLandscape = width > height
    const devicePixelRatio = window.devicePixelRatio || 1
    
    // 태블릿 감지 (화면 크기와 플랫폼 기반)
    const isTablet = (
      (isIOS && (width >= 768 || height >= 768)) || // iPad
      (isAndroid && width >= 600) || // Android 태블릿
      (!isIOS && !isAndroid && width >= 768) // 웹 태블릿
    )

    setViewport({
      width,
      height,
      isLandscape,
      isTablet,
      devicePixelRatio
    })
  }

  // Safe Area 값 계산 및 업데이트
  const updateSafeArea = () => {
    // CSS 환경 변수에서 먼저 시도
    const cssInsets = getSafeAreaFromCSS()
    
    // CSS 값이 있으면 사용
    if (cssInsets.top > 0 || cssInsets.bottom > 0 || cssInsets.left > 0 || cssInsets.right > 0) {
      setSafeAreaInsets(cssInsets)
      return
    }

    // iOS 기기별 기본값 설정
    if (isIOS) {
      const { isNotch, isDynamicIsland, hasHomeIndicator } = detectiOSDevice()
      
      let top = 0
      let bottom = 0
      
      if (isDynamicIsland) {
        top = viewport.isLandscape ? 0 : 59 // 다이나믹 아일랜드
        bottom = hasHomeIndicator ? 34 : 0
      } else if (isNotch) {
        top = viewport.isLandscape ? 0 : 44 // 노치
        bottom = hasHomeIndicator ? 34 : 0
      } else {
        // iPhone 8 이하 또는 iPad
        top = viewport.isTablet ? 24 : 20 // 상태바
        bottom = 0
      }
      
      // 가로 모드에서 좌우 inset
      const horizontal = viewport.isLandscape && hasHomeIndicator ? 44 : 0
      
      setSafeAreaInsets({
        top,
        bottom,
        left: horizontal,
        right: horizontal
      })
    } else if (isAndroid) {
      // Android는 대부분 시스템이 처리하지만 기본값 설정
      setSafeAreaInsets({
        top: 24, // 상태바
        bottom: viewport.isTablet ? 0 : 48, // 네비게이션 바 (태블릿은 보통 없음)
        left: 0,
        right: 0
      })
    } else {
      // 웹 브라우저
      setSafeAreaInsets({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      })
    }
  }

  // CSS 변수 생성
  const generateCSSVars = (): Record<string, string> => {
    return {
      '--safe-area-inset-top': `${safeAreaInsets.top}px`,
      '--safe-area-inset-bottom': `${safeAreaInsets.bottom}px`,
      '--safe-area-inset-left': `${safeAreaInsets.left}px`,
      '--safe-area-inset-right': `${safeAreaInsets.right}px`,
      '--viewport-width': `${viewport.width}px`,
      '--viewport-height': `${viewport.height}px`,
      '--is-landscape': viewport.isLandscape ? '1' : '0',
      '--is-tablet': viewport.isTablet ? '1' : '0'
    }
  }

  // 초기화 및 이벤트 리스너
  useEffect(() => {
    updateViewport()
    updateSafeArea()

    const handleResize = () => {
      updateViewport()
      updateSafeArea()
    }

    const handleOrientationChange = () => {
      // 방향 변경 시 약간의 지연 후 업데이트 (iOS 특성)
      setTimeout(() => {
        updateViewport()
        updateSafeArea()
      }, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    // CSS 환경 변수 변경 감지 (iOS Safari)
    const observer = new MutationObserver(() => {
      updateSafeArea()
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    })

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      observer.disconnect()
    }
  }, [isIOS, isAndroid])

  // 뷰포트 변경 시 Safe Area 재계산
  useEffect(() => {
    updateSafeArea()
  }, [viewport.width, viewport.height, viewport.isLandscape, viewport.isTablet])

  const deviceInfo = detectiOSDevice()

  return {
    safeAreaInsets,
    viewport,
    cssVars: generateCSSVars(),
    isNotchDevice: deviceInfo.isNotch,
    isDynamicIsland: deviceInfo.isDynamicIsland,
    hasHomeIndicator: deviceInfo.hasHomeIndicator
  }
}
