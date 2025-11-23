-- 기존 running_logs 테이블에 완주 관련 필드 추가 (없는 경우에만)

-- 완주 여부 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'running_logs' AND column_name = 'is_completed') THEN
        ALTER TABLE running_logs ADD COLUMN is_completed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 진행률 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'running_logs' AND column_name = 'completion_rate') THEN
        ALTER TABLE running_logs ADD COLUMN completion_rate DECIMAL(5,2) DEFAULT 0;
    END IF;
END $$;

-- 코스 이탈 시간 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'running_logs' AND column_name = 'off_course_time') THEN
        ALTER TABLE running_logs ADD COLUMN off_course_time INTEGER DEFAULT 0;
    END IF;
END $$;

-- 코스 이탈 거리 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'running_logs' AND column_name = 'off_course_distance') THEN
        ALTER TABLE running_logs ADD COLUMN off_course_distance DECIMAL(8,3) DEFAULT 0;
    END IF;
END $$;

-- 완주 여부 인덱스 추가 (없는 경우에만)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'running_logs' AND indexname = 'idx_running_logs_is_completed') THEN
        CREATE INDEX idx_running_logs_is_completed ON running_logs(is_completed);
    END IF;
END $$;

-- 기존 데이터의 완주 여부 업데이트 (선택사항)
-- 진행률이 90% 이상이면 완주로 간주
UPDATE running_logs 
SET is_completed = true, 
    completion_rate = CASE 
        WHEN completion_rate = 0 THEN 100 -- 기존 데이터는 100%로 가정
        ELSE completion_rate 
    END
WHERE completion_rate >= 90 OR completion_rate = 0;

COMMENT ON COLUMN running_logs.is_completed IS '코스 완주 여부';
COMMENT ON COLUMN running_logs.completion_rate IS '코스 진행률 (%)';
COMMENT ON COLUMN running_logs.off_course_time IS '코스 이탈 시간 (초)';
COMMENT ON COLUMN running_logs.off_course_distance IS '코스 이탈 거리 (km)';
