-- gps_route 컬럼 NOT NULL 제약조건 해결

-- 방법 1: gps_route 컬럼을 NULL 허용으로 변경 (추천)
ALTER TABLE courses ALTER COLUMN gps_route DROP NOT NULL;

-- 방법 2: 기본값 설정
ALTER TABLE courses ALTER COLUMN gps_route SET DEFAULT '[]'::jsonb;

-- 기존 NULL 데이터에 기본값 설정
UPDATE courses SET gps_route = '[]'::jsonb WHERE gps_route IS NULL;

-- 완료 메시지
SELECT 'gps_route 컬럼 제약조건 수정 완료!' as message;
