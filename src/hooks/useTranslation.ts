import { useCallback, useEffect, useState } from 'react'

// 간단한 번역 시스템 (i18next 패키지 없이 구현)
interface TranslationData {
  [key: string]: any
}

// 지원 언어 타입
export type SupportedLanguage = 'ko' | 'en'

// 언어별 번역 데이터 저장소
const translations: Record<SupportedLanguage, TranslationData> = {
  ko: require('@/locales/ko/translation.json'),
  en: require('@/locales/en/translation.json')
}

// 현재 언어 상태
let currentLanguage: SupportedLanguage = 'ko'

// 언어 변경 리스너들
const languageChangeListeners: ((lang: SupportedLanguage) => void)[] = []

// 중첩된 객체에서 키로 값 가져오기
const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return path // 키를 찾을 수 없으면 원본 키 반환
    }
  }
  
  return typeof current === 'string' ? current : path
}

// 문자열 보간 처리
const interpolate = (template: string, values: Record<string, any> = {}): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] !== undefined ? String(values[key]) : match
  })
}

// 번역 함수
export const t = (key: string, options: Record<string, any> = {}): string => {
  const translation = getNestedValue(translations[currentLanguage], key)
  return interpolate(translation, options)
}

// 언어 변경 함수
export const changeLanguage = (language: SupportedLanguage): void => {
  const previousLanguage = currentLanguage
  currentLanguage = language
  
  // HTML lang 속성 업데이트
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
    
    // 로컬스토리지에 저장
    localStorage.setItem('runspot-language', language)
  }
  
  // 리스너들에게 알림
  languageChangeListeners.forEach(listener => listener(language))
  
  // 접근성 알림
  if (typeof document !== 'undefined') {
    announceToScreenReader(t('accessibility.languageChanged', { 
      language: language === 'ko' ? '한국어' : 'English' 
    }))
  }
}

// 현재 언어 가져오기
export const getCurrentLanguage = (): SupportedLanguage => {
  return currentLanguage
}

// 스크린 리더 알림
export const announceToScreenReader = (message: string): void => {
  if (typeof document === 'undefined') return
  
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only absolute -left-10000px w-1 h-1 overflow-hidden'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement)
    }
  }, 1000)
}

// React 훅
export const useTranslation = () => {
  const [language, setLanguage] = useState<SupportedLanguage>(currentLanguage)
  
  // 언어 변경 감지
  useEffect(() => {
    const listener = (newLanguage: SupportedLanguage) => {
      setLanguage(newLanguage)
    }
    
    languageChangeListeners.push(listener)
    
    // 초기 언어 설정 (로컬스토리지에서 읽기)
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('runspot-language') as SupportedLanguage
      if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
        changeLanguage(savedLanguage)
      }
    }
    
    return () => {
      const index = languageChangeListeners.indexOf(listener)
      if (index > -1) {
        languageChangeListeners.splice(index, 1)
      }
    }
  }, [])
  
  const translate = useCallback((key: string, options?: Record<string, any>) => {
    return t(key, options)
  }, [language])
  
  const switchLanguage = useCallback((newLanguage: SupportedLanguage) => {
    changeLanguage(newLanguage)
  }, [])
  
  return {
    t: translate,
    language,
    changeLanguage: switchLanguage,
    isKorean: language === 'ko',
    isEnglish: language === 'en'
  }
}

// 접근성 훅
export const useAccessibility = () => {
  const { t } = useTranslation()
  
  // 버튼 접근성 속성 생성
  const getButtonA11yProps = useCallback((labelKey: string, options?: Record<string, any>) => {
    return {
      'aria-label': t(labelKey, options),
      role: 'button',
      tabIndex: 0
    }
  }, [t])
  
  // 이미지 접근성 속성 생성
  const getImageA11yProps = useCallback((altKey: string, options?: Record<string, any>) => {
    return {
      alt: t(altKey, options),
      role: 'img'
    }
  }, [t])
  
  // 링크 접근성 속성 생성
  const getLinkA11yProps = useCallback((labelKey: string, options?: Record<string, any>) => {
    return {
      'aria-label': t(labelKey, options),
      role: 'link'
    }
  }, [t])
  
  // 입력 필드 접근성 속성 생성
  const getInputA11yProps = useCallback((labelKey: string, placeholderKey?: string, options?: Record<string, any>) => {
    return {
      'aria-label': t(labelKey, options),
      placeholder: placeholderKey ? t(placeholderKey, options) : undefined,
      'aria-required': 'true'
    }
  }, [t])
  
  // 상태 메시지 알림
  const announceStatus = useCallback((messageKey: string, options?: Record<string, any>) => {
    const message = t(messageKey, options)
    announceToScreenReader(message)
  }, [t])
  
  return {
    getButtonA11yProps,
    getImageA11yProps,
    getLinkA11yProps,
    getInputA11yProps,
    announceStatus,
    announceToScreenReader
  }
}

// 날짜/시간 포맷팅 훅
export const useFormatters = () => {
  const { language } = useTranslation()
  
  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }, [language])
  
  const formatTime = useCallback((date: Date) => {
    return new Intl.DateTimeFormat(language, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: language === 'en'
    }).format(date)
  }, [language])
  
  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (language === 'ko') {
      if (hours > 0) {
        return `${hours}시간 ${minutes}분 ${secs}초`
      } else if (minutes > 0) {
        return `${minutes}분 ${secs}초`
      } else {
        return `${secs}초`
      }
    } else {
      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`
      } else {
        return `${secs}s`
      }
    }
  }, [language])
  
  const formatDistance = useCallback((meters: number) => {
    if (language === 'ko') {
      if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)}km`
      } else {
        return `${meters.toFixed(0)}m`
      }
    } else {
      const miles = meters * 0.000621371
      const feet = meters * 3.28084
      
      if (miles >= 1) {
        return `${miles.toFixed(2)} mi`
      } else {
        return `${feet.toFixed(0)} ft`
      }
    }
  }, [language])
  
  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat(language).format(num)
  }, [language])
  
  return {
    formatDate,
    formatTime,
    formatDuration,
    formatDistance,
    formatNumber
  }
}

// 언어 정보
export const SUPPORTED_LANGUAGES = {
  ko: {
    code: 'ko',
    name: '한국어',
    nativeName: '한국어',
    flag: '🇰🇷'
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  }
} as const
