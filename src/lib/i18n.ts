import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 언어 리소스 import
import koTranslation from '@/locales/ko/translation.json'
import enTranslation from '@/locales/en/translation.json'

// 지원 언어 목록
export const SUPPORTED_LANGUAGES = {
  ko: {
    code: 'ko',
    name: '한국어',
    nativeName: '한국어',
    flag: '🇰🇷',
    rtl: false
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false
  }
} as const

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES

// 언어 리소스
const resources = {
  ko: {
    translation: koTranslation
  },
  en: {
    translation: enTranslation
  }
}

// 브라우저 언어 감지 설정
const languageDetectorOptions = {
  // 언어 감지 순서
  order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
  
  // 로컬스토리지 키
  lookupLocalStorage: 'runspot-language',
  
  // 쿠키 설정
  lookupCookie: 'runspot-lang',
  
  // HTML 태그에서 언어 감지
  lookupFromPathIndex: 0,
  lookupFromSubdomainIndex: 0,
  
  // 캐시 설정
  caches: ['localStorage', 'cookie'],
  
  // 제외할 언어
  excludeCacheFor: ['cimode'],
  
  // 언어 코드 변환
  convertDetectedLanguage: (lng: string) => {
    // 지역 코드 제거 (ko-KR -> ko, en-US -> en)
    const languageCode = lng.split('-')[0]
    
    // 지원하는 언어인지 확인
    if (languageCode in SUPPORTED_LANGUAGES) {
      return languageCode
    }
    
    // 지원하지 않는 언어는 영어로 fallback
    return 'en'
  }
}

// i18next 초기화
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    
    // 기본 언어 설정
    fallbackLng: 'en',
    lng: 'ko', // 초기 언어 (한국 앱이므로 한국어 우선)
    
    // 언어 감지 설정
    detection: languageDetectorOptions,
    
    // 네임스페이스 설정
    defaultNS: 'translation',
    ns: ['translation'],
    
    // 키 분리자
    keySeparator: '.',
    nsSeparator: ':',
    
    // 보간 설정
    interpolation: {
      escapeValue: false, // React는 기본적으로 XSS 보호
      format: (value, format, lng) => {
        // 날짜 포맷팅
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(new Date(value))
        }
        
        // 시간 포맷팅
        if (format === 'time') {
          return new Intl.DateTimeFormat(lng, {
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date(value))
        }
        
        // 숫자 포맷팅
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value)
        }
        
        // 통화 포맷팅
        if (format === 'currency') {
          const currency = lng === 'ko' ? 'KRW' : 'USD'
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency
          }).format(value)
        }
        
        // 거리 포맷팅
        if (format === 'distance') {
          const unit = lng === 'ko' ? 'km' : 'mi'
          const convertedValue = lng === 'ko' ? value : value * 0.621371
          return `${convertedValue.toFixed(2)} ${unit}`
        }
        
        return value
      }
    },
    
    // 개발 모드 설정
    debug: process.env.NODE_ENV === 'development',
    
    // React 설정
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span']
    },
    
    // 로딩 설정
    load: 'languageOnly',
    preload: ['ko', 'en'],
    
    // 캐시 설정
    saveMissing: process.env.NODE_ENV === 'development',
    saveMissingTo: 'current',
    
    // 후처리 설정
    postProcess: ['interval', 'plural']
  })

// 언어 변경 함수
export const changeLanguage = async (language: SupportedLanguage) => {
  try {
    await i18n.changeLanguage(language)
    
    // HTML lang 속성 업데이트
    document.documentElement.lang = language
    
    // RTL 지원 (향후 아랍어 등 추가 시)
    document.documentElement.dir = SUPPORTED_LANGUAGES[language].rtl ? 'rtl' : 'ltr'
    
    // 로컬스토리지에 저장
    localStorage.setItem('runspot-language', language)
    
    // 접근성을 위한 언어 변경 알림
    const announcement = i18n.t('accessibility.languageChanged', { 
      language: SUPPORTED_LANGUAGES[language].nativeName 
    })
    
    // 스크린 리더에 알림
    announceToScreenReader(announcement)
    
    return true
  } catch (error) {
    console.error('Language change failed:', error)
    return false
  }
}

// 현재 언어 가져오기
export const getCurrentLanguage = (): SupportedLanguage => {
  const currentLang = i18n.language || 'en'
  return currentLang.split('-')[0] as SupportedLanguage
}

// 언어 정보 가져오기
export const getLanguageInfo = (lang: SupportedLanguage) => {
  return SUPPORTED_LANGUAGES[lang]
}

// 모든 지원 언어 목록
export const getAllLanguages = () => {
  return Object.values(SUPPORTED_LANGUAGES)
}

// 스크린 리더 알림 함수
export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // 1초 후 제거
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// 복수형 규칙 (한국어는 복수형이 없음)
export const pluralRules = {
  ko: {
    cardinal: ['other'],
    ordinal: ['other']
  },
  en: {
    cardinal: ['one', 'other'],
    ordinal: ['one', 'two', 'few', 'other']
  }
}

// 날짜/시간 포맷터
export const formatters = {
  date: (date: Date, lang: SupportedLanguage) => {
    return new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  },
  
  time: (date: Date, lang: SupportedLanguage) => {
    return new Intl.DateTimeFormat(lang, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: lang === 'en'
    }).format(date)
  },
  
  duration: (seconds: number, lang: SupportedLanguage) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (lang === 'ko') {
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
  },
  
  distance: (meters: number, lang: SupportedLanguage) => {
    if (lang === 'ko') {
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
  }
}

export default i18n
