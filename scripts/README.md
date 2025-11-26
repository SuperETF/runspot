# 스팟 좌표 업데이트 가이드

## 문제 상황
기존에 등록된 스팟들이 좌표 정보(latitude, longitude)가 없어서 거리 계산이 안 되는 상황

## 해결 방법

### 방법 1: 브라우저에서 직접 실행 (추천)

1. `scripts/update-coordinates.html` 파일을 텍스트 에디터로 열기

2. 다음 정보를 수정:
   ```html
   <!-- 7번 라인 -->
   <script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_MAP_API_KEY&libraries=services"></script>
   
   <!-- 46-47번 라인 -->
   const supabaseUrl = 'YOUR_SUPABASE_URL'
   const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
   ```

3. 수정한 HTML 파일을 브라우저에서 열기

4. "좌표 업데이트 시작" 버튼 클릭

5. 진행 상황을 로그에서 확인

### 방법 2: 브라우저 콘솔에서 실행

1. RunSpot 앱 페이지 열기 (카카오맵 SDK가 로드된 페이지)

2. 브라우저 개발자 도구 열기 (F12)

3. Console 탭에서 다음 코드 실행:

```javascript
async function updateSpotCoordinates() {
  const { createClient } = window.supabase
  const supabase = createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_SUPABASE_ANON_KEY'
  )

  // 좌표가 없는 스팟들 조회
  const { data: spots } = await supabase
    .from('spots')
    .select('id, name, address')
    .or('latitude.is.null,longitude.is.null,latitude.eq.0,longitude.eq.0')

  console.log(`📍 좌표가 없는 스팟 ${spots.length}개 발견`)

  for (const spot of spots) {
    if (!spot.address) continue

    // 카카오맵 API로 좌표 변환
    const geocoder = new kakao.maps.services.Geocoder()
    
    await new Promise((resolve) => {
      geocoder.addressSearch(spot.address, async (result, status) => {
        if (status === kakao.maps.services.Status.OK && result.length > 0) {
          const lat = parseFloat(result[0].y)
          const lng = parseFloat(result[0].x)
          
          // DB 업데이트
          await supabase
            .from('spots')
            .update({ latitude: lat, longitude: lng })
            .eq('id', spot.id)
          
          console.log(`✅ ${spot.name}: ${lat}, ${lng}`)
        } else {
          console.warn(`⚠️ ${spot.name}: 좌표 변환 실패`)
        }
        resolve()
      })
    })

    // API 호출 제한 대응
    await new Promise(r => setTimeout(r, 500))
  }

  console.log('🎉 업데이트 완료!')
}

// 실행
updateSpotCoordinates()
```

### 방법 3: Admin 페이지에서 수동 업데이트

1. `/admin` 페이지 접속
2. 각 스팟 편집
3. 주소 검색으로 다시 선택하여 좌표 자동 입력
4. 저장

## 향후 대응

새로운 스팟 등록 시:
- Admin 페이지의 주소 검색 기능 사용 필수
- 좌표가 없으면 등록 불가 (이미 구현됨)
- 주소 입력 시 자동으로 좌표 획득 (이미 구현됨)

## 참고

- 카카오맵 API 키: `.env` 파일의 `NEXT_PUBLIC_KAKAO_MAP_API_KEY`
- Supabase URL/Key: `.env` 파일 참조
- 좌표 형식: WGS84 (위도, 경도)
