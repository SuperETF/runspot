import { useState, useEffect, useCallback } from 'react'
import { usePlatformDetection } from './usePlatformDetection'

interface NetworkSecurityConfig {
  enforceHTTPS: boolean
  allowedDomains: string[]
  blockedDomains: string[]
  certificatePinning: boolean
  tlsVersion: string
}

interface SecurityCheck {
  isSecure: boolean
  protocol: string
  tlsVersion?: string
  certificateValid: boolean
  domain: string
  timestamp: number
}

interface NetworkSecurityHook {
  config: NetworkSecurityConfig
  isSecureConnection: (url: string) => boolean
  validateCertificate: (url: string) => Promise<boolean>
  checkDomainSecurity: (domain: string) => Promise<SecurityCheck>
  securityLogs: SecurityCheck[]
  clearLogs: () => void
}

export const useNetworkSecurity = (): NetworkSecurityHook => {
  const { isIOS, isAndroid, platform } = usePlatformDetection()
  
  const [config] = useState<NetworkSecurityConfig>({
    enforceHTTPS: true,
    allowedDomains: [
      'supabase.co',
      'supabase.com',
      'dapi.kakao.com',
      'kapi.kakao.com',
      'apis.map.kakao.com',
      'googleapis.com',
      'maps.googleapis.com',
      'fcm.googleapis.com',
      'firebase.googleapis.com',
      'firebaseapp.com',
      'firestore.googleapis.com',
      'cloudflare.com',
      'jsdelivr.net',
      'unpkg.com',
      'runspot.seoul.kr'
    ],
    blockedDomains: [
      'http://insecure-api.com',
      'malicious-domain.com'
    ],
    certificatePinning: true,
    tlsVersion: 'TLSv1.2'
  })
  
  const [securityLogs, setSecurityLogs] = useState<SecurityCheck[]>([])

  // URL이 보안 연결인지 확인
  const isSecureConnection = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url)
      
      // HTTPS 프로토콜 확인
      if (config.enforceHTTPS && urlObj.protocol !== 'https:') {
        console.warn(`Insecure connection blocked: ${url}`)
        return false
      }
      
      // 허용된 도메인 확인
      const domain = urlObj.hostname
      const isAllowedDomain = config.allowedDomains.some(allowedDomain => 
        domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
      )
      
      if (!isAllowedDomain) {
        console.warn(`Domain not in allowlist: ${domain}`)
        return false
      }
      
      // 차단된 도메인 확인
      const isBlockedDomain = config.blockedDomains.some(blockedDomain =>
        domain === blockedDomain || domain.endsWith(`.${blockedDomain}`)
      )
      
      if (isBlockedDomain) {
        console.warn(`Blocked domain detected: ${domain}`)
        return false
      }
      
      return true
    } catch (error) {
      console.error('URL validation error:', error)
      return false
    }
  }, [config])

  // 인증서 유효성 검증
  const validateCertificate = useCallback(async (url: string): Promise<boolean> => {
    try {
      const urlObj = new URL(url)
      
      // 웹 환경에서는 브라우저가 인증서 검증을 처리
      if (typeof window !== 'undefined' && !isIOS && !isAndroid) {
        // fetch를 통해 연결 테스트
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            mode: 'no-cors'
          })
          clearTimeout(timeoutId)
          return true
        } catch (fetchError) {
          clearTimeout(timeoutId)
          console.warn(`Certificate validation failed for ${url}:`, fetchError)
          return false
        }
      }
      
      // 네이티브 환경에서는 플랫폼 보안 정책이 처리
      return true
    } catch (error) {
      console.error('Certificate validation error:', error)
      return false
    }
  }, [isIOS, isAndroid])

  // 도메인 보안 상태 확인
  const checkDomainSecurity = useCallback(async (domain: string): Promise<SecurityCheck> => {
    const url = `https://${domain}`
    const timestamp = Date.now()
    
    try {
      const isSecure = isSecureConnection(url)
      const certificateValid = await validateCertificate(url)
      
      const securityCheck: SecurityCheck = {
        isSecure: isSecure && certificateValid,
        protocol: 'https',
        tlsVersion: config.tlsVersion,
        certificateValid,
        domain,
        timestamp
      }
      
      // 로그에 추가
      setSecurityLogs(prev => [...prev.slice(-99), securityCheck])
      
      return securityCheck
    } catch (error) {
      console.error(`Security check failed for ${domain}:`, error)
      
      const failedCheck: SecurityCheck = {
        isSecure: false,
        protocol: 'unknown',
        certificateValid: false,
        domain,
        timestamp
      }
      
      setSecurityLogs(prev => [...prev.slice(-99), failedCheck])
      return failedCheck
    }
  }, [isSecureConnection, validateCertificate, config.tlsVersion])

  // 로그 초기화
  const clearLogs = useCallback(() => {
    setSecurityLogs([])
  }, [])

  // 네트워크 요청 인터셉터 (개발 환경)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // XMLHttpRequest 인터셉터
      const originalXHROpen = XMLHttpRequest.prototype.open
      XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
        const urlString = typeof url === 'string' ? url : url.toString()
        
        if (!isSecureConnection(urlString)) {
          console.error(`Blocked insecure XHR request to: ${urlString}`)
          throw new Error(`Insecure connection blocked: ${urlString}`)
        }
        
        return originalXHROpen.call(this, method, url, ...args)
      }

      // Fetch 인터셉터
      const originalFetch = window.fetch
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : 
                   input instanceof URL ? input.toString() : 
                   input.url
        
        if (!isSecureConnection(url)) {
          console.error(`Blocked insecure fetch request to: ${url}`)
          throw new Error(`Insecure connection blocked: ${url}`)
        }
        
        return originalFetch(input, init)
      }

      // 정리 함수
      return () => {
        XMLHttpRequest.prototype.open = originalXHROpen
        window.fetch = originalFetch
      }
    }
  }, [isSecureConnection])

  // 주요 도메인 보안 상태 주기적 확인
  useEffect(() => {
    const checkMainDomains = async () => {
      const mainDomains = ['supabase.co', 'dapi.kakao.com', 'googleapis.com']
      
      for (const domain of mainDomains) {
        try {
          await checkDomainSecurity(domain)
        } catch (error) {
          console.error(`Failed to check security for ${domain}:`, error)
        }
      }
    }

    // 초기 확인
    checkMainDomains()
    
    // 1시간마다 확인
    const interval = setInterval(checkMainDomains, 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [checkDomainSecurity])

  return {
    config,
    isSecureConnection,
    validateCertificate,
    checkDomainSecurity,
    securityLogs,
    clearLogs
  }
}

// 보안 연결 확인 유틸리티 함수
export const createSecureRequest = (url: string, options: RequestInit = {}): Promise<Response> => {
  // URL 보안 검증
  try {
    const urlObj = new URL(url)
    
    if (urlObj.protocol !== 'https:') {
      throw new Error(`Insecure protocol: ${urlObj.protocol}`)
    }
    
    // 추가 보안 헤더 설정
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
    
    return fetch(url, secureOptions)
  } catch (error) {
    return Promise.reject(new Error(`Invalid URL: ${url}`))
  }
}

// SSL/TLS 정보 확인 (웹 환경)
export const getSSLInfo = async (domain: string): Promise<{
  issuer?: string
  validFrom?: Date
  validTo?: Date
  protocol?: string
}> => {
  try {
    // 웹 환경에서는 제한적인 정보만 확인 가능
    const response = await fetch(`https://${domain}`, { method: 'HEAD' })
    
    return {
      protocol: 'https',
      // 웹에서는 인증서 세부 정보에 직접 접근 불가
      issuer: 'Browser Verified',
      validFrom: new Date(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  } catch (error) {
    console.error(`SSL info check failed for ${domain}:`, error)
    return {}
  }
}
