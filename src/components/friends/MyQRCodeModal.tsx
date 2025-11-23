'use client'

import { useState, useEffect } from 'react'
import { X, ArrowLeft, QrCode, RefreshCw, Share2, Download, Copy, Check } from 'lucide-react'
import { getMyQRToken, refreshQRToken } from '@/lib/friends'
import { generateQRCodeImage, downloadQRCode, generateShareText } from '@/utils/qrCode'
import type { User } from '@/types/database'
import Image from 'next/image'

interface MyQRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
}

interface QRData {
  qr_token: string
  expires_at: string
  user: User
}

export default function MyQRCodeModal({ isOpen, onClose, onBack }: MyQRCodeModalProps) {
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [generatingQR, setGeneratingQR] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadQRData()
    }
  }, [isOpen])

  const generateQRImageFromData = async (data: QRData) => {
    try {
      setGeneratingQR(true)
      const imageUrl = await generateQRCodeImage(
        data.qr_token,
        data.user.name,
        data.expires_at,
        {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }
      )
      setQrImageUrl(imageUrl)
    } catch (error) {
      console.error('QR 이미지 생성 실패:', error)
      setError('QR 이미지 생성에 실패했습니다.')
    } finally {
      setGeneratingQR(false)
    }
  }

  const loadQRData = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getMyQRToken()
      
      if (result.success && result.data) {
        setQrData(result.data)
        // QR 코드 이미지 생성
        await generateQRImageFromData(result.data)
      } else {
        setError(result.error || 'QR 코드를 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('QR 코드 로드 실패:', error)
      setError('QR 코드 로드 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      setError(null)

      const result = await refreshQRToken()
      
      if (result.success && result.data) {
        setQrData(result.data)
      } else {
        setError(result.error || 'QR 코드 갱신에 실패했습니다.')
      }
    } catch (error) {
      console.error('QR 코드 갱신 실패:', error)
      setError('QR 코드 갱신 중 오류가 발생했습니다.')
    } finally {
      setRefreshing(false)
    }
  }


  const handleCopyToken = async () => {
    if (!qrData) return

    try {
      await navigator.clipboard.writeText(qrData.qr_token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('복사 실패:', error)
    }
  }

  const handleShare = async () => {
    if (!qrData) return

    try {
      // Capacitor 환경에서는 네이티브 Share 사용
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const { Share } = await import('@capacitor/share')
        
        const shareText = generateShareText(qrData.user.name, qrData.qr_token)
        
        await Share.share({
          title: 'RunSpot 친구 추가',
          text: shareText,
          dialogTitle: 'QR 코드 공유하기'
        })
      } else {
        // 웹 환경에서는 Web Share API 또는 클립보드
        const shareData = {
          title: 'RunSpot 친구 추가',
          text: `${qrData.user.name}님과 RunSpot에서 친구가 되어보세요!`,
          url: `https://runspot.app/friend/add?token=${qrData.qr_token}`
        }

        if (navigator.share) {
          await navigator.share(shareData)
        } else {
          // Fallback: 클립보드에 복사
          await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
          alert('링크가 클립보드에 복사되었습니다!')
        }
      }
    } catch (error) {
      console.error('공유 실패:', error)
    }
  }

  const handleDownload = async () => {
    if (!qrData) return

    try {
      await downloadQRCode(
        qrData.qr_token,
        qrData.user.name,
        qrData.expires_at,
        `runspot-qr-${qrData.user.name}.png`
      )
    } catch (error) {
      console.error('다운로드 실패:', error)
      setError('QR 코드 다운로드에 실패했습니다.')
    }
  }

  const formatExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt)
    const now = new Date()
    const diffMs = expiry.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffMs <= 0) {
      return '만료됨'
    }

    if (diffHours > 0) {
      return `${diffHours}시간 ${diffMinutes}분 후 만료`
    } else {
      return `${diffMinutes}분 후 만료`
    }
  }

  const handleClose = () => {
    setQrData(null)
    setError(null)
    setCopied(false)
    setQrImageUrl(null)
    setGeneratingQR(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-md overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-white">내 QR 코드</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <QrCode className="h-12 w-12 animate-pulse text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">QR 코드를 생성하고 있습니다...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <button
                onClick={loadQRData}
                className="px-4 py-2 bg-[#00FF88] text-black rounded-lg font-medium hover:bg-[#00FF88]/90 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : qrData ? (
            <div className="text-center space-y-6">
              {/* 사용자 정보 */}
              <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
                {qrData.user.profile_image ? (
                  <Image
                    src={qrData.user.profile_image}
                    alt={qrData.user.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="text-left">
                  <h3 className="font-medium text-white">{qrData.user.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>런닝 {qrData.user.total_runs}회</span>
                    <span>{qrData.user.total_distance.toFixed(1)}km</span>
                  </div>
                </div>
              </div>

              {/* QR 코드 */}
              <div className="bg-white p-6 rounded-lg">
                {generatingQR ? (
                  <div className="w-[200px] h-[200px] flex items-center justify-center mx-auto">
                    <QrCode className="h-12 w-12 animate-pulse text-gray-400" />
                  </div>
                ) : qrImageUrl ? (
                  <Image
                    src={qrImageUrl}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center mx-auto bg-gray-100">
                    <QrCode className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* 만료 시간 */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  {formatExpiryTime(qrData.expires_at)}
                </p>
              </div>

              {/* 토큰 정보 */}
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-mono">
                    {qrData.qr_token.substring(0, 8)}...
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        복사
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    새로 생성
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#00FF88] text-black rounded-lg hover:bg-[#00FF88]/90 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    공유하기
                  </button>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  QR 코드 다운로드
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* 안내 메시지 */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <p className="text-xs text-gray-500 text-center">
            친구가 이 QR 코드를 스캔하면 즉시 친구로 추가됩니다
          </p>
        </div>
      </div>
    </div>
  )
}
