# RunSpot 앱 – 기술·환경 최종 정리 (AI용 스펙 요약)

다른 AI가 이 프로젝트를 바로 이해하고 이어서 개발할 수 있도록, 현재 코드베이스 기준으로 정리했습니다.

---

## 1. 전체 개요

- **프로젝트 이름**: `RunSpot Seoul`
- **역할**: 서울 런닝 코스 탐색/기록/커뮤니티용 웹 애플리케이션  
- **형태**: SPA + SSR/ISR를 지원하는 **Next.js App Router** 기반 웹 앱  
- **플랫폼**: 웹/PWA (모바일 설치 가능)

---

## 2. 실행 환경

- **런타임**: Node.js (Next.js 15 기준으로 LTS Node 18+ 권장)
- **패키지 매니저**: `npm`  
  - 주요 스크립트
    - `npm run dev` → 개발 서버 (`next dev --turbopack`)
    - `npm run build` → 프로덕션 빌드 (`next build --turbopack`)
    - `npm run start` → 빌드 후 서버 실행
    - `npm run lint` → ESLint 실행
- **배포 타깃**: Vercel (README 기준)

---

## 3. 주요 기술 스택

### 3.1 프론트엔드

- **Framework**
  - `next`: **15.5.4**
  - `react`: **19.1.0**
  - `react-dom`: **19.1.0**
- **언어**
  - **TypeScript** (`typescript ^5`, `tsconfig.json` 존재)
- **스타일/디자인**
  - **Tailwind CSS v4** (`tailwindcss ^4`, `@tailwindcss/postcss`, `globals.css`)
  - **Shadcn/ui 스타일 구성**  
  - **Radix UI**:
    - `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, …
  - 아이콘: `lucide-react`
- **폼 & 검증**
  - `react-hook-form`
  - `@hookform/resolvers`
  - `zod`
- **상태 관리**
  - `zustand` (예: `src/stores/authStore.ts`, `courseStore.ts`, `runningStore.ts`)

### 3.2 지도 & 위치

- **지도**
  - `react-kakao-maps-sdk`
  - Kakao Maps JavaScript API  
- **위치/거리 계산**
  - `@turf/turf` (거리, 경로, GPS 관련 공간 연산)
  - 브라우저 **Geolocation API** 사용

### 3.3 백엔드 & 데이터베이스

- **API 계층**
  - Next.js App Router 기반 서버 컴포넌트/Route Handlers (추정, `src/app` 구조)
- **BaaS & DB**
  - `@supabase/supabase-js` v2
  - **Supabase** → **PostgreSQL + PostGIS**
  - RLS(행 단위 보안) 사용 (`fix_rls_policies.sql`, `supabase/migrations` 등)
- **Supabase 클라이언트**
  - `src/lib/supabase.ts`
    - `createClient<Database>(supabaseUrl, supabaseAnonKey)`
    - `Database` 타입은 `src/types/database.ts`에서 정의
    - 헬퍼:
      - `getCurrentUser()` – 개발 모드에서 로그인 없으면 더미 유저 반환
      - `isAuthenticated()` – 인증 여부 boolean

---

## 4. 환경 변수 / 설정

### 4.1 환경 변수 (.env / .env.local)

`.env.example` 기준:

- **Supabase**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (서버 사이드 용)
- **Kakao Maps**
  - `NEXT_PUBLIC_KAKAO_MAP_API_KEY`
- **사이트 설정**
  - `NEXT_PUBLIC_SITE_URL` (예: `http://localhost:3000`)
- **옵션**
  - `NEXT_PUBLIC_GA_ID` (Google Analytics, 선택)

### 4.2 Next.js 설정 (`next.config.ts`)

- **TypeScript/ESLint**
  - `eslint.ignoreDuringBuilds: true` (빌드 시 lint 에러 무시)
  - `typescript.ignoreBuildErrors: true` (빌드 시 TS 에러 무시)
- **이미지**
  - `images.domains = ['example.com']`
  - `images.unoptimized = true`
- **env 포워딩**
  - `NEXT_PUBLIC_KAKAO_MAP_API_KEY`를 런타임 env로 전달
