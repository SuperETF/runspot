-- 런닝 인증 시스템을 위한 필드 추가
-- 생성일: 2024-11-12

-- running_logs 테이블에 인증 관련 필드 추가
ALTER TABLE running_logs 
ADD COLUMN IF NOT EXISTS authentication_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- spot_coupons 테이블에 running_log_id 필드 추가
ALTER TABLE spot_coupons 
ADD COLUMN IF NOT EXISTS running_log_id UUID REFERENCES running_logs(id);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_running_logs_expires_at ON running_logs(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_running_logs_user_expires ON running_logs(user_id, expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_spot_coupons_running_log ON spot_coupons(running_log_id) WHERE running_log_id IS NOT NULL;

-- 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN running_logs.authentication_count IS '해당 완주로 인증한 제휴 스팟 수 (0~2)';
COMMENT ON COLUMN running_logs.expires_at IS '제휴 스팟 인증 만료 시간 (완주 시간 + 2시간)';
COMMENT ON COLUMN spot_coupons.running_log_id IS '쿠폰 발급의 기반이 된 완주 기록 ID';

-- 기존 완주 기록들의 expires_at 설정 (완주 시간 + 2시간)
UPDATE running_logs 
SET expires_at = completed_at + INTERVAL '2 hours'
WHERE completed_at IS NOT NULL AND expires_at IS NULL;
