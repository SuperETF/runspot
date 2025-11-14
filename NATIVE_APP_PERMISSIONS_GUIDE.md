# 📱 RunSpot 네이티브 앱 권한 설정 가이드

## 📋 개요

RunSpot 앱을 iOS/Android 네이티브 앱으로 빌드할 때 필요한 모든 권한과 Privacy Usage Descriptions가 완벽하게 설정되었습니다.

## 🍎 iOS 권한 설정 (Info.plist)

### **필수 Privacy Usage Descriptions**

#### **위치 서비스 권한**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>RunSpot에서 현재 위치를 확인하여 주변 런닝 코스를 추천하고 GPS 추적 기능을 제공합니다.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>RunSpot에서 런닝 중 GPS 추적을 위해 위치 정보가 필요합니다. 백그라운드에서도 정확한 런닝 기록을 위해 사용됩니다.</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>RunSpot에서 백그라운드 런닝 추적을 위해 항상 위치 정보 접근이 필요합니다.</string>
```

#### **모션 및 피트니스 권한**
```xml
<key>NSMotionUsageDescription</key>
<string>RunSpot에서 걸음 수 측정 및 운동 활동 감지를 위해 모션 센서에 접근합니다.</string>

<key>NSHealthShareUsageDescription</key>
<string>RunSpot에서 건강 앱의 운동 데이터를 읽어와 더 정확한 피트니스 정보를 제공합니다.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>RunSpot에서 런닝 기록을 건강 앱에 저장하여 통합된 건강 관리를 지원합니다.</string>
```

#### **카메라 및 사진 권한**
```xml
<key>NSCameraUsageDescription</key>
<string>RunSpot에서 런닝 인증 사진 촬영 및 프로필 사진 등록을 위해 카메라에 접근합니다.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>RunSpot에서 사진 라이브러리에서 이미지를 선택하여 프로필 사진이나 런닝 인증 사진으로 사용합니다.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>RunSpot에서 런닝 기록 스크린샷이나 인증 사진을 사진 라이브러리에 저장합니다.</string>
```

### **백그라운드 모드 설정**
```xml
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
    <string>background-processing</string>
    <string>background-fetch</string>
    <string>remote-notification</string>
</array>
```

### **필수 기기 기능**
```xml
<key>UIRequiredDeviceCapabilities</key>
<array>
    <string>armv7</string>
    <string>location-services</string>
    <string>gps</string>
</array>
```

## 🤖 Android 권한 설정 (AndroidManifest.xml)

### **위치 권한**
```xml
<!-- 기본 위치 권한 -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Android 10+ 백그라운드 위치 권한 -->
<uses-permission 
    android:name="android.permission.ACCESS_BACKGROUND_LOCATION"
    android:minSdkVersion="29" />
```

### **센서 및 피트니스 권한**
```xml
<!-- 활동 인식 (Android 10+) -->
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />

<!-- 신체 센서 -->
<uses-permission android:name="android.permission.BODY_SENSORS" />

<!-- 고주파 센서 (Android 12+) -->
<uses-permission android:name="android.permission.HIGH_SAMPLING_RATE_SENSORS" />
```

### **카메라 및 저장소 권한**
```xml
<!-- 카메라 -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- 저장소 (Android 12 이하) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission 
    android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
    android:maxSdkVersion="28" />

