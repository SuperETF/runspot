'use client'

import React, { useEffect } from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { usePlatformDetection } from '@/hooks/usePlatformDetection'
import { useSafeArea } from '@/hooks/useSafeArea'

export type ModalType = 'alert' | 'confirm' | 'success' | 'error' | 'info' | 'custom'

interface SafeAreaModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  type?: ModalType
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  children?: React.ReactNode
  showCloseButton?: boolean
  className?: string
  fullScreen?: boolean
}

export default function SafeAreaModal({
  isOpen,
  onClose,
  onConfirm,
  type = 'alert',
  title = '',
  message = '',
  confirmText = '확인',
  cancelText = '취소',
  children,
  showCloseButton = true,
  className = '',
  fullScreen = false
}: SafeAreaModalProps) {
  const { isIOS, isAndroid } = usePlatformDetection()
  const { safeAreaInsets, viewport } = useSafeArea()

  // 모달이 열릴 때 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // 아이콘 선택
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />
      case 'confirm':
        return <AlertTriangle className="w-6 h-6 text-orange-500" />
      default:
        return null
    }
  }

  // 전체 화면 모달 (태블릿 가로 모드 등)
  if (fullScreen || (viewport.isTablet && viewport.isLandscape)) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-white"
        style={{
          paddingTop: safeAreaInsets.top,
          paddingBottom: safeAreaInsets.bottom,
          paddingLeft: safeAreaInsets.left,
          paddingRight: safeAreaInsets.right
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getIcon()}
            {title && (
              <h1 className="text-2xl font-bold text-gray-900">
                {title}
              </h1>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          )}
        </div>
        
        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {message && (
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              {message}
            </p>
          )}
          {children}
        </div>
        
        {/* 버튼 영역 */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          {(type === 'confirm' || onConfirm) && (
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) {
                onConfirm()
              }
              onClose()
            }}
            className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    )
  }

  // iOS Cupertino 스타일 모달
  const CupertinoModal = () => (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        paddingTop: Math.max(safeAreaInsets.top, 20),
        paddingBottom: Math.max(safeAreaInsets.bottom, 20),
        paddingLeft: Math.max(safeAreaInsets.left, 16),
        paddingRight: Math.max(safeAreaInsets.right, 16)
      }}
    >
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{
          animation: 'fadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      />
      
      {/* 모달 컨테이너 */}
      <div 
        className={`
          relative bg-white rounded-2xl shadow-2xl w-full max-w-sm
          ${className}
        `}
        style={{
          animation: 'slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          maxHeight: `${viewport.height - safeAreaInsets.top - safeAreaInsets.bottom - 40}px`
        }}
      >
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center space-x-3">
              {getIcon()}
              {title && (
                <h3 className="text-lg font-semibold text-gray-900" style={{ fontSize: '17px', fontWeight: '600' }}>
                  {title}
                </h3>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        )}
        
        {/* 내용 */}
        <div className="px-4 pb-4 max-h-96 overflow-y-auto">
          {message && (
            <p className="text-gray-700 mb-4" style={{ fontSize: '15px', lineHeight: '20px' }}>
              {message}
            </p>
          )}
          {children}
        </div>
        
        {/* 버튼 영역 */}
        {(type === 'confirm' || onConfirm) && (
          <div className="flex border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-center text-blue-500 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
              style={{ fontSize: '17px' }}
            >
              {cancelText}
            </button>
            <div className="w-px bg-gray-200" />
            <button
              onClick={() => {
                onConfirm?.()
                onClose()
              }}
              className="flex-1 py-3 text-center text-blue-500 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
              style={{ fontSize: '17px', fontWeight: '600' }}
            >
              {confirmText}
            </button>
          </div>
        )}
        
        {/* 단일 버튼 */}
        {type !== 'confirm' && !onConfirm && (
          <div className="border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full py-3 text-center text-blue-500 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
              style={{ fontSize: '17px', fontWeight: '600' }}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // Android Material Design 3 스타일 모달
  const MaterialModal = () => (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        paddingTop: Math.max(safeAreaInsets.top, 20),
        paddingBottom: Math.max(safeAreaInsets.bottom, 20),
        paddingLeft: Math.max(safeAreaInsets.left, 16),
        paddingRight: Math.max(safeAreaInsets.right, 16)
      }}
    >
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        style={{
          animation: 'fadeIn 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
        }}
      />
      
      {/* 모달 컨테이너 */}
      <div 
        className={`
          relative bg-white rounded-3xl shadow-2xl w-full max-w-sm
          ${className}
        `}
        style={{
          animation: 'scaleIn 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          maxHeight: `${viewport.height - safeAreaInsets.top - safeAreaInsets.bottom - 40}px`
        }}
      >
        {/* 헤더 */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {getIcon()}
              <div className="flex-1">
                {title && (
                  <h3 className="text-xl font-medium text-gray-900 mb-2" style={{ fontSize: '22px', fontWeight: '400' }}>
                    {title}
                  </h3>
                )}
                {message && (
                  <p className="text-gray-700" style={{ fontSize: '14px', lineHeight: '20px', letterSpacing: '0.25px' }}>
                    {message}
                  </p>
                )}
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-300"
                style={{ transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)' }}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>
        
        {/* 내용 */}
        {children && (
          <div className="px-6 pb-4 max-h-96 overflow-y-auto">
            {children}
          </div>
        )}
        
        {/* 버튼 영역 */}
        <div className="flex justify-end space-x-2 p-6 pt-4">
          {(type === 'confirm' || onConfirm) && (
            <button
              onClick={onClose}
              className="px-6 py-2 text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-full transition-all duration-300"
              style={{ 
                fontSize: '14px', 
                fontWeight: '500',
                transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)'
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) {
                onConfirm()
              }
              onClose()
            }}
            className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 rounded-full transition-all duration-300"
            style={{ 
              fontSize: '14px', 
              fontWeight: '500',
              transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )

  // 웹 스타일 모달
  const WebModal = () => (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        paddingTop: Math.max(safeAreaInsets.top, 20),
        paddingBottom: Math.max(safeAreaInsets.bottom, 20)
      }}
    >
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        style={{
          animation: 'fadeIn 0.25s ease-out'
        }}
      />
      
      {/* 모달 컨테이너 */}
      <div 
        className={`
          relative bg-white rounded-xl shadow-2xl w-full max-w-md
          ${className}
        `}
        style={{
          animation: 'slideUp 0.25s ease-out',
          maxHeight: `${viewport.height - 40}px`
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getIcon()}
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
        
        {/* 내용 */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {message && (
            <p className="text-gray-700 mb-4">
              {message}
            </p>
          )}
          {children}
        </div>
        
        {/* 버튼 영역 */}
        <div className="flex justify-end space-x-3 p-6 pt-0 border-t border-gray-200">
          {(type === 'confirm' || onConfirm) && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) {
                onConfirm()
              }
              onClose()
            }}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )

  // 플랫폼별 컴포넌트 선택
  if (isIOS) {
    return <CupertinoModal />
  } else if (isAndroid) {
    return <MaterialModal />
  } else {
    return <WebModal />
  }
}
