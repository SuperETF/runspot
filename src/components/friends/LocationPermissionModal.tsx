'use client'

import { useState } from 'react'
import { MapPin, Shield, Users, AlertTriangle, Check, X } from 'lucide-react'

interface LocationPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  onPermissionGranted: () => void
  onPermissionDenied: () => void
}

export default function LocationPermissionModal({
  isOpen,
  onClose,
  onPermissionGranted,
  onPermissionDenied
}: LocationPermissionModalProps) {
  const [isRequesting, setIsRequesting] = useState(false)

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    
    try {
      if (!navigator.geolocation) {
        alert('이 브라우저는 위치 서비스를 지원하지 않습니다.')
        onPermissionDenied()
        return
      }

      // 위치 권한 요청
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 권한 허용됨
          console.log('위치 권한 허용:', position)
          onPermissionGranted()
          onClose()
        },
        (error) => {
          // 권한 거부됨
          console.error('위치 권한 거부:', error)
          onPermissionDenied()
          onClose()
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    } catch (error) {
      console.error('위치 권한 요청 실패:', error)
      onPermissionDenied()
      onClose()
    } finally {
      setIsRequesting(false)
    }
  }

  const handleDeny = () => {
    onPermissionDenied()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-md overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-[#00FF88]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-[#00FF88]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">위치 권한 요청</h2>
          <p className="text-gray-400 text-sm">
            친구들과 위치를 공유하려면 위치 권한이 필요합니다
          </p>
        </div>

        {/* 기능 설명 */}
        <div className="px-6 pb-6 space-y-4">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-[#00FF88] mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm">친구와 위치 공유</p>
              <p className="text-gray-400 text-xs">런닝 중 친구들에게 실시간 위치를 공유할 수 있습니다</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm">안전한 런닝</p>
              <p className="text-gray-400 text-xs">친구들이 내 위치를 알 수 있어 더 안전하게 런닝할 수 있습니다</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-400 mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm">완전한 제어</p>
              <p className="text-gray-400 text-xs">언제든지 위치 공유를 중단하거나 설정을 변경할 수 있습니다</p>
            </div>
          </div>
        </div>

        {/* 개인정보 보호 안내 */}
        <div className="mx-6 mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-blue-400 mt-0.5" />
            <div>
              <p className="text-blue-400 font-medium text-sm mb-1">개인정보 보호</p>
              <p className="text-gray-400 text-xs">
                위치 정보는 암호화되어 저장되며, 설정한 친구들에게만 공유됩니다. 
                RunSpot은 사용자의 개인정보를 보호합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={handleDeny}
            disabled={isRequesting}
            className="flex-1 py-3 px-4 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            나중에
          </button>
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="flex-1 py-3 px-4 bg-[#00FF88] text-black rounded-lg font-medium hover:bg-[#00FF88]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRequesting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                요청 중...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                권한 허용
              </>
            )}
          </button>
        </div>

        {/* 추가 안내 */}
        <div className="px-6 pb-6">
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
            <p className="text-yellow-400 text-xs">
              브라우저에서 위치 권한을 거부하면 친구와의 위치 공유 기능을 사용할 수 없습니다. 
              설정에서 언제든지 권한을 변경할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
