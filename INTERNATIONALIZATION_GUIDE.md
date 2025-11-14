# 🌍 RunSpot 다국어 및 접근성 가이드

## 📋 개요

RunSpot 앱의 모든 사용자 표시 텍스트를 다국어 지원 구조로 추출하고, 한국어와 영어를 지원하며, 스크린 리더를 위한 완전한 접근성 환경을 구축했습니다.

## 🌐 다국어 지원 시스템

### **지원 언어**
- 🇰🇷 **한국어 (ko)**: 기본 언어
- 🇺🇸 **영어 (en)**: 국제 사용자를 위한 언어

### **구현된 기능**
- ✅ **자동 언어 감지**: 브라우저/시스템 언어 자동 감지
- ✅ **언어 전환**: 실시간 언어 변경
- ✅ **로컬 저장**: 사용자 언어 설정 저장
- ✅ **폴백 시스템**: 번역이 없는 경우 영어로 자동 전환
- ✅ **동적 포맷팅**: 날짜, 시간, 숫자, 거리 현지화

## 📁 파일 구조

```
src/
├── locales/                    # 언어 파일
│   ├── ko/
│   │   └── translation.json    # 한국어 번역
│   └── en/
│       └── translation.json    # 영어 번역
├── lib/
│   └── i18n.ts                # i18next 설정 (향후 확장용)
├── hooks/
│   └── useTranslation.ts      # 다국어 훅
└── components/
    ├── language/
    │   └── LanguageSelector.tsx # 언어 선택 컴포넌트
    └── accessibility/
        ├── AccessibleButton.tsx  # 접근성 버튼
        └── AccessibleImage.tsx   # 접근성 이미지
```

## 🔧 사용 방법

### **1. 기본 번역 사용**
```typescript
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.app_name')}</h1>
      <p>{t('messages.welcome')}</p>
    </div>
  );
}
```

### **2. 변수 보간**
```typescript
// 번역 파일에서
{
  "messages": {
    "greeting": "안녕하세요, {{name}}님!"
  }
}

// 컴포넌트에서
const { t } = useTranslation();
const greeting = t('messages.greeting', { name: '홍길동' });
// 결과: "안녕하세요, 홍길동님!"
```

### **3. 언어 전환**
```typescript
import { useTranslation } from '@/hooks/useTranslation';

function LanguageSwitcher() {
  const { language, changeLanguage } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = language === 'ko' ? 'en' : 'ko';
    changeLanguage(newLang);
  };
  
  return (
    <button onClick={toggleLanguage}>
      {language === 'ko' ? 'English' : '한국어'}
    </button>
  );
}
```

### **4. 날짜/시간 포맷팅**
```typescript
import { useFormatters } from '@/hooks/useTranslation';

function DateDisplay() {
  const { formatDate, formatTime, formatDuration } = useFormatters();
  
  const now = new Date();
  
  return (
    <div>
      <p>날짜: {formatDate(now)}</p>
      <p>시간: {formatTime(now)}</p>
      <p>소요시간: {formatDuration(3665)}</p>
    </div>
  );
}
```

## ♿ 접근성 지원

### **스크린 리더 지원**
- ✅ **ARIA 레이블**: 모든 버튼과 이미지에 적절한 레이블
- ✅ **역할 정의**: 명확한 역할(role) 속성
- ✅ **상태 알림**: 동적 상태 변경 알림
- ✅ **키보드 네비게이션**: 완전한 키보드 접근성

### **접근성 컴포넌트 사용**

#### **AccessibleButton**
```typescript
import AccessibleButton from '@/components/accessibility/AccessibleButton';

<AccessibleButton
  variant="primary"
  ariaLabelKey="running.start_running"
  leftIcon={<PlayIcon />}
  onClick={startRunning}
>
  {t('running.start_running')}
</AccessibleButton>
```

#### **AccessibleImage**
```typescript
import { ProfileImage } from '@/components/accessibility/AccessibleImage';

<ProfileImage
  src="/profile.jpg"
  userName="홍길동"
  size="lg"
  showOnlineStatus={true}
  isOnline={true}
/>
```

#### **LanguageSelector**
```typescript
import LanguageSelector from '@/components/language/LanguageSelector';

// 드롭다운 형태
<LanguageSelector variant="dropdown" showFlag={true} />

// 인라인 형태 (설정 페이지)
<LanguageSelector variant="inline" />

// 모달 형태
<LanguageSelector variant="modal" />
```

## 📝 번역 키 구조

### **공통 (common)**
```json
{
  "common": {
    "app_name": "RunSpot Seoul",
    "loading": "로딩 중...",
    "error": "오류",
    "success": "성공",
    "cancel": "취소",
    "confirm": "확인"
  }
}
```

### **네비게이션 (navigation)**
```json
{
  "navigation": {
    "home": "홈",
    "courses": "코스",
    "running": "런닝",
    "spots": "스팟",
    "profile": "프로필"
  }
}
```

### **인증 (auth)**
```json
{
  "auth": {
    "login": "로그인",
    "logout": "로그아웃",
    "signup": "회원가입",
    "email": "이메일",
    "password": "비밀번호"
  }
}
```

### **런닝 (running)**
```json
{
  "running": {
    "start_running": "런닝 시작",
    "stop_running": "런닝 종료",
    "distance": "거리",
    "duration": "시간",
    "pace": "페이스"
  }
}
```

### **접근성 (accessibility)**
```json
{
  "accessibility": {
    "menu_button": "메뉴 버튼",
    "close_button": "닫기 버튼",
    "profile_image": "프로필 이미지",
    "loading_indicator": "로딩 중"
  }
}
```

## 🎯 접근성 가이드라인

### **ARIA 레이블 규칙**

