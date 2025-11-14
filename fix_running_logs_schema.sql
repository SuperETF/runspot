-- running_logs 테이블 구조 확인 및 수정
-- 2024-11-12

-- 1. 현재 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'running_logs' 
ORDER BY ordinal_position;

-- 2. 필요한 컬럼들 추가
ALTER TABLE running_logs 
ADD COLUMN IF NOT EXISTS pace NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS authentication_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 3. 기존 컬럼이 없다면 기본 구조 생성
-- (만약 테이블이 아예 없거나 구조가 다르다면)
CREATE TABLE IF NOT EXISTS running_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id),
    distance NUMERIC NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0, -- 초 단위
    pace NUMERIC DEFAULT 0, -- 분/km
    calories INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    gps_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    authentication_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_running_logs_user_id ON running_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_running_logs_completed_at ON running_logs(completed_at);
CREATE INDEX IF NOT EXISTS idx_running_logs_expires_at ON running_logs(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_running_logs_user_expires ON running_logs(user_id, expires_at) WHERE expires_at IS NOT NULL;

-- 5. 기존 데이터가 있다면 expires_at 설정
UPDATE running_logs 
SET expires_at = completed_at + INTERVAL '2 hours'
WHERE completed_at IS NOT NULL AND expires_at IS NULL;

-- 6. 테이블 구조 최종 확인
\d running_logs;