- **보안 헤더**
  - `Content-Security-Policy`에서 `script-src`를 Kakao 도메인 포함하여 허용

---

## 5. TypeScript 설정 (`tsconfig.json`)

- `target`: `ES2017`
- `lib`: `dom`, `dom.iterable`, `esnext`
- `module`: `esnext`
- `moduleResolution`: `bundler`
- `jsx`: `preserve`
- `strict`: `false` (느슨한 TS 설정, `noImplicitAny: false`)
- `paths`:
  - `@/*` → `./src/*` (절대 경로 import 지원)
- `include`: `.ts`, `.tsx`, `.next/types/**/*.ts`
- `exclude`: `node_modules`

---

## 6. 디렉터리 구조(핵심만)

루트:

- `src/app`
  - `layout.tsx` – App Router 레이아웃
  - `page.tsx` – 메인 페이지(코스 지도/목록 등)
  - `globals.css`, `globals_old.css`
- `src/lib`
  - `supabase.ts` – Supabase 초기화 & auth 유틸
  - `courses.ts`, `runningLogs.ts`, `runningStats.ts`, `spots.ts`, `profile.ts` 등
- `src/stores`
  - `authStore.ts`, `courseStore.ts`, `runningStore.ts`
- `src/types`
  - `database.ts` – Supabase DB 타입
  - `kakao.d.ts` – Kakao Maps 타입 선언
- `src/utils`
  - `mapUtils.ts` – 지도/경로 유틸
- `supabase/migrations`
  - `001_initial_schema.sql` – 기본 테이블
  - `002_add_spot_images.sql` 등 추가 마이그레이션
- 루트 SQL 스크립트들
  - `fix_*`, `supabase_course_tables.sql`, etc. – 테이블 스키마/제약조건/enum 수정

---

## 7. 도메인 / 데이터 모델 (요약)

주요 테이블 (README & SQL 기준):

- **users** – 사용자 프로필
- **courses** – 런닝 코스 기본 정보 (코스 이름, 거리, 경로, 난이도, 지역, 이미지 등)
- **running_logs** – 개인 런닝 기록 (코스, 시간, 거리, pace, gps 경로 등)
- **reviews** – 코스 리뷰/평점
- **bookmarks** – 코스 즐겨찾기
- (확장) **spots / spot_coupons / spot_coupon_history** – 제휴 스팟/쿠폰 시스템용 테이블

---

## 8. 주요 기능 (기능 관점)

- **코스 탐색**
  - Kakao 지도에서 코스 위치/경로 시각화
  - 난이도, 거리, 지역 필터
- **GPS 추적**
  - 실시간 위치 추적과 경로 기록
  - Turf.js로 거리/속도 등 계산
- **러닝 기록**
  - 개인 `running_logs` 저장
  - 통계/히스토리 조회
- **리뷰 & 북마크**
  - 코스 리뷰 및 평점
  - 즐겨찾기 관리
- **PWA**
  - 모바일 홈 화면 설치 지원

---

## 9. 개발 플로우 요약 (AI가 이어받을 때 가이드)

- **로컬 환경 세팅**
  1. 레포 클론
  2. `npm install`
  3. `.env.example` → `.env.local` 복사 후 값 채우기
  4. Supabase 프로젝트 생성 후 `supabase/migrations/*.sql` 실행
  5. `npm run dev`로 `http://localhost:3000` 접속
- **코드 작성 기준**
  - `src/app` 구조 (Next.js App Router)
  - TypeScript + React 19
  - 스타일은 Tailwind + Radix + shadcn 스타일 패턴
  - 상태는 `zustand` 스토어 사용
  - 데이터 접근은 `src/lib/*`에서 Supabase 클라이언트 래핑

---

## 10. 다른 AI를 위한 한 줄 요약

> **“Next.js 15 + React 19 + TypeScript 기반, Supabase(PostgreSQL+PostGIS)를 백엔드로 쓰고 Kakao Maps & Turf.js로 GPS/코스 기능을 구현한 서울 런닝 코스 PWA 웹앱”** 이라고 이해하면 됩니다.
