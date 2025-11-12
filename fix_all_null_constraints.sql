-- 모든 NOT NULL 제약조건 문제 해결

-- 1. 현재 courses 테이블의 NOT NULL 컬럼들을 NULL 허용으로 변경
DO $$ 
BEGIN
    -- gps_route 컬럼 NULL 허용
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'gps_route' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE courses ALTER COLUMN gps_route DROP NOT NULL;
        ALTER TABLE courses ALTER COLUMN gps_route SET DEFAULT '[]'::jsonb;
    END IF;

    -- duration 컬럼 NULL 허용
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'duration' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE courses ALTER COLUMN duration DROP NOT NULL;
        ALTER TABLE courses ALTER COLUMN duration SET DEFAULT 0;
    END IF;

    -- 다른 가능한 NOT NULL 컬럼들도 처리
    -- description 컬럼 NULL 허용
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'description' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE courses ALTER COLUMN description DROP NOT NULL;
    END IF;

    -- difficulty 컬럼 NULL 허용 (기본값 유지)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'difficulty' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE courses ALTER COLUMN difficulty DROP NOT NULL;
        ALTER TABLE courses ALTER COLUMN difficulty SET DEFAULT 'medium';
    END IF;

    -- distance 컬럼 NULL 허용 (기본값 유지)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'distance' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE courses ALTER COLUMN distance DROP NOT NULL;
        ALTER TABLE courses ALTER COLUMN distance SET DEFAULT 0;
    END IF;

    -- estimated_time 컬럼 NULL 허용 (기본값 유지)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'estimated_time' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE courses ALTER COLUMN estimated_time DROP NOT NULL;
        ALTER TABLE courses ALTER COLUMN estimated_time SET DEFAULT 0;
    END IF;

END $$;

-- 2. 기존 NULL 데이터에 기본값 설정
UPDATE courses SET gps_route = '[]'::jsonb WHERE gps_route IS NULL;
UPDATE courses SET duration = 0 WHERE duration IS NULL;
UPDATE courses SET difficulty = 'medium' WHERE difficulty IS NULL;
UPDATE courses SET distance = 0 WHERE distance IS NULL;
UPDATE courses SET estimated_time = 0 WHERE estimated_time IS NULL;

-- 3. 필요한 컬럼이 없다면 추가
DO $$ 
BEGIN
    -- is_active 컬럼 추가 (없는 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- start_latitude 컬럼 추가 (없는 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'start_latitude'
    ) THEN
        ALTER TABLE courses ADD COLUMN start_latitude DECIMAL(10,8);
    END IF;

    -- start_longitude 컬럼 추가 (없는 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'start_longitude'
    ) THEN
        ALTER TABLE courses ADD COLUMN start_longitude DECIMAL(11,8);
    END IF;

    -- end_latitude 컬럼 추가 (없는 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'end_latitude'
    ) THEN
        ALTER TABLE courses ADD COLUMN end_latitude DECIMAL(10,8);
    END IF;

    -- end_longitude 컬럼 추가 (없는 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'end_longitude'
    ) THEN
        ALTER TABLE courses ADD COLUMN end_longitude DECIMAL(11,8);
    END IF;

    -- created_by 컬럼 추가 (없는 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE courses ADD COLUMN created_by UUID;
    END IF;

END $$;

-- 4. course_points 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS course_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    point_order INTEGER NOT NULL,
    point_type VARCHAR(20) CHECK (point_type IN ('start', 'checkpoint', 'turn', 'finish')) DEFAULT 'checkpoint',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses(difficulty);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_course_points_course_id ON course_points(course_id);
CREATE INDEX IF NOT EXISTS idx_course_points_order ON course_points(course_id, point_order);

-- 완료 메시지
SELECT 'courses 테이블 NOT NULL 제약조건 모두 해결 완료!' as message;