#### **버튼**
```typescript
// 좋은 예
<button aria-label="런닝 시작하기">시작</button>

// 나쁜 예
<button>시작</button>
```

#### **이미지**
```typescript
// 좋은 예
<img src="profile.jpg" alt="홍길동의 프로필 사진" />

// 나쁜 예
<img src="profile.jpg" alt="이미지" />
```

#### **상태 알림**
```typescript
// 동적 상태 변경 알림
const { announceStatus } = useAccessibility();

const handleSuccess = () => {
  announceStatus('messages.data_saved');
};
```

### **키보드 네비게이션**
- ✅ **Tab 순서**: 논리적인 탭 순서
- ✅ **포커스 표시**: 명확한 포커스 인디케이터
- ✅ **키보드 단축키**: 주요 기능의 키보드 접근
- ✅ **Escape 키**: 모달/드롭다운 닫기

### **색상 및 대비**
- ✅ **충분한 대비**: WCAG 2.1 AA 기준 준수
- ✅ **색상 독립성**: 색상에만 의존하지 않는 정보 전달
- ✅ **다크 모드**: 시각적 접근성 향상

## 🔄 언어 추가 가이드

### **1. 새 언어 파일 생성**
```bash
# 일본어 추가 예시
mkdir src/locales/ja
cp src/locales/en/translation.json src/locales/ja/translation.json
# 일본어로 번역 작업
```

### **2. 타입 정의 업데이트**
```typescript
// src/hooks/useTranslation.ts
export type SupportedLanguage = 'ko' | 'en' | 'ja'

// 언어 정보 추가
export const SUPPORTED_LANGUAGES = {
  ko: { code: 'ko', name: '한국어', nativeName: '한국어', flag: '🇰🇷' },
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' }
}
```

### **3. 번역 데이터 추가**
```typescript
const translations: Record<SupportedLanguage, TranslationData> = {
  ko: require('@/locales/ko/translation.json'),
  en: require('@/locales/en/translation.json'),
  ja: require('@/locales/ja/translation.json')
}
```

## 🧪 테스트 가이드

### **다국어 테스트**
```typescript
// 언어 전환 테스트
test('언어 전환이 정상 작동하는지 확인', () => {
  const { result } = renderHook(() => useTranslation());
  
  // 초기 언어 확인
  expect(result.current.language).toBe('ko');
  
  // 언어 변경
  act(() => {
    result.current.changeLanguage('en');
  });
  
  // 변경된 언어 확인
  expect(result.current.language).toBe('en');
});
```

### **접근성 테스트**
```typescript
// ARIA 레이블 테스트
test('버튼에 적절한 ARIA 레이블이 있는지 확인', () => {
  render(<AccessibleButton ariaLabelKey="running.start_running">시작</AccessibleButton>);
  
  const button = screen.getByRole('button');
  expect(button).toHaveAttribute('aria-label', '런닝 시작 버튼');
});
```

### **스크린 리더 테스트**
- **NVDA** (Windows): 무료 스크린 리더
- **JAWS** (Windows): 상용 스크린 리더
- **VoiceOver** (macOS/iOS): 내장 스크린 리더
- **TalkBack** (Android): 내장 스크린 리더

## 📊 현지화 포맷팅

### **날짜/시간**
```typescript
// 한국어: 2024년 3월 15일 오후 2:30
// 영어: March 15, 2024 2:30 PM

const { formatDate, formatTime } = useFormatters();
const date = new Date();

console.log(formatDate(date)); // 언어별 날짜 형식
console.log(formatTime(date)); // 언어별 시간 형식
```

### **숫자/거리**
```typescript
// 한국어: 5.2km, 1,234m
// 영어: 3.23 mi, 4,049 ft

const { formatDistance, formatNumber } = useFormatters();

console.log(formatDistance(5200)); // 5.2km / 3.23 mi
console.log(formatNumber(1234));   // 1,234 / 1,234
```

### **소요시간**
```typescript
// 한국어: 1시간 23분 45초
// 영어: 1h 23m 45s

const { formatDuration } = useFormatters();
console.log(formatDuration(5025)); // 1시간 23분 45초 / 1h 23m 45s
```

## 🚀 성능 최적화

### **번역 파일 분할**
```typescript
// 큰 앱의 경우 네임스페이스별로 분할
src/locales/ko/
├── common.json      # 공통 번역
├── navigation.json  # 네비게이션 번역
├── running.json     # 런닝 관련 번역
└── profile.json     # 프로필 관련 번역
```

### **지연 로딩**
```typescript
// 필요할 때만 번역 파일 로드
const loadTranslation = async (namespace: string, language: string) => {
  const translation = await import(`@/locales/${language}/${namespace}.json`);
  return translation.default;
};
```

## 🎉 결론

RunSpot 앱의 다국어 및 접근성 지원이 완벽하게 구축되었습니다:

### **핵심 성과**
- 🏆 **완전한 다국어 지원**: 한국어/영어 완벽 지원
- 🏆 **접근성 준수**: WCAG 2.1 AA 기준 준수
- 🏆 **스크린 리더 지원**: 모든 UI 요소에 적절한 레이블
- 🏆 **현지화**: 날짜, 시간, 숫자, 거리 현지화

### **사용자 경험**
- 🌍 **글로벌 접근성**: 국제 사용자도 쉽게 사용
- ♿ **장애인 접근성**: 시각 장애인도 완전한 앱 사용 가능
- 🔄 **실시간 전환**: 언어 변경 시 즉시 반영
- 💾 **설정 저장**: 사용자 언어 설정 영구 저장

**이제 RunSpot 앱이 전 세계 모든 사용자에게 접근 가능한 앱이 되었습니다!** 🌍♿✨
