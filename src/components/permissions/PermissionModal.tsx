'use client'

import React, { useState } from 'react'
import { MapPin, Camera, Mic, Bell, HardDrive, Users, Calendar, Activity, Bluetooth, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import SafeAreaModal from '@/components/modal/SafeAreaModal'
import PlatformButton from '@/components/ui/PlatformButton'
import { usePermissions, PermissionType, PermissionStatus } from '@/hooks/usePermissions'
import { usePlatformDetection } from '@/hooks/usePlatformDetection'

interface PermissionModalProps {
  isOpen: boolean
  onClose: () => void
  requiredPermissions: PermissionType[]
  onComplete: (results: { [key in PermissionType]?: PermissionStatus }) => void
}

const permissionIcons: { [key in PermissionType]: React.ComponentType<{ className?: string }> } = {
  geolocation: MapPin,
  camera: Camera,
  microphone: Mic,
  notifications: Bell,
  storage: HardDrive,
  contacts: Users,
  calendar: Calendar,
  motion: Activity,
  bluetooth: Bluetooth
}

const permissionTitles: { [key in PermissionType]: string } = {
  geolocation: '위치 서비스',
  camera: '카메라',
  microphone: '마이크',
  notifications: '알림',
  storage: '저장소',
  contacts: '연락처',
  calendar: '캘린더',
  motion: '모션 센서',
  bluetooth: '블루투스'
}

export default function PermissionModal({
  isOpen,
  onClose,
  requiredPermissions,
  onComplete
}: PermissionModalProps) {
  const { isIOS, isAndroid } = usePlatformDetection()
  const { 
    permissions, 
    requestPermission, 
    requestMultiplePermissions, 
    getPermissionDescription,
    openPermissionSettings 
  } = usePermissions()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [isRequesting, setIsRequesting] = useState(false)
  const [results, setResults] = useState<{ [key in PermissionType]?: PermissionStatus }>({})

  const currentPermission = requiredPermissions[currentStep]
  const Icon = currentPermission ? permissionIcons[currentPermission] : MapPin

  // 권한 상태에 따른 아이콘 색상
  const getStatusColor = (status: PermissionStatus) => {
    switch (status) {
      case 'granted': return 'text-green-500'
      case 'denied': return 'text-red-500'
      case 'prompt': return 'text-orange-500'
      default: return 'text-gray-400'
    }
  }

  // 권한 상태 아이콘
  const getStatusIcon = (status: PermissionStatus) => {
    switch (status) {
      case 'granted': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'denied': return <XCircle className="w-5 h-5 text-red-500" />
      case 'prompt': return <AlertCircle className="w-5 h-5 text-orange-500" />
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  // 단일 권한 요청
  const handleRequestPermission = async () => {
    if (!currentPermission) return

    setIsRequesting(true)
    try {
      const status = await requestPermission(currentPermission)
      const newResults = { ...results, [currentPermission]: status }
      setResults(newResults)

      if (currentStep < requiredPermissions.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        onComplete(newResults)
        onClose()
      }
    } catch (error) {
      console.error('Permission request failed:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  // 모든 권한 일괄 요청
  const handleRequestAllPermissions = async () => {
    setIsRequesting(true)
    try {
      const permissionRequests = requiredPermissions.map(type => ({
        type,
        reason: getPermissionDescription(type),
        required: true
      }))

      const requestResults = await requestMultiplePermissions(permissionRequests)
      setResults(requestResults)
      onComplete(requestResults)
      onClose()
    } catch (error) {
      console.error('Multiple permissions request failed:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  // 권한 설정으로 이동
  const handleOpenSettings = () => {
    openPermissionSettings()
  }

  // 건너뛰기
  const handleSkip = () => {
    const skipResults = requiredPermissions.reduce((acc, type) => {
      acc[type] = 'denied'
      return acc
    }, {} as { [key in PermissionType]?: PermissionStatus })
    
    onComplete(skipResults)
    onClose()
  }

  // 단계별 권한 요청 모달
  const StepByStepModal = () => (
    <SafeAreaModal
      isOpen={isOpen}
      onClose={onClose}
      type="info"
      showCloseButton={false}
    >
      <div className="text-center py-6">
        {/* 권한 아이콘 */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Icon className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {permissionTitles[currentPermission]} 권한
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {currentStep + 1} / {requiredPermissions.length}
          </p>
        </div>

        {/* 권한 설명 */}
        <div className="mb-8">
          <p className="text-gray-700 leading-relaxed">
            {getPermissionDescription(currentPermission)}
          </p>
        </div>

        {/* 플랫폼별 안내 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {isIOS && '시스템 팝업에서 "허용"을 선택해주세요.'}
            {isAndroid && '시스템 팝업에서 "허용" 또는 "앱 사용 중에만 허용"을 선택해주세요.'}
            {!isIOS && !isAndroid && '브라우저 팝업에서 "허용"을 선택해주세요.'}
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col space-y-3">
          <PlatformButton
            variant="primary"
            size="lg"
            fullWidth
            loading={isRequesting}
            onClick={handleRequestPermission}
          >
            권한 허용하기
          </PlatformButton>
          
          <PlatformButton
            variant="ghost"
            size="md"
            fullWidth
            onClick={handleSkip}
            disabled={isRequesting}
          >
            나중에 설정하기
          </PlatformButton>
        </div>
      </div>
    </SafeAreaModal>
  )

  // 모든 권한 요약 모달
  const SummaryModal = () => (
    <SafeAreaModal
      isOpen={isOpen}
      onClose={onClose}
      type="info"
      title="앱 권한 설정"
      showCloseButton={false}
    >
      <div className="py-4">
        {/* 권한 목록 */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            RunSpot이 최상의 서비스를 제공하기 위해 다음 권한이 필요합니다:
          </p>
          
          <div className="space-y-3">
            {requiredPermissions.map((type) => {
              const Icon = permissionIcons[type]
              const status = permissions[type]
              
              return (
                <div key={type} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">
                        {permissionTitles[type]}
                      </h4>
                      {getStatusIcon(status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {getPermissionDescription(type)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col space-y-3">
          <PlatformButton
            variant="primary"
            size="lg"
            fullWidth
            loading={isRequesting}
            onClick={handleRequestAllPermissions}
          >
            모든 권한 허용하기
          </PlatformButton>
          
          <PlatformButton
            variant="secondary"
            size="md"
            fullWidth
            onClick={handleOpenSettings}
            disabled={isRequesting}
            leftIcon={<Settings className="w-4 h-4" />}
          >
            설정에서 직접 변경
          </PlatformButton>
          
          <PlatformButton
            variant="ghost"
            size="md"
            fullWidth
            onClick={handleSkip}
            disabled={isRequesting}
          >
            나중에 설정하기
          </PlatformButton>
        </div>
      </div>
    </SafeAreaModal>
  )

  // 권한이 1개면 단계별, 여러 개면 요약 모달
  return requiredPermissions.length === 1 ? <StepByStepModal /> : <SummaryModal />
}
