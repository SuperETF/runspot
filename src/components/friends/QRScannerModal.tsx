'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ArrowLeft, Camera, Upload, UserPlus, Loader2, Users } from 'lucide-react'
import { findUserByQRToken, addFriendByQR } from '@/lib/friends'
import { parseQRData, isQRCodeExpired } from '@/utils/qrCode'
import { scanQRFromFile, checkCameraPermission, isCapacitorApp } from '@/utils/qrScanner'
import type { User } from '@/types/database'
import Image from 'next/image'

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  onFriendAdded?: () => void
}

export default function QRScannerModal({ 
  isOpen, 
  onClose, 
  onBack, 
  onFriendAdded 
}: QRScannerModalProps) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [foundUser, setFoundUser] = useState<User | null>(null)
  const [adding, setAdding] = useState(false)
  const [success, setSuccess] = useState(false)
  const [scannedToken, setScannedToken] = useState<string | null>(null)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (isOpen) {
      checkPermissions()
    }
  }, [isOpen])

  const checkPermissions = async () => {
    const hasPermission = await checkCameraPermission()
    setCameraPermission(hasPermission)
  }

  const handleQRScan = async (qrText: string) => {
    try {
      setScanning(true)
      setError(null)

      // QR 데이터 파싱
      const qrData = parseQRData(qrText)
      if (!qrData) {
        setError('유효하지 않은 QR 코드 형식입니다.')
        return
      }

      // 만료 확인
      if (isQRCodeExpired(qrData.expires)) {
        setError('만료된 QR 코드입니다.')
        return
      }

      // 사용자 찾기
      const result = await findUserByQRToken(qrData.token)
      
      if (result.success && result.data) {
        if (result.friendshipStatus) {
          setError('이미 친구 관계가 존재합니다.')
          return
        }
        setFoundUser(result.data)
        setScannedToken(qrData.token)
      } else {
        setError(result.error || '유효하지 않은 QR 코드입니다.')
      }
    } catch (error) {
      console.error('QR 스캔 실패:', error)
      setError('QR 코드 인식 중 오류가 발생했습니다.')
    } finally {
      setScanning(false)
    }
  }

  const handleAddFriend = async () => {
    if (!foundUser || !scannedToken) return

    try {
      setAdding(true)
      setError(null)

      const result = await addFriendByQR(scannedToken)
      
      if (result.success) {
        setSuccess(true)
        onFriendAdded?.()
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        setError(result.error || '친구 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('친구 추가 실패:', error)
      setError('친구 추가 중 오류가 발생했습니다.')
    } finally {
      setAdding(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setScanning(true)
      setError(null)

      const result = await scanQRFromFile(file)
      
      if (result.success && result.data) {
        await handleQRScan(result.data)
      } else {
        setError(result.error || 'QR 코드를 인식할 수 없습니다.')
      }
    } catch (error) {
      console.error('파일 스캔 실패:', error)
      setError('파일 처리 중 오류가 발생했습니다.')
    } finally {
      setScanning(false)
    }
  }

  const handleManualInput = () => {
    const token = prompt('QR 코드 토큰을 직접 입력하세요:')
    if (token) {
      handleQRScan(token)
    }
  }

  const handleClose = () => {
    setFoundUser(null)
    setError(null)
    setSuccess(false)
    setScanning(false)
    setAdding(false)
    setScannedToken(null)
    setCameraPermission(null)
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
            <h2 className="text-lg font-bold text-white">QR 코드 스캔</h2>
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
          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#00FF88]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-[#00FF88]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">친구 추가 완료!</h3>
              <p className="text-gray-400">
                {foundUser?.name}님과 친구가 되었습니다
              </p>
            </div>
          ) : foundUser ? (
            <div className="space-y-6">
              {/* 찾은 사용자 정보 */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-4">친구를 찾았습니다!</h3>
                <div className="flex flex-col items-center gap-4 p-4 bg-gray-800 rounded-lg">
                  {foundUser.profile_image ? (
                    <Image
                      src={foundUser.profile_image}
                      alt={foundUser.name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="text-center">
                    <h4 className="font-medium text-white text-lg">{foundUser.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span>런닝 {foundUser.total_runs}회</span>
                      <span>{foundUser.total_distance.toFixed(1)}km</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* 친구 추가 버튼 */}
              <div className="space-y-3">
                <button
                  onClick={handleAddFriend}
                  disabled={adding}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00FF88] text-black rounded-lg font-medium hover:bg-[#00FF88]/90 transition-colors disabled:opacity-50"
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {adding ? '친구 추가 중...' : '친구 추가하기'}
                </button>
                <button
                  onClick={() => setFoundUser(null)}
                  className="w-full px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  다시 스캔하기
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* QR 스캔 영역 */}
              <div className="text-center">
                <div className="w-48 h-48 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {scanning ? (
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[#00FF88] mx-auto mb-2" />
                      <p className="text-sm text-gray-400">스캔 중...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">QR 코드를 여기에</p>
                      {cameraPermission === false && (
                        <p className="text-xs text-red-400 mt-1">카메라 권한이 필요합니다</p>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-gray-400 text-sm">
                  친구의 QR 코드를 스캔하여 바로 친구 추가하세요
                </p>
                {isCapacitorApp() && (
                  <p className="text-xs text-blue-400 mt-2">
                    📱 네이티브 카메라 기능 사용 가능
                  </p>
                )}
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* 스캔 옵션들 */}
              <div className="space-y-3">
                {/* 파일 업로드 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  갤러리에서 QR 코드 선택
                </button>
                
                {/* 수동 입력 */}
                <button
                  onClick={handleManualInput}
                  className="w-full px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  토큰 직접 입력하기
                </button>
              </div>

              {/* 숨겨진 파일 입력 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <p className="text-xs text-gray-500 text-center">
            QR 코드로 친구 추가하면 즉시 친구 관계가 성립됩니다
          </p>
        </div>
      </div>
    </div>
  )
}
