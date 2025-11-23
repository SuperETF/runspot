# RunSpot 네이티브 전체화면 네비게이션 가이드

## 🎯 개요

RunSpot 앱에 안드로이드 네이티브 전체화면 네비게이션 기능을 성공적으로 구현했습니다. 이 기능은 웹과 네이티브의 하이브리드 접근 방식을 사용하여 최적의 사용자 경험을 제공합니다.

## 🏗️ 아키텍처

### 하이브리드 구조
- **웹 환경**: 기존 웹 네비게이션 UI 사용
- **네이티브 환경**: 고성능 안드로이드 네이티브 네비게이션 액티비티 사용
- **자동 감지**: Capacitor를 통해 플랫폼을 자동 감지하여 적절한 모드 선택

### 주요 컴포넌트

#### 1. 웹-네이티브 브릿지
- **파일**: `src/plugins/NativeNavigation.ts`
- **역할**: 웹과 네이티브 간 데이터 통신 인터페이스
- **기능**: 네비게이션 시작/종료, 실시간 데이터 동기화

#### 2. 안드로이드 네이티브 액티비티
- **파일**: `android/app/src/main/java/com/runspot/app/NativeNavigationActivity.java`
- **역할**: 전체화면 네비게이션 UI 및 GPS 추적
- **기능**: 실시간 위치 추적, 네비게이션 계산, 음성 안내

#### 3. 하이브리드 웹 컴포넌트
- **파일**: `src/components/navigation/HybridFullScreenNavigation.tsx`
- **역할**: 플랫폼별 네비게이션 모드 자동 선택
- **기능**: 네이티브/웹 모드 전환, 데이터 동기화

## 🚀 사용법

### 1. 기본 사용법

```typescript
import HybridFullScreenNavigation from '@/components/navigation/HybridFullScreenNavigation'

function RunningPage() {
  const [isNavActive, setIsNavActive] = useState(false)
  const [courseRoute, setCourseRoute] = useState<GPSCoordinate[]>([])
  const [currentPosition, setCurrentPosition] = useState<GPSCoordinate | null>(null)

  return (
    <HybridFullScreenNavigation
      isActive={isNavActive}
      onClose={() => setIsNavActive(false)}
      courseRoute={courseRoute}
      currentPosition={currentPosition}
      onLocationUpdate={setCurrentPosition}
    />
  )
}
```

### 2. 네이티브 플러그인 직접 사용

```typescript
import NativeNavigation from '@/plugins/NativeNavigation'

// 네이티브 네비게이션 시작
const startNavigation = async () => {
  const navigationData = {
    courseRoute: [...],
    currentPosition: {...},
    navigationState: {...}
  }
  
  const result = await NativeNavigation.startFullScreenNavigation({ data: navigationData })
  if (result.success) {
    console.log('네이티브 네비게이션 시작됨')
  }
}

// 위치 업데이트 리스너
const locationListener = await NativeNavigation.addListener(
  'navigationLocationUpdate',
  (data) => {
    console.log('새로운 위치:', data.position)
  }
)
```

## 🔧 개발 및 빌드

### 1. 개발 환경 설정

```bash
# 의존성 설치
npm install

# 웹 개발 서버 실행
npm run dev

# 모바일 빌드
npm run build:mobile
```

### 2. 안드로이드 빌드 및 테스트

```bash
# 안드로이드 스튜디오 열기
npx cap open android

# 안드로이드 실행 (디바이스/에뮬레이터)
npx cap run android
```

### 3. 디버깅

#### 웹 디버깅
- 브라우저 개발자 도구 사용
- `console.log`로 네비게이션 상태 확인

#### 안드로이드 디버깅
- Android Studio Logcat 사용
- 태그 `NativeNavigation`으로 필터링
- Chrome DevTools로 WebView 디버깅

## 📱 네이티브 기능

