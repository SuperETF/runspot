# 카카오톡 공유 기능 설정 가이드

## 🎯 개요
RunSpot 앱에서 카카오톡 공유 기능을 사용하기 위한 설정 가이드입니다.

## 📋 필요한 작업

### 1. 카카오 개발자 계정 생성
1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 카카오 계정으로 로그인
3. 개발자 등록 (휴대폰 인증 필요)

### 2. 애플리케이션 생성
1. **내 애플리케이션** > **애플리케이션 추가하기** 클릭
2. 앱 정보 입력:
   - **앱 이름**: RunSpot
   - **사업자명**: (개인/회사명)
   - **카테고리**: 라이프스타일 > 스포츠/건강

### 3. 플랫폼 설정
1. **앱 설정** > **플랫폼** 메뉴
2. **Web 플랫폼 등록** 클릭
3. 사이트 도메인 추가:
   ```
   http://localhost:3000
   https://localhost:3000
   https://your-domain.com (배포 시)
   ```

### 4. JavaScript 키 발급
1. **앱 설정** > **앱 키** 메뉴
2. **JavaScript 키** 복사
   ```
   예시: 1234567890abcdef1234567890abcdef
   ```

### 5. 환경변수 설정
1. 프로젝트 루트에 `.env` 파일 생성 (또는 기존 파일 수정)
2. 다음 내용 추가:
   ```bash
   # 기존 환경변수들...
   
   # Kakao JavaScript SDK (for sharing)
   NEXT_PUBLIC_KAKAO_JS_KEY=여기에_JavaScript_키_입력
   ```

### 6. 카카오 로그인 설정 (선택사항)
1. **제품 설정** > **카카오 로그인** 메뉴
2. **활성화 설정** ON
3. **Redirect URI** 등록:
   ```
   http://localhost:3000/auth/callback
   https://your-domain.com/auth/callback
   ```

## 🚀 테스트 방법

### 1. 개발 서버 실행
```bash
npm run dev
```

### 2. 공유 기능 테스트
1. 런닝 코스 페이지 접속
2. 헤더의 노란색 카카오톡 버튼 클릭
3. 카카오톡 공유창이 열리는지 확인

### 3. 디버깅
브라우저 개발자 도구 콘솔에서 다음 메시지 확인:
```
✅ Kakao JS SDK 로드 완료 (공유 기능)
✅ Kakao JS SDK 초기화 완료
🔑 Kakao SDK 초기화: 1234567890...
✅ 카카오톡 공유 성공
```

## ⚠️ 문제 해결

### "카카오톡 공유 기능을 준비 중입니다"
- **원인**: JavaScript 키가 설정되지 않음
- **해결**: `.env` 파일에 `NEXT_PUBLIC_KAKAO_JS_KEY` 추가

### "도메인이 등록되지 않았습니다"
- **원인**: 카카오 개발자 콘솔에 도메인 미등록
- **해결**: 플랫폼 설정에서 현재 도메인 추가

### "앱 키가 유효하지 않습니다"
- **원인**: 잘못된 JavaScript 키
- **해결**: 카카오 개발자 콘솔에서 올바른 키 확인

### 공유창이 열리지 않음
- **원인**: 팝업 차단 또는 HTTPS 필요
- **해결**: 팝업 허용 또는 HTTPS 환경에서 테스트

## 📱 배포 시 주의사항

### 1. 도메인 추가
배포 도메인을 카카오 개발자 콘솔에 추가:
```
https://your-app.vercel.app
https://your-domain.com
```

### 2. 환경변수 설정
배포 플랫폼(Vercel, Netlify 등)에 환경변수 추가:
```
NEXT_PUBLIC_KAKAO_JS_KEY=your_javascript_key
```

### 3. HTTPS 필수
카카오톡 공유는 HTTPS 환경에서만 정상 작동합니다.

## 🔗 참고 링크
- [카카오 개발자 콘솔](https://developers.kakao.com/)
- [카카오 JavaScript SDK 가이드](https://developers.kakao.com/docs/latest/ko/javascript/getting-started)
- [카카오톡 공유 API 문서](https://developers.kakao.com/docs/latest/ko/message/js-link)
