-- 제휴 스팟 이미지 컬럼 추가
-- 생성일: 2024-11-12

-- spots 테이블에 이미지 관련 컬럼 추가
ALTER TABLE spots 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS thumbnail_image TEXT;

-- 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN spots.logo_url IS '스팟 로고 이미지 URL (Base64 또는 파일 경로)';
COMMENT ON COLUMN spots.images IS '스팟 전경사진 배열 (JSON 형태)';
COMMENT ON COLUMN spots.thumbnail_image IS '썸네일 이미지 URL';

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_spots_logo_url ON spots(logo_url) WHERE logo_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_spots_images ON spots USING GIN(images) WHERE images != '[]'::jsonb;
