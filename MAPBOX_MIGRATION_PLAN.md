# 🗺️ Mapbox Navigation 마이그레이션 계획

## 📋 현재 상황 분석

### 기존 카카오맵 구조
```
RunSpot Web (React) 
└── Capacitor 
    └── Android Native
        └── KakaoMap SDK (제한적 네비게이션)
```

### 새로운 Mapbox 구조
```
RunSpot Web (React)
└── Capacitor 
    └── Android Native
        └── Mapbox Navigation SDK (완전한 네비게이션)
```

## 🎯 마이그레이션 전략

### Phase 1: Mapbox 기본 통합 (1-2일)
1. **Mapbox SDK 추가**
   ```gradle
   implementation 'com.mapbox.navigation:android:2.17.0'
   implementation 'com.mapbox.navigation:ui-dropin:2.17.0'
   ```

2. **기본 지도 표시**
   - 카카오맵 대신 Mapbox 지도 렌더링
   - 현재 위치 표시
   - 기본 줌/팬 기능

3. **API 키 설정**
   - Mapbox 계정 생성 (무료)
   - Access Token 발급
   - 환경변수 설정

### Phase 2: GPX 경로 통합 (2-3일)
1. **GPX → Mapbox Route 변환**
   ```kotlin
   // GPX 파일을 Mapbox DirectionsRoute로 변환
   val route = DirectionsRoute.fromJson(gpxToGeoJson(gpxData))
   ```

2. **경로 표시**
   - RunSpot GPX 파일 로드
   - 지도에 경로 폴리라인 표시
   - 시작점/끝점 마커 표시

3. **기존 데이터 호환**
   - 기존 RunSpot 코스 데이터 활용
   - GPSCoordinate → LatLng 변환
   - 거리/시간 계산 유지

### Phase 3: 완전한 네비게이션 (3-4일)
1. **턴바이턴 네비게이션**
   ```kotlin
   // Mapbox Navigation 시작
   mapboxNavigation.startTripSession()
   mapboxNavigation.setRoutes(listOf(route))
   ```

2. **음성 안내**
   - 자동 음성 안내 (한국어 지원)
   - 거리별 안내 ("100m 후 우회전")
   - 커스텀 안내 메시지

3. **헤딩 업 모드**
   - 자동 헤딩 업 네비게이션
   - 부드러운 지도 회전
   - 3D 카메라 각도 조정

### Phase 4: RunSpot 특화 기능 (2-3일)
1. **런닝 특화 UI**
   - RunSpot 브랜딩 적용
   - 런닝 통계 오버레이
   - 진행률 표시

2. **코스 이탈 감지**
   - 실시간 경로 추적
   - 이탈 시 자동 경고
   - 경로 복귀 안내

3. **성능 최적화**
   - 배터리 최적화
   - GPS 정확도 향상
   - 오프라인 지도 지원

## 🛠️ 기술적 구현

### 1. Gradle 설정
```gradle
// android/app/build.gradle
dependencies {
    implementation 'com.mapbox.navigation:android:2.17.0'
    implementation 'com.mapbox.navigation:ui-dropin:2.17.0'
    implementation 'com.mapbox.maps:android:10.16.0'
}
```

### 2. AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

<meta-data
    android:name="MAPBOX_ACCESS_TOKEN"
    android:value="${MAPBOX_ACCESS_TOKEN}" />
```

### 3. 기본 네비게이션 Activity
```kotlin
class MapboxNavigationActivity : AppCompatActivity() {
    
    private lateinit var mapboxNavigation: MapboxNavigation
    private lateinit var mapView: MapView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Mapbox Navigation 초기화
        mapboxNavigation = MapboxNavigationProvider.create(
            NavigationOptions.Builder(this)
                .accessToken(getString(R.string.mapbox_access_token))
                .build()
        )
        
        // GPX 경로 로드 및 네비게이션 시작
        loadGpxRoute()
    }
    
    private fun loadGpxRoute() {
        // RunSpot GPX 데이터를 Mapbox Route로 변환
        val route = convertGpxToMapboxRoute(gpxData)
        
        // 네비게이션 시작
        mapboxNavigation.setRoutes(listOf(route))
        mapboxNavigation.startTripSession()
    }
}
```

### 4. GPX → Mapbox Route 변환
```kotlin
fun convertGpxToMapboxRoute(gpxPoints: List<GPSCoordinate>): DirectionsRoute {
    val coordinates = gpxPoints.map { 
        Point.fromLngLat(it.lng, it.lat) 
    }
    
    return DirectionsRoute.builder()
        .geometry(LineString.fromLngLats(coordinates))
        .distance(calculateTotalDistance(coordinates))
        .duration(estimateDuration(coordinates))
        .build()
}
```

## 💰 비용 분석

### Mapbox 요금제
- **무료 티어**: 월 50,000 MAU (Monthly Active Users)
- **RunSpot 예상 사용량**: 초기 < 1,000 MAU
- **결론**: 당분간 무료 사용 가능

### 카카오맵 vs Mapbox
| 기능 | 카카오맵 | Mapbox |
|------|----------|---------|
| 기본 지도 | 무료 | 무료 (50K MAU) |
| 네비게이션 | 제한적 | 완전 지원 |
| 커스터마이징 | 제한적 | 완전 자유 |
| 오픈소스 | ❌ | ✅ |
| 한국 최적화 | ✅ | ⚠️ (OSM 기반) |

## 🎯 권장 사항

### 즉시 시작 가능한 작업
1. **Mapbox 계정 생성** (5분)
2. **기본 예제 테스트** (30분)
3. **RunSpot GPX 데이터 연동 테스트** (1시간)

### 단계별 마이그레이션
1. **Week 1**: 기본 Mapbox 지도 + GPX 경로 표시
2. **Week 2**: 완전한 턴바이턴 네비게이션
3. **Week 3**: RunSpot UI 통합 + 최적화
4. **Week 4**: 테스트 + 배포

## 🔗 참고 자료

### Mapbox Navigation 예제들
- [Basic Navigation](https://github.com/mapbox/mapbox-navigation-android-examples/tree/main/app/src/main/java/com/mapbox/navigation/examples/core)
- [Custom UI](https://github.com/mapbox/mapbox-navigation-android-examples/tree/main/app/src/main/java/com/mapbox/navigation/examples/ui)
- [Voice Instructions](https://github.com/mapbox/mapbox-navigation-android-examples/blob/main/app/src/main/java/com/mapbox/navigation/examples/core/VoiceInstructionsActivity.kt)

### 문서
- [Mapbox Navigation SDK](https://docs.mapbox.com/android/navigation/guides/)
- [GPX to GeoJSON 변환](https://docs.mapbox.com/help/tutorials/gpx-to-geojson/)
- [Turn-by-turn Navigation](https://docs.mapbox.com/android/navigation/examples/turn-by-turn-navigation/)

## ✅ 결론

**Mapbox Navigation이 RunSpot에 더 적합한 솔루션입니다:**

1. **완전한 네비게이션**: 카카오맵보다 훨씬 강력
2. **무료 사용**: 초기 단계에서 비용 부담 없음
3. **오픈소스**: 완전한 커스터마이징 가능
4. **풍부한 예제**: 빠른 개발 가능
5. **GPX 호환**: 기존 RunSpot 데이터 활용

**추천**: 카카오맵에서 Mapbox로 마이그레이션 진행! 🚀
