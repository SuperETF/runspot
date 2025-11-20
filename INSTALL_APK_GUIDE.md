# RunSpot APK 휴대폰 설치 가이드

## 📱 휴대폰에 APK 설치하는 방법

### 방법 1: ADB를 통한 설치 (추천)

#### 1. 휴대폰 설정
```
설정 → 개발자 옵션 → USB 디버깅 활성화
설정 → 보안 → 알 수 없는 소스 허용
```

#### 2. 휴대폰을 맥에 USB 연결

#### 3. ADB로 설치
```bash
# APK 파일 위치 확인
ls android/app/build/outputs/apk/debug/

# 연결된 기기 확인
adb devices

# APK 설치
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 방법 2: 파일 전송 후 직접 설치

#### 1. APK 파일을 휴대폰으로 전송
- 이메일, 클라우드 드라이브, USB 등 사용
- 파일 위치: `android/app/build/outputs/apk/debug/app-debug.apk`

#### 2. 휴대폰에서 설치
```
파일 관리자 → APK 파일 클릭 → 설치
```

### 방법 3: Android Studio에서 직접 실행

#### 1. 휴대폰을 USB로 연결

#### 2. Android Studio에서
```
상단 툴바에서 기기 선택 → Run 버튼 클릭
```

## 🔧 문제 해결

### "알 수 없는 소스" 오류
```
설정 → 보안 → 알 수 없는 소스에서 앱 설치 허용
```

### ADB 명령어가 없는 경우
```bash
# Android SDK platform-tools 설치
brew install android-platform-tools
```

### 개발자 옵션이 없는 경우
```
설정 → 휴대폰 정보 → 빌드 번호를 7번 연속 탭
```

## 📋 APK 빌드 완료 체크리스트

- [ ] Android Studio에서 프로젝트 열기
- [ ] Build → Build APK(s) 실행
- [ ] APK 파일 생성 확인
- [ ] 휴대폰 개발자 옵션 활성화
- [ ] USB 디버깅 허용
- [ ] APK 설치 및 앱 실행 테스트

## 🎯 테스트 항목

설치 후 다음 기능들을 테스트해보세요:

1. **앱 실행**: 스플래시 화면 → 메인 화면
2. **위치 권한**: GPS 권한 요청 및 허용
3. **지도 표시**: 카카오맵 정상 로딩
4. **런닝 시작**: 코스 선택 → 런닝 시작
5. **네비게이션**: 1인칭 모드 진입
6. **GPS 추적**: 실시간 위치 업데이트

## 🚨 주의사항

- **Debug APK**: 개발용이므로 성능이 최적화되지 않음
- **권한**: GPS, 위치 권한 반드시 허용
- **네트워크**: 카카오맵 API 사용을 위해 인터넷 연결 필요
- **HTTPS**: 일부 기능은 HTTPS 환경에서만 동작

## 📞 문제 발생 시

1. APK 빌드 실패: Android Studio 콘솔 확인
2. 설치 실패: 휴대폰 설정 확인
3. 앱 실행 오류: 권한 설정 확인
4. GPS 오류: 위치 서비스 활성화 확인