### 1. GPS 추적
- **정확도**: 고정밀 GPS 사용
- **업데이트 주기**: 1초마다 위치 업데이트
- **배터리 최적화**: 화면 꺼짐 방지, 백그라운드 추적

### 2. 네비게이션 계산
- **진행률 계산**: 실시간 코스 진행률 추적
- **이탈 감지**: 코스에서 벗어남 자동 감지
- **턴바이턴 안내**: 다음 방향 전환 지점 안내

### 3. UI/UX
- **전체화면**: 몰입형 네비게이션 경험
- **실시간 정보**: 속도, 방향, 남은 거리 표시
- **직관적 컨트롤**: 간단한 종료 버튼

## 🎨 커스터마이징

### 1. UI 스타일 수정

안드로이드 레이아웃 파일 수정:
```xml
<!-- android/app/src/main/res/layout/activity_native_navigation.xml -->
<TextView
    android:id="@+id/nextTurnText"
    android:textColor="#FFFFFF"
    android:textSize="18sp"
    android:textStyle="bold" />
```

### 2. 네비게이션 로직 수정

Java 액티비티 파일 수정:
```java
// android/app/src/main/java/com/runspot/app/NativeNavigationActivity.java
private void calculateNavigationProgress(Location currentLocation) {
    // 커스텀 네비게이션 계산 로직
}
```

### 3. 웹-네이티브 통신 확장

플러그인 인터페이스 확장:
```typescript
// src/plugins/NativeNavigation.ts
export interface NativeNavigationPlugin {
  // 새로운 메서드 추가
  setNavigationMode(options: { mode: 'walking' | 'running' | 'cycling' }): Promise<void>
}
```

## 🔍 트러블슈팅

### 1. 네이티브 네비게이션이 시작되지 않음
- **원인**: 플러그인 등록 누락
- **해결**: `MainActivity.java`에서 `registerPlugin(NativeNavigationPlugin.class)` 확인

### 2. 위치 권한 오류
- **원인**: GPS 권한 거부
- **해결**: `AndroidManifest.xml`에서 위치 권한 확인, 런타임 권한 요청

### 3. 웹-네이티브 통신 실패
- **원인**: 리스너 등록 실패
- **해결**: 네이티브 리스너 설정 순서 확인, 에러 로그 분석

### 4. 빌드 오류
- **원인**: 안드로이드 의존성 문제
- **해결**: `gradle clean`, Capacitor 재동기화 (`npx cap sync`)

## 📈 성능 최적화

### 1. 메모리 관리
- 위치 히스토리 크기 제한 (10개)
- 액티비티 종료 시 리소스 정리
- 리스너 적절한 해제

### 2. 배터리 최적화
- GPS 업데이트 주기 조정
- 화면 꺼짐 방지 최소화
- 백그라운드 처리 최적화

### 3. 네트워크 사용량
- 오프라인 지도 데이터 캐싱
- 필요시에만 서버 통신
- 데이터 압축 전송

## 🔮 향후 개발 계획

### Phase 1: 기능 확장
- [ ] 음성 안내 시스템 추가
- [ ] 오프라인 지도 지원
- [ ] 다양한 운동 모드 (걷기, 달리기, 자전거)

### Phase 2: iOS 지원
- [ ] iOS 네이티브 네비게이션 구현
- [ ] 크로스 플랫폼 코드 공유
- [ ] 플랫폼별 최적화

### Phase 3: 고급 기능
- [ ] AR 네비게이션
- [ ] 실시간 교통 정보
- [ ] 소셜 기능 (경로 공유)

## 📞 지원

문제가 발생하거나 기능 요청이 있으시면:
1. GitHub Issues에 등록
2. 로그 파일과 함께 상세한 설명 제공
3. 재현 가능한 단계 포함

---

**RunSpot 네이티브 네비게이션**으로 더욱 향상된 런닝 경험을 즐기세요! 🏃‍♂️🗺️
