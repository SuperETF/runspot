-- 위치 업데이트 주기 기본값 최적화 (30초 → 5초)
-- 실시간 친구 추적 성능 향상

-- 기존 사용자들의 location_update_interval을 5초로 업데이트
UPDATE user_location_settings 
SET location_update_interval = 5 
WHERE location_update_interval = 30;

-- 새로운 사용자를 위한 기본값 변경
ALTER TABLE user_location_settings 
ALTER COLUMN location_update_interval SET DEFAULT 5;

-- 변경사항 확인을 위한 코멘트 업데이트
COMMENT ON COLUMN user_location_settings.location_update_interval IS '위치 업데이트 주기 (초 단위) - 기본 5초로 실시간성 향상';
