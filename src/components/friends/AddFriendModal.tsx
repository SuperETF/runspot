'use client'

import { useState } from 'react'
import { X, Mail, QrCode, Camera } from 'lucide-react'
import AddFriendByEmailModal from './AddFriendByEmailModal'
import MyQRCodeModal from './MyQRCodeModal'
import QRScannerModal from './QRScannerModal'

interface AddFriendModalProps {
  isOpen: boolean
  onClose: () => void
  onFriendAdded?: () => void
}

type AddFriendMethod = 'email' | 'my-qr' | 'scan-qr' | null

export default function AddFriendModal({ isOpen, onClose, onFriendAdded }: AddFriendModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<AddFriendMethod>(null)

  const handleMethodSelect = (method: AddFriendMethod) => {
    setSelectedMethod(method)
  }

  const handleClose = () => {
    setSelectedMethod(null)
    onClose()
  }

  const handleBackToMethods = () => {
    setSelectedMethod(null)
  }

  if (!isOpen) return null

  // 실제 구현된 하위 모달들 렌더링
  if (selectedMethod === 'email') {
    return (
      <AddFriendByEmailModal
        isOpen={true}
        onClose={handleClose}
        onBack={handleBackToMethods}
        onFriendAdded={onFriendAdded}
      />
    )
  }

  if (selectedMethod === 'my-qr') {
    return (
      <MyQRCodeModal
        isOpen={true}
        onClose={handleClose}
        onBack={handleBackToMethods}
      />
    )
  }

  if (selectedMethod === 'scan-qr') {
    return (
      <QRScannerModal
        isOpen={true}
        onClose={handleClose}
        onBack={handleBackToMethods}
        onFriendAdded={onFriendAdded}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-md overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">친구 추가</h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 친구 추가 방법 선택 */}
        <div className="p-6 space-y-4">
          <p className="text-gray-400 text-sm text-center mb-6">
            친구를 추가할 방법을 선택하세요
          </p>

          {/* 이메일로 친구 추가 */}
          <button
            onClick={() => handleMethodSelect('email')}
            className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
          >
            <div className="w-12 h-12 bg-[#00FF88]/10 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-[#00FF88]" />
            </div>
            <div>
              <h3 className="font-medium text-white">이메일로 친구 추가</h3>
              <p className="text-sm text-gray-400">이메일 주소로 검색해서 친구 요청을 보내세요</p>
            </div>
          </button>

          {/* 내 QR 코드 보기 */}
          <button
            onClick={() => handleMethodSelect('my-qr')}
            className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <QrCode className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">내 QR 코드 보기</h3>
              <p className="text-sm text-gray-400">QR 코드를 생성해서 친구에게 공유하세요</p>
            </div>
          </button>

          {/* QR 코드 스캔하기 */}
          <button
            onClick={() => handleMethodSelect('scan-qr')}
            className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
          >
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
              <Camera className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">QR 코드 스캔하기</h3>
              <p className="text-sm text-gray-400">친구의 QR 코드를 스캔해서 바로 친구 추가하세요</p>
            </div>
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <p className="text-xs text-gray-500 text-center">
            친구 추가 후 서로의 런닝 기록과 위치를 공유할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  )
}
