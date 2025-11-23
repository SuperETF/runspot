# 📱 안드로이드 에뮬레이터 GPS 테스트 가이드

## 🗺️ 에뮬레이터에서 위치 시뮬레이션

### 방법 1: Extended Controls (가장 쉬운 방법)

1. **에뮬레이터 실행** 후 우측 패널에서 **"..."** (More) 버튼 클릭
2. **Location** 탭 선택
3. **Single points** 탭에서:
   - **Latitude**: `37.5665` (서울 시청)
   - **Longitude**: `126.9780`
   - **Send** 버튼 클릭

### 방법 2: GPX 파일로 경로 시뮬레이션

1. **Extended Controls → Location → Routes** 탭
2. **Load GPX/KML** 버튼 클릭
3. RunSpot GPX 파일 선택
4. **Play Route** 버튼으로 경로 따라 이동

### 방법 3: 실시간 위치 변경

1. **Extended Controls → Location → Single points**
2. 지도에서 클릭하여 위치 변경
3. **Send** 버튼으로 위치 전송
4. 런닝 중에 실시간으로 위치 변경 가능

## 🏃‍♂️ RunSpot 네비게이션 테스트 시나리오

### 1단계: 초기 위치 설정
```
위치: 서울 시청 (37.5665, 126.9780)
→ Extended Controls에서 설정
→ RunSpot 앱에서 현재 위치 확인
```

### 2단계: 코스 선택
```
→ RunSpot 앱 실행
→ 서울 근처 런닝 코스 선택
→ "런닝 시작" 버튼 클릭
```

### 3단계: 네이티브 네비게이션 실행
```
→ "전체화면 네비게이션" 버튼 클릭
→ 네이티브 네비게이션 액티비티 실행 확인
→ 카카오맵 로딩 확인
→ "네비게이션을 시작합니다" 음성 확인
```

### 4단계: 경로 따라 이동 테스트
```
→ Extended Controls에서 코스 경로를 따라 위치 변경
→ 턴바이턴 안내 메시지 확인
→ 음성 안내 확인
→ 실시간 거리/시간 업데이트 확인
```

### 5단계: 코스 이탈 테스트
```
→ 코스에서 50m 이상 벗어난 위치로 이동
→ "⚠️ 코스에서 벗어났습니다" 메시지 확인
→ 빨간색 경고 UI 확인
→ "코스에서 벗어났습니다" 음성 확인
```

## 🔧 문제 해결

### GPS 권한 문제
```
→ 에뮬레이터 Settings → Apps → RunSpot → Permissions
→ Location 권한 "Allow all the time" 설정
```

### 위치 서비스 비활성화
```
→ 에뮬레이터 Settings → Location
→ "Use location" 토글 ON
→ "Google Location Accuracy" ON
```

### 카카오맵 로딩 실패
```
→ 에뮬레이터 인터넷 연결 확인
→ Logcat에서 "NativeNavigation" 태그 필터링
→ API 키 오류 메시지 확인
```

## 📍 추천 테스트 위치들

### 서울 주요 지점
```
서울 시청: 37.5665, 126.9780
강남역: 37.4979, 127.0276
홍대입구: 37.5563, 126.9236
한강공원: 37.5326, 126.9690
```

### 테스트 경로 예시
```
시작: 서울 시청 (37.5665, 126.9780)
중간: 청계천 (37.5664, 126.9779)
도착: 동대문 (37.5663, 126.9778)
```

## 🎯 성공 확인 체크리스트

- [ ] 에뮬레이터에서 위치 설정 성공
- [ ] RunSpot 앱에서 현재 위치 표시
- [ ] 네이티브 네비게이션 액티비티 실행
- [ ] 전체화면 카카오맵 표시
- [ ] 턴바이턴 안내 메시지 표시
- [ ] 음성 안내 재생
- [ ] 실시간 위치 업데이트
- [ ] 코스 이탈 감지 및 경고
- [ ] 거리/시간 계산 정확성

## 🐛 디버깅 명령어

### Logcat 필터링
```bash
# 안드로이드 스튜디오 Terminal에서
adb logcat -s "NativeNavigation"
adb logcat | grep -E "(GPS|Location|TTS)"
```

### 위치 서비스 상태 확인
```bash
adb shell dumpsys location
```

### 앱 권한 확인
```bash
adb shell dumpsys package com.runspot.app | grep permission
```
