'use client'

import React, { useState } from 'react'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { useTranslation, useAccessibility, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/hooks/useTranslation'

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'modal' | 'inline'
  showFlag?: boolean
  showNativeName?: boolean
  className?: string
}

export default function LanguageSelector({
  variant = 'dropdown',
  showFlag = true,
  showNativeName = true,
  className = ''
}: LanguageSelectorProps) {
  const { t, language, changeLanguage } = useTranslation()
  const { getButtonA11yProps, announceStatus } = useAccessibility()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguageInfo = SUPPORTED_LANGUAGES[language]
  const languages = Object.values(SUPPORTED_LANGUAGES)

  const handleLanguageChange = async (newLanguage: SupportedLanguage) => {
    if (newLanguage === language) return

    try {
      changeLanguage(newLanguage)
      setIsOpen(false)
      
      // 접근성 알림
      announceStatus('accessibility.languageChanged', { 
        language: SUPPORTED_LANGUAGES[newLanguage].nativeName 
      })
    } catch (error) {
      console.error('Language change failed:', error)
    }
  }

  // 드롭다운 버전
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          {...getButtonA11yProps('settings.language')}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <Globe className="w-4 h-4 text-gray-600" />
          {showFlag && (
            <span className="text-lg" role="img" aria-label={currentLanguageInfo.name}>
              {currentLanguageInfo.flag}
            </span>
          )}
          <span className="text-sm font-medium text-gray-900">
            {showNativeName ? currentLanguageInfo.nativeName : currentLanguageInfo.name}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* 오버레이 */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            
            {/* 드롭다운 메뉴 */}
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <div className="py-1" role="menu" aria-orientation="vertical">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code as SupportedLanguage)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                    role="menuitem"
                    aria-label={`${t('settings.language')}: ${lang.nativeName}`}
                  >
                    <div className="flex items-center space-x-2">
                      {showFlag && (
                        <span className="text-lg" role="img" aria-label={lang.name}>
                          {lang.flag}
                        </span>
                      )}
                      <span className="text-sm text-gray-900">
                        {showNativeName ? lang.nativeName : lang.name}
                      </span>
                    </div>
                    {lang.code === language && (
                      <Check className="w-4 h-4 text-blue-600" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // 인라인 버전 (설정 페이지용)
  if (variant === 'inline') {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-gray-700">
          {t('settings.language')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code as SupportedLanguage)}
              className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                lang.code === language
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
              }`}
              aria-label={`${t('settings.language')}: ${lang.nativeName}`}
              aria-pressed={lang.code === language}
            >
              {showFlag && (
                <span className="text-xl" role="img" aria-label={lang.name}>
                  {lang.flag}
                </span>
              )}
              <div className="flex-1 text-left">
                <div className="font-medium">
                  {showNativeName ? lang.nativeName : lang.name}
                </div>
                <div className="text-xs opacity-75">
                  {lang.name}
                </div>
              </div>
              {lang.code === language && (
                <Check className="w-5 h-5 text-blue-600" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // 모달 버전
  return (
    <div className={className}>
      <button
        {...getButtonA11yProps('settings.language')}
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{t('settings.language')}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('settings.language')}
              </h3>
            </div>
            
            <div className="p-4 space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as SupportedLanguage)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    lang.code === language
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                  }`}
                  aria-label={`${t('settings.language')}: ${lang.nativeName}`}
                  aria-pressed={lang.code === language}
                >
                  <div className="flex items-center space-x-3">
                    {showFlag && (
                      <span className="text-xl" role="img" aria-label={lang.name}>
                        {lang.flag}
                      </span>
                    )}
                    <div className="text-left">
                      <div className="font-medium">
                        {showNativeName ? lang.nativeName : lang.name}
                      </div>
                      <div className="text-sm opacity-75">
                        {lang.name}
                      </div>
                    </div>
                  </div>
                  {lang.code === language && (
                    <Check className="w-5 h-5 text-blue-600" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                aria-label={t('common.close')}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 간단한 언어 토글 버튼
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, changeLanguage } = useTranslation()
  const { getButtonA11yProps } = useAccessibility()

  const toggleLanguage = () => {
    const newLanguage: SupportedLanguage = language === 'ko' ? 'en' : 'ko'
    changeLanguage(newLanguage)
  }

  const currentLang = SUPPORTED_LANGUAGES[language]
  const nextLang = SUPPORTED_LANGUAGES[language === 'ko' ? 'en' : 'ko']

  return (
    <button
      {...getButtonA11yProps('settings.language')}
      onClick={toggleLanguage}
      className={`flex items-center space-x-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors ${className}`}
      title={`Switch to ${nextLang.nativeName}`}
    >
      <span role="img" aria-label={currentLang.name}>
        {currentLang.flag}
      </span>
      <span className="font-medium">{currentLang.code.toUpperCase()}</span>
    </button>
  )
}
