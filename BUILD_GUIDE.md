# RunSpot 빌드 및 배포 가이드

## 🚀 지원 플랫폼
- ✅ **웹 (PWA)**: 브라우저에서 직접 실행
- ✅ **Android APK**: Google Play Store 또는 직접 설치
- ✅ **iOS App**: App Store 또는 TestFlight

## 📋 사전 준비사항

### 필수 도구
- Node.js 18+ 
- npm 또는 yarn
- Android Studio (Android 빌드용)
- Xcode (iOS 빌드용, macOS만)

### 환경 변수 설정
```bash
# .env.local 파일 생성
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_api_key
```

## 🔧 개발 환경 실행

### 웹 개발 서버
```bash
npm run dev                    # 로컬 개발
npm run dev:network           # 네트워크 접근 가능
npm run dev:https             # HTTPS 개발 (GPS 테스트용)
```

## 📦 빌드 명령어

### 1. 웹/PWA 빌드
```bash
npm run build                 # 웹용 정적 빌드
npm start                     # 프로덕션 서버 실행
```

### 2. 모바일 앱 빌드
```bash
npm run build:mobile          # Next.js 빌드 + Capacitor 동기화
```

## 📱 Android 앱 빌드

### 개발 빌드
```bash
npm run cap:run:android       # 에뮬레이터/기기에서 실행
npm run cap:open:android      # Android Studio에서 열기
```

### 프로덕션 APK 생성
1. Android Studio에서 프로젝트 열기
2. Build → Generate Signed Bundle/APK
3. APK 선택 후 키스토어 설정
4. Release 빌드 생성

## 🍎 iOS 앱 빌드 (macOS만)

### 개발 빌드
```bash
npm run cap:run:ios           # 시뮬레이터/기기에서 실행
npm run cap:open:ios          # Xcode에서 열기
```

### App Store 배포
1. Xcode에서 프로젝트 열기
2. Product → Archive
3. App Store Connect에 업로드
4. TestFlight 또는 App Store 배포

## 🔄 업데이트 프로세스

### 코드 변경 후
```bash
npm run build:mobile          # 웹 빌드 + 네이티브 동기화
npm run cap:sync              # 네이티브 프로젝트 동기화만
```

## 🛠️ 주요 설정 파일

### PWA 설정
- `public/manifest.json`: PWA 매니페스트
- `next.config.ts`: PWA 및 빌드 설정

### Capacitor 설정
- `capacitor.config.ts`: 네이티브 앱 설정
- `android/app/src/main/AndroidManifest.xml`: Android 권한
- `ios/App/App/Info.plist`: iOS 권한

## 🔐 권한 설정

### Android
- GPS/위치: `ACCESS_FINE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`
- 네트워크: `INTERNET`, `ACCESS_NETWORK_STATE`
- 카메라: `CAMERA`

### iOS
- 위치: `NSLocationWhenInUseUsageDescription`
- 백그라운드 위치: `NSLocationAlwaysAndWhenInUseUsageDescription`
- 카메라: `NSCameraUsageDescription`

## 🚨 문제 해결

### GPS 권한 오류
```bash
# HTTPS 개발 서버로 테스트
npm run dev:https
```

### 빌드 오류
```bash
# 캐시 정리 후 재빌드
rm -rf .next out node_modules
npm install
npm run build:mobile
```

### 네이티브 동기화 오류
```bash
# Capacitor 재동기화
npx cap sync
```

## 📊 성능 최적화

### PWA 캐싱
- 카카오맵 API: 24시간 캐시
- 이미지: 30일 캐시
- 오프라인 지원

### 모바일 최적화
- 정적 export로 빠른 로딩
- GPS 백그라운드 추적 지원
- 네이티브 성능 최적화

## 🔗 유용한 링크
- [Capacitor 문서](https://capacitorjs.com/docs)
- [Next.js PWA 가이드](https://github.com/shadowwalker/next-pwa)
- [카카오맵 API](https://apis.map.kakao.com/)