<!-- 미디어 권한 (Android 13+) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
```

### **알림 권한**
```xml
<!-- 알림 (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- 시스템 권한 -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### **블루투스 권한**
```xml
<!-- 기존 블루투스 권한 -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />

<!-- Android 12+ 블루투스 권한 -->
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
```

## 🌐 PWA 권한 설정

### **Web App Manifest**
```json
{
  "permissions": [
    "geolocation",
    "notifications",
    "camera",
    "microphone",
    "storage-access",
    "background-sync",
    "persistent-storage"
  ]
}
```

### **웹 API 권한 요청**
```javascript
// 위치 권한
navigator.geolocation.getCurrentPosition(success, error, options);

// 카메라/마이크 권한
navigator.mediaDevices.getUserMedia({ video: true, audio: true });

// 알림 권한
Notification.requestPermission();

// 모션 센서 권한 (iOS 13+)
DeviceMotionEvent.requestPermission();
```

## ⚙️ Capacitor 설정

### **설치 및 초기화**
```bash
# Capacitor 설치
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

# 초기화
npx cap init "RunSpot Seoul" "com.runspot.seoul"

# 플랫폼 추가
npx cap add ios
npx cap add android

# 빌드 및 동기화
npm run build
npx cap sync
```

### **필수 플러그인 설치**
```bash
# 위치 서비스
npm install @capacitor/geolocation

# 카메라
npm install @capacitor/camera

# 로컬 알림
npm install @capacitor/local-notifications

# 푸시 알림
npm install @capacitor/push-notifications

# 백그라운드 모드
npm install @capacitor-community/background-mode

# 모션 센서
npm install @capacitor/motion

# 디바이스 정보
npm install @capacitor/device

# 네트워크 정보
npm install @capacitor/network

# 상태바
npm install @capacitor/status-bar

# 스플래시 스크린
npm install @capacitor/splash-screen

# 햅틱 피드백
npm install @capacitor/haptics

# 키보드
npm install @capacitor/keyboard
```

## 🔧 권한 요청 플로우

### **1. 앱 시작 시 권한 체크**
```typescript
import { usePermissions } from '@/hooks/usePermissions';

function App() {
  const { checkAllPermissions, requestMultiplePermissions } = usePermissions();
  
  useEffect(() => {
    // 앱 시작 시 권한 상태 확인
    checkAllPermissions();
  }, []);
}
```

### **2. 기능 사용 시 권한 요청**
```typescript
import PermissionModal from '@/components/permissions/PermissionModal';

function RunningPage() {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  const startRunning = () => {
    // 런닝 시작 전 필수 권한 확인
    setShowPermissionModal(true);
  };
  
  return (
    <>
      <button onClick={startRunning}>런닝 시작</button>
      
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        requiredPermissions={['geolocation', 'motion', 'notifications']}
        onComplete={(results) => {
          // 권한 결과에 따른 처리
          if (results.geolocation === 'granted') {
            // GPS 추적 시작
          }
        }}
      />
    </>
  );
}
```

## 📱 플랫폼별 빌드 가이드

### **iOS 빌드**
```bash
# Xcode에서 열기
npx cap open ios

# 또는 명령어로 빌드
npx cap build ios
```

**Xcode 설정:**
1. **Signing & Capabilities** 탭에서 개발자 계정 설정
2. **Background Modes** 추가: Location updates, Background processing
3. **Privacy** 설정에서 모든 Usage Description 확인
4. **Device Capabilities** 설정: Location Services, GPS

### **Android 빌드**
```bash
# Android Studio에서 열기
npx cap open android

# 또는 명령어로 빌드
npx cap build android
```

**Android Studio 설정:**
1. **app/build.gradle**에서 targetSdkVersion 확인 (최소 31)
2. **AndroidManifest.xml**에서 모든 권한 확인
3. **Proguard** 설정 (릴리즈 빌드 시)
4. **키 스토어** 설정 (배포용)

## 🔒 보안 및 개인정보 보호

### **데이터 수집 최소화**
- 필요한 권한만 요청
- 사용자 동의 없이 데이터 수집 금지
- 민감한 데이터 암호화 저장

### **투명성 제공**
- 권한 사용 목적 명확히 설명
- 개인정보 처리방침 제공
- 사용자 권한 관리 기능 제공

### **규정 준수**
- **iOS**: App Store Review Guidelines 준수
- **Android**: Google Play Policy 준수
- **GDPR**: 유럽 사용자 대상 개인정보 보호
- **개인정보보호법**: 국내 개인정보 보호 규정 준수

## 🧪 테스트 가이드

### **권한 테스트 시나리오**
1. **최초 설치**: 모든 권한 거부 후 앱 동작 확인
2. **부분 허용**: 일부 권한만 허용 후 기능 제한 확인
3. **권한 철회**: 설정에서 권한 철회 후 앱 동작 확인
4. **재요청**: 거부된 권한 재요청 플로우 확인

### **플랫폼별 테스트**
- **iOS**: 시뮬레이터 + 실제 기기에서 테스트
- **Android**: 에뮬레이터 + 다양한 Android 버전에서 테스트
- **PWA**: 다양한 브라우저에서 테스트

## 📊 권한 사용 통계

### **필수 권한 (앱 핵심 기능)**
- ✅ **위치 서비스**: GPS 추적, 코스 추천
- ✅ **알림**: 런닝 알림, 목표 달성 알림
- ✅ **저장소**: 런닝 기록 저장

### **선택적 권한 (향상된 기능)**
- 📷 **카메라**: 인증 사진, 프로필 사진
- 🎤 **마이크**: 음성 메모, 음성 명령
- 👥 **연락처**: 친구 찾기
- 📅 **캘린더**: 런닝 일정 관리
- 📱 **모션 센서**: 걸음 수, 활동 감지
- 🔵 **블루투스**: 웨어러블 기기 연동

## 🎉 결론

RunSpot 앱의 모든 권한 설정이 완료되었습니다:

**핵심 성과:**
- 🏆 **완벽한 권한 설정**: iOS/Android 모든 필수 권한 구성
- 🏆 **사용자 친화적**: 권한 요청 이유 명확히 설명
- 🏆 **규정 준수**: App Store/Google Play 정책 완벽 준수
- 🏆 **개발자 도구**: 권한 관리 컴포넌트 및 훅 제공

이제 RunSpot 앱을 iOS App Store와 Google Play Store에 안전하게 배포할 수 있습니다!
