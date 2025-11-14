import { useState, useEffect } from 'react'

export type Platform = 'ios' | 'android' | 'web' | 'unknown'
export type DesignSystem = 'cupertino' | 'material' | 'web'

interface PlatformInfo {
  platform: Platform
  designSystem: DesignSystem
  version: string
  isWebView: boolean
  isMobile: boolean
  isTablet: boolean
  userAgent: string
}

export const usePlatformDetection = () => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    platform: 'unknown',
    designSystem: 'web',
    version: '',
    isWebView: false,
    isMobile: false,
    isTablet: false,
    userAgent: ''
  })

  useEffect(() => {
    const detectPlatform = (): PlatformInfo => {
      const userAgent = navigator.userAgent.toLowerCase()
      const platform = navigator.platform?.toLowerCase() || ''
      
      // iOS 감지
      if (/iphone|ipad|ipod/.test(userAgent) || 
          /macintosh/.test(userAgent) && 'ontouchend' in document) {
        
        // iOS 버전 추출
        const versionMatch = userAgent.match(/os (\d+)_(\d+)_?(\d+)?/)
        const version = versionMatch ? 
          `${versionMatch[1]}.${versionMatch[2]}${versionMatch[3] ? '.' + versionMatch[3] : ''}` : 
          'unknown'
        
        // iPad 감지
        const isTablet = /ipad/.test(userAgent) || 
          (/macintosh/.test(userAgent) && 'ontouchend' in document)
        
        // WebView 감지 (iOS)
        const isWebView = !userAgent.includes('safari') || 
          userAgent.includes('wkwebview') || 
          userAgent.includes('crios')
        
        return {
          platform: 'ios',
          designSystem: 'cupertino',
          version,
          isWebView,
          isMobile: !isTablet,
          isTablet,
          userAgent
        }
      }
      
      // Android 감지
      if (/android/.test(userAgent)) {
        // Android 버전 추출
        const versionMatch = userAgent.match(/android (\d+)\.?(\d+)?\.?(\d+)?/)
        const version = versionMatch ? 
          `${versionMatch[1]}${versionMatch[2] ? '.' + versionMatch[2] : ''}${versionMatch[3] ? '.' + versionMatch[3] : ''}` : 
          'unknown'
        
        // 태블릿 감지 (Android)
        const isTablet = !/mobile/.test(userAgent) && /android/.test(userAgent)
        
        // WebView 감지 (Android)
        const isWebView = userAgent.includes('wv') || 
          !userAgent.includes('chrome') || 
          userAgent.includes('version/')
        
        return {
          platform: 'android',
          designSystem: 'material',
          version,
          isWebView,
          isMobile: !isTablet,
          isTablet,
          userAgent
        }
      }
      
      // 웹 브라우저 (데스크톱/모바일)
      const isMobile = /mobile|tablet|ipad|playbook|silk/.test(userAgent) ||
        (window.innerWidth <= 768)
      
      return {
        platform: 'web',
        designSystem: 'web',
        version: '',
        isWebView: false,
        isMobile,
        isTablet: false,
        userAgent
      }
    }

    setPlatformInfo(detectPlatform())

    // 화면 크기 변경 감지 (반응형 대응)
    const handleResize = () => {
      setPlatformInfo(prev => ({
        ...prev,
        isMobile: window.innerWidth <= 768
      }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 플랫폼별 조건부 실행 헬퍼
  const when = {
    ios: <T>(value: T): T | null => platformInfo.platform === 'ios' ? value : null,
    android: <T>(value: T): T | null => platformInfo.platform === 'android' ? value : null,
    web: <T>(value: T): T | null => platformInfo.platform === 'web' ? value : null,
    mobile: <T>(value: T): T | null => platformInfo.isMobile ? value : null,
    tablet: <T>(value: T): T | null => platformInfo.isTablet ? value : null,
    webview: <T>(value: T): T | null => platformInfo.isWebView ? value : null
  }

  // 플랫폼별 값 선택 헬퍼
  const select = <T>(options: {
    ios?: T
    android?: T
    web?: T
    default: T
  }): T => {
    switch (platformInfo.platform) {
      case 'ios':
        return options.ios ?? options.default
      case 'android':
        return options.android ?? options.default
      case 'web':
        return options.web ?? options.default
      default:
        return options.default
    }
  }

  // 디자인 시스템별 값 선택
  const selectByDesign = <T>(options: {
    cupertino?: T
    material?: T
    web?: T
    default: T
  }): T => {
    switch (platformInfo.designSystem) {
      case 'cupertino':
        return options.cupertino ?? options.default
      case 'material':
        return options.material ?? options.default
      case 'web':
        return options.web ?? options.default
      default:
        return options.default
    }
  }

  return {
    ...platformInfo,
    when,
    select,
    selectByDesign,
    // 편의 메서드
    isIOS: platformInfo.platform === 'ios',
    isAndroid: platformInfo.platform === 'android',
    isWeb: platformInfo.platform === 'web',
    isCupertino: platformInfo.designSystem === 'cupertino',
    isMaterial: platformInfo.designSystem === 'material'
  }
}
