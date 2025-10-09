# 🏃‍♂️ RunSpot Seoul

서울의 베스트 런닝 코스를 발견하고 공유하는 커뮤니티 플랫폼

## 📱 프로젝트 개요

RunSpot Seoul은 서울의 숨겨진 런닝 코스를 발견하고 공유할 수 있는 웹 애플리케이션입니다. GPS 실시간 추적, 코스 리뷰, 커뮤니티 기능을 제공하여 러너들에게 최적의 런닝 경험을 선사합니다.

## ✨ 주요 기능

- 🗺️ **인터랙티브 지도**: Kakao Maps 기반 서울 런닝 코스 탐색
- 📍 **GPS 실시간 추적**: 정확한 위치 추적과 런닝 통계
- 🎯 **코스 필터링**: 난이도, 거리, 지역별 맞춤 검색
- ⭐ **리뷰 시스템**: 코스 평점과 후기 공유
- 📊 **런닝 기록**: 개인 런닝 통계 및 히스토리
- 🌙 **다크 테마**: 세련된 네온 그린 디자인

## 🛠️ 기술 스택

### Frontend
- **Next.js 14** (App Router)
- **TypeScript 5+**
- **React 18+**
- **Tailwind CSS 3+**
- **Shadcn/ui**

### 지도 & GPS
- **Kakao Maps API**
- **Turf.js** (GPS 계산)
- **Geolocation API**

### 백엔드 & 데이터베이스
- **Supabase**
- **PostgreSQL + PostGIS**
- **Row Level Security (RLS)**

### 상태 관리
- **Zustand**

### 배포
- **Vercel**

## 🚀 시작하기

### 1. 저장소 클론
```bash
git clone https://github.com/SuperETF/runspot.git
cd runspot
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
cp .env.example .env.local
```

`.env.local` 파일에서 다음 값들을 설정하세요:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Kakao Maps API
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_map_api_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. 데이터베이스 설정

Supabase 프로젝트를 생성하고 `supabase/migrations/` 폴더의 SQL 파일들을 실행하세요:

1. `001_initial_schema.sql` - 기본 테이블 생성
2. `002_rls_policies.sql` - 보안 정책 설정
3. `003_sample_data.sql` - 샘플 데이터 (선택사항)

### 5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 📊 데이터베이스 구조

### 주요 테이블
- **courses**: 런닝 코스 정보
- **users**: 사용자 프로필
- **running_logs**: 런닝 기록
- **reviews**: 코스 리뷰
- **bookmarks**: 즐겨찾기

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: #00FF88 (네온 그린)
- **Background**: #000000 (검정)
- **Card**: #1a1a1a (다크 그레이)
- **Text**: #ffffff (흰색)

### 타이포그래피
- **한글**: Pretendard
- **숫자**: Roboto Mono

## 🗺️ API 키 발급

### Kakao Maps API
1. [Kakao Developers](https://developers.kakao.com/)에서 앱 생성
2. 플랫폼 설정에서 웹 도메인 등록
3. JavaScript 키를 `NEXT_PUBLIC_KAKAO_MAP_API_KEY`에 설정

### Supabase
1. [Supabase](https://supabase.com/)에서 프로젝트 생성
2. Settings > API에서 URL과 anon key 복사
3. 환경 변수에 설정

## 📱 PWA 지원

이 앱은 Progressive Web App으로 구성되어 있어 모바일 기기에 설치할 수 있습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

프로젝트 링크: [https://github.com/SuperETF/runspot](https://github.com/SuperETF/runspot)

---

**RunSpot Seoul**로 서울의 숨겨진 런닝 코스를 발견하고 건강한 러닝 라이프를 시작하세요! 🏃‍♀️🏃‍♂️
