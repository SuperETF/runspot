'use client'

import React, { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldX, AlertTriangle, Lock, Unlock, Globe, Server, Clock, RefreshCw } from 'lucide-react'
import { useNetworkSecurity } from '@/hooks/useNetworkSecurity'
import { usePlatformDetection } from '@/hooks/usePlatformDetection'

interface NetworkSecurityStatusProps {
  showDetails?: boolean
  className?: string
}

export default function NetworkSecurityStatus({ 
  showDetails = false, 
  className = '' 
}: NetworkSecurityStatusProps) {
  const { isIOS, isAndroid } = usePlatformDetection()
  const { 
    config, 
    securityLogs, 
    checkDomainSecurity, 
    clearLogs 
  } = useNetworkSecurity()
  
  const [isChecking, setIsChecking] = useState(false)
  const [overallStatus, setOverallStatus] = useState<'secure' | 'warning' | 'error'>('secure')

  // 전체 보안 상태 계산
  useEffect(() => {
    const recentLogs = securityLogs.slice(-10)
    const failedChecks = recentLogs.filter(log => !log.isSecure).length
    
    if (failedChecks === 0) {
      setOverallStatus('secure')
    } else if (failedChecks <= 2) {
      setOverallStatus('warning')
    } else {
      setOverallStatus('error')
    }
  }, [securityLogs])

  // 보안 상태 아이콘
  const getStatusIcon = () => {
    switch (overallStatus) {
      case 'secure':
        return <ShieldCheck className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <ShieldX className="w-5 h-5 text-red-500" />
      default:
        return <Shield className="w-5 h-5 text-gray-500" />
    }
  }

  // 보안 상태 텍스트
  const getStatusText = () => {
    switch (overallStatus) {
      case 'secure':
        return '보안 연결 정상'
      case 'warning':
        return '보안 경고'
      case 'error':
        return '보안 위험'
      default:
        return '보안 상태 확인 중'
    }
  }

  // 보안 상태 색상
  const getStatusColor = () => {
    switch (overallStatus) {
      case 'secure':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // 주요 도메인 보안 확인
  const checkAllDomains = async () => {
    setIsChecking(true)
    
    const mainDomains = [
      'supabase.co',
      'dapi.kakao.com',
      'googleapis.com'
    ]
    
    try {
      for (const domain of mainDomains) {
        await checkDomainSecurity(domain)
        // 각 요청 사이에 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error('Domain security check failed:', error)
    } finally {
      setIsChecking(false)
    }
  }

  // 간단한 상태 표시
  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
    )
  }

  // 상세 보안 상태 패널
  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* 헤더 */}
      <div className={`px-4 py-3 border-b rounded-t-lg ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold">{getStatusText()}</h3>
              <p className="text-sm opacity-75">
                네트워크 보안 상태 모니터링
              </p>
            </div>
          </div>
          
          <button
            onClick={checkAllDomains}
            disabled={isChecking}
            className="p-2 rounded-lg hover:bg-black/5 active:bg-black/10 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 보안 설정 정보 */}
      <div className="p-4 space-y-4">
        {/* 플랫폼별 보안 정책 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm">HTTPS 강제</span>
            </div>
            <p className="text-xs text-gray-600">
              {config.enforceHTTPS ? '활성화됨' : '비활성화됨'}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-green-500" />
              <span className="font-medium text-sm">인증서 핀</span>
            </div>
            <p className="text-xs text-gray-600">
              {config.certificatePinning ? '활성화됨' : '비활성화됨'}
            </p>
          </div>
        </div>

        {/* 플랫폼별 정책 */}
        <div className="border-t pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <Globe className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-sm">플랫폼 보안 정책</span>
          </div>
          
          <div className="space-y-2 text-xs text-gray-600">
            {isIOS && (
              <div className="flex items-center justify-between">
                <span>iOS App Transport Security (ATS)</span>
                <span className="text-green-600 font-medium">활성화</span>
              </div>
            )}
            
            {isAndroid && (
              <div className="flex items-center justify-between">
                <span>Android Network Security Config</span>
                <span className="text-green-600 font-medium">활성화</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span>최소 TLS 버전</span>
              <span className="text-blue-600 font-medium">{config.tlsVersion}</span>
            </div>
          </div>
        </div>

        {/* 허용된 도메인 */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm">허용된 도메인</span>
            <span className="text-xs text-gray-500">
              {config.allowedDomains.length}개
            </span>
          </div>
          
          <div className="max-h-32 overflow-y-auto space-y-1">
            {config.allowedDomains.slice(0, 5).map((domain, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-gray-700">{domain}</span>
                <span className="text-green-600">✓</span>
              </div>
            ))}
            {config.allowedDomains.length > 5 && (
              <div className="text-xs text-gray-500 text-center pt-2">
                +{config.allowedDomains.length - 5}개 더
              </div>
            )}
          </div>
        </div>

        {/* 최근 보안 로그 */}
        {securityLogs.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm">최근 보안 검사</span>
              <button
                onClick={clearLogs}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                지우기
              </button>
            </div>
            
            <div className="max-h-32 overflow-y-auto space-y-2">
              {securityLogs.slice(-5).reverse().map((log, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    {log.isSecure ? (
                      <ShieldCheck className="w-3 h-3 text-green-500" />
                    ) : (
                      <ShieldX className="w-3 h-3 text-red-500" />
                    )}
                    <span className="text-gray-700">{log.domain}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={log.isSecure ? 'text-green-600' : 'text-red-600'}>
                      {log.protocol.toUpperCase()}
                    </span>
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 보안 권장사항 */}
        {overallStatus !== 'secure' && (
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-sm">보안 권장사항</span>
            </div>
            
            <div className="space-y-2 text-xs text-gray-600">
              {overallStatus === 'warning' && (
                <p>일부 도메인에서 보안 경고가 발생했습니다. 네트워크 연결을 확인해주세요.</p>
              )}
              {overallStatus === 'error' && (
                <p>심각한 보안 위험이 감지되었습니다. 즉시 네트워크 관리자에게 문의하세요.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
