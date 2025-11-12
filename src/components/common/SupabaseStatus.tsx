'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface SupabaseStatusProps {
  onConnectionChange?: (isConnected: boolean) => void
}

export default function SupabaseStatus({ onConnectionChange }: SupabaseStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [error, setError] = useState<string | null>(null)

  const checkConnection = useCallback(async () => {
    try {
      setStatus('checking')
      setError(null)

      // Supabase 연결 테스트
      const { error } = await supabase
        .from('courses')
        .select('count')
        .limit(1)

      if (error) {
        throw error
      }

      setStatus('connected')
      onConnectionChange?.(true)
    } catch (err: any) {
      console.error('Supabase 연결 오류:', err)
      setStatus('error')
      setError(err.message || '데이터베이스 연결에 실패했습니다.')
      onConnectionChange?.(false)
    }
  }, [onConnectionChange])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 text-yellow-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>데이터베이스 연결 확인 중...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>DB 연결 실패: {error}</span>
        <button 
          onClick={checkConnection}
          className="text-xs bg-red-500/20 px-2 py-1 rounded hover:bg-red-500/30 transition-colors"
        >
          재시도
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-green-400 text-sm">
      <CheckCircle className="w-4 h-4" />
      <span>데이터베이스 연결됨</span>
    </div>
  )
}
