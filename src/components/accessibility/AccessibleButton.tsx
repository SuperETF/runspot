'use client'

import React, { forwardRef } from 'react'
import { useTranslation, useAccessibility } from '@/hooks/useTranslation'

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  ariaLabelKey?: string
  ariaLabelOptions?: Record<string, any>
  fullWidth?: boolean
  children: React.ReactNode
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  ariaLabelKey,
  ariaLabelOptions,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}, ref) => {
  const { t } = useTranslation()
  const { getButtonA11yProps } = useAccessibility()

  // 버튼 스타일
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 active:bg-gray-300',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800'
  }
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5'
  }
  
  const widthStyles = fullWidth ? 'w-full' : ''
  
  // 접근성 속성
  const a11yProps = ariaLabelKey ? getButtonA11yProps(ariaLabelKey, ariaLabelOptions) : {}
  
  // 로딩 상태 처리
  const isDisabled = disabled || loading
  
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
      aria-busy={loading}
      aria-disabled={isDisabled}
      {...a11yProps}
      {...props}
    >
      {/* 로딩 스피너 */}
      {loading && (
        <svg
          className={`animate-spin ${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`}
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {/* 왼쪽 아이콘 */}
      {!loading && leftIcon && (
        <span aria-hidden="true">{leftIcon}</span>
      )}
      
      {/* 버튼 텍스트 */}
      <span>{children}</span>
      
      {/* 오른쪽 아이콘 */}
      {!loading && rightIcon && (
        <span aria-hidden="true">{rightIcon}</span>
      )}
      
      {/* 스크린 리더용 로딩 텍스트 */}
      {loading && (
        <span className="sr-only">
          {t('common.loading')}
        </span>
      )}
    </button>
  )
})

AccessibleButton.displayName = 'AccessibleButton'

export default AccessibleButton

// 아이콘 버튼 컴포넌트
interface AccessibleIconButtonProps extends Omit<AccessibleButtonProps, 'children'> {
  icon: React.ReactNode
  tooltipKey?: string
  tooltipOptions?: Record<string, any>
}

export const AccessibleIconButton = forwardRef<HTMLButtonElement, AccessibleIconButtonProps>(({
  icon,
  tooltipKey,
  tooltipOptions,
  ariaLabelKey,
  ariaLabelOptions,
  size = 'md',
  variant = 'ghost',
  className = '',
  ...props
}, ref) => {
  const { t } = useTranslation()
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  }
  
  const buttonSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  }
  
  return (
    <AccessibleButton
      ref={ref}
      variant={variant}
      size={size}
      ariaLabelKey={ariaLabelKey}
      ariaLabelOptions={ariaLabelOptions}
      className={`${buttonSizes[size]} ${className}`}
      title={tooltipKey ? t(tooltipKey, tooltipOptions) : undefined}
      {...props}
    >
      <span className={iconSizes[size]} aria-hidden="true">
        {icon}
      </span>
    </AccessibleButton>
  )
})

AccessibleIconButton.displayName = 'AccessibleIconButton'
