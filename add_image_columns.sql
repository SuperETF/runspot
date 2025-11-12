-- spots 테이블에 이미지 관련 컬럼 추가

-- 로고 URL 컬럼 추가 (텍스트 타입)
ALTER TABLE spots 
ADD COLUMN logo_url TEXT;

-- 이미지 배열 컬럼 추가 (JSON 타입)
ALTER TABLE spots 
ADD COLUMN images JSONB DEFAULT '[]'::jsonb;

-- 썸네일 이미지 컬럼 추가 (필요시)
ALTER TABLE spots 
ADD COLUMN thumbnail_image TEXT;

-- 컬럼 추가 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'spots' 
AND column_name IN ('logo_url', 'images', 'thumbnail_image');
