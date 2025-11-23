-- 런닝 기록 테이블 생성
CREATE TABLE IF NOT EXISTS running_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- 런닝 기본 정보
  distance DECIMAL(8,3) NOT NULL, -- 실제 뛴 거리 (km)
  duration INTEGER NOT NULL, -- 소요 시간 (초)
  avg_speed DECIMAL(5,2) NOT NULL, -- 평균 속도 (km/h)
  calories INTEGER DEFAULT 0, -- 소모 칼로리
  
  -- 완주 정보
  is_completed BOOLEAN DEFAULT false, -- 완주 여부
  completion_rate DECIMAL(5,2) DEFAULT 0, -- 진행률 (%)
  
  -- GPS 경로 데이터
  gps_path JSONB, -- GPS 경로 포인트들 [{lat, lng, timestamp}, ...]
  
  -- 런닝 통계
  max_speed DECIMAL(5,2), -- 최고 속도 (km/h)
  min_pace DECIMAL(5,2), -- 최고 페이스 (분/km)
  avg_pace DECIMAL(5,2), -- 평균 페이스 (분/km)
  
  -- 코스 이탈 정보
  off_course_time INTEGER DEFAULT 0, -- 코스 이탈 시간 (초)
  off_course_distance DECIMAL(8,3) DEFAULT 0, -- 코스 이탈 거리 (km)
  
  -- 타임스탬프
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_running_logs_user_id ON running_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_running_logs_course_id ON running_logs(course_id);
CREATE INDEX IF NOT EXISTS idx_running_logs_completed_at ON running_logs(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_running_logs_user_completed ON running_logs(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_running_logs_is_completed ON running_logs(is_completed);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE running_logs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 런닝 기록만 조회 가능
CREATE POLICY "Users can view own running logs" ON running_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 런닝 기록만 생성 가능
CREATE POLICY "Users can insert own running logs" ON running_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 런닝 기록만 수정 가능
CREATE POLICY "Users can update own running logs" ON running_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 런닝 기록만 삭제 가능
CREATE POLICY "Users can delete own running logs" ON running_logs
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_running_logs_updated_at 
  BEFORE UPDATE ON running_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 런닝 통계 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW user_running_stats AS
SELECT 
  user_id,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE is_completed = true) as completed_runs,
  ROUND(
    (COUNT(*) FILTER (WHERE is_completed = true)::DECIMAL / COUNT(*)) * 100, 
    2
  ) as completion_rate,
  SUM(distance) as total_distance,
  SUM(duration) as total_duration,
  AVG(avg_speed) as avg_speed,
  SUM(calories) as total_calories,
  MAX(distance) as longest_run,
  MIN(duration) FILTER (WHERE is_completed = true) as best_time
FROM running_logs
GROUP BY user_id;

-- 코멘트 추가
COMMENT ON TABLE running_logs IS '사용자 런닝 기록 테이블';
COMMENT ON COLUMN running_logs.distance IS '실제 뛴 거리 (km)';
COMMENT ON COLUMN running_logs.duration IS '총 소요 시간 (초)';
COMMENT ON COLUMN running_logs.is_completed IS '코스 완주 여부';
COMMENT ON COLUMN running_logs.gps_path IS 'GPS 경로 데이터 JSON 배열';
COMMENT ON COLUMN running_logs.completion_rate IS '코스 진행률 (%)';
