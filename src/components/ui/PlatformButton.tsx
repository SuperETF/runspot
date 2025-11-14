'use client'

import React from 'react'
import { usePlatformDetection } from '@/hooks/usePlatformDetection'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface PlatformButtonProps {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export default function PlatformButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onClick,
  className = '',
  type = 'button'
}: PlatformButtonProps) {
  const { isIOS, isAndroid } = usePlatformDetection()

  // iOS Cupertino 스타일 버튼
  const CupertinoButton = () => {
    const baseClasses = `
      inline-flex items-center justify-center font-medium rounded-xl
      transition-all duration-200 ease-out active:scale-95
      ${fullWidth ? 'w-full' : ''}
      ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${className}
    `

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm min-h-[32px]',
      md: 'px-6 py-3 text-base min-h-[44px]',
      lg: 'px-8 py-4 text-lg min-h-[50px]'
    }

    const variantClasses = {
      primary: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
      outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50 active:bg-blue-100',
      ghost: 'text-blue-500 hover:bg-blue-50 active:bg-blue-100',
      destructive: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm'
    }

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`}
        style={{
          fontSize: size === 'sm' ? '15px' : size === 'md' ? '17px' : '19px',
          fontWeight: '600',
          letterSpacing: '-0.41px'
        }}
      >
        {loading && (
          <div className="mr-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }

  // Android Material Design 3 스타일 버튼
  const MaterialButton = () => {
    const baseClasses = `
      inline-flex items-center justify-center font-medium rounded-full
      transition-all duration-300 relative overflow-hidden
      ${fullWidth ? 'w-full' : ''}
      ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${className}
    `

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm min-h-[36px]',
      md: 'px-6 py-3 text-base min-h-[48px]',
      lg: 'px-8 py-4 text-lg min-h-[56px]'
    }

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg',
      secondary: 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200 border border-blue-200',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100',
      ghost: 'text-blue-600 hover:bg-blue-50 active:bg-blue-100',
      destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-md hover:shadow-lg'
    }

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`}
        style={{
          fontSize: size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px',
          fontWeight: '500',
          letterSpacing: size === 'sm' ? '0.5px' : '0.1px',
          transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)'
        }}
      >
        {/* Material Design Ripple Effect */}
        <span 
          className="absolute inset-0 bg-white/20 rounded-full scale-0 group-active:scale-100 transition-transform duration-300"
          style={{ transition: 'transform 300ms cubic-bezier(0.4, 0.0, 0.2, 1)' }}
        />
        
        {loading && (
          <div className="mr-2 relative z-10">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {leftIcon && !loading && <span className="mr-2 relative z-10">{leftIcon}</span>}
        <span className="relative z-10">{children}</span>
        {rightIcon && <span className="ml-2 relative z-10">{rightIcon}</span>}
      </button>
    )
  }

  // 웹 스타일 버튼
  const WebButton = () => {
    const baseClasses = `
      inline-flex items-center justify-center font-medium rounded-lg
      transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      ${fullWidth ? 'w-full' : ''}
      ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${className}
    `

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[32px]',
      md: 'px-4 py-2 text-base min-h-[40px]',
      lg: 'px-6 py-3 text-lg min-h-[48px]'
    }

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border border-gray-300',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
      ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
      destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md'
    }

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`}
      >
        {loading && (
          <div className="mr-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }

  // 플랫폼별 컴포넌트 선택
  if (isIOS) {
    return <CupertinoButton />
  } else if (isAndroid) {
    return <MaterialButton />
  } else {
    return <WebButton />
  }
}
