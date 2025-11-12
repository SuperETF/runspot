-- course_type 및 모든 NOT NULL 제약조건 완전 해결

-- 1. 현재 courses 테이블의 모든 NOT NULL 컬럼 확인 및 수정
DO $$ 
DECLARE
    col_record RECORD;
BEGIN
    -- courses 테이블의 모든 NOT NULL 컬럼을 찾아서 NULL 허용으로 변경
    FOR col_record IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND is_nullable = 'NO' 
        AND column_name NOT IN ('id', 'created_at') -- 기본 키와 타임스탬프는 제외
    LOOP
        EXECUTE format('ALTER TABLE courses ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
        
        -- 각 컬럼별 기본값 설정
        CASE col_record.column_name
            WHEN 'name' THEN
                -- name은 필수이므로 NOT NULL 유지하되, 기본값 설정
                EXECUTE 'ALTER TABLE courses ALTER COLUMN name SET NOT NULL';
                EXECUTE 'ALTER TABLE courses ALTER COLUMN name SET DEFAULT ''Untitled Course''';
            WHEN 'course_type' THEN
                EXECUTE 'ALTER TABLE courses ALTER COLUMN course_type SET DEFAULT ''running''';
            WHEN 'difficulty' THEN
                EXECUTE 'ALTER TABLE courses ALTER COLUMN difficulty SET DEFAULT ''medium''';
            WHEN 'distance' THEN
                EXECUTE 'ALTER TABLE courses ALTER COLUMN distance SET DEFAULT 0';
            WHEN 'duration' THEN
                EXECUTE 'ALTER TABLE courses ALTER COLUMN duration SET DEFAULT 0';
            WHEN 'estimated_time' THEN
                EXECUTE 'ALTER TABLE courses ALTER COLUMN estimated_time SET DEFAULT 0';
            WHEN 'gps_route' THEN
                EXECUTE 'ALTER TABLE courses ALTER COLUMN gps_route SET DEFAULT ''[]''::jsonb';
            WHEN 'is_active' THEN
                EXECUTE 'ALTER TABLE courses ALTER COLUMN is_active SET DEFAULT true';
            ELSE
                -- 다른 컬럼들은 기본값 없이 NULL 허용
                NULL;
        END CASE;
        
        RAISE NOTICE '컬럼 % NOT NULL 제약조건 제거 완료', col_record.column_name;
    END LOOP;
END $$;

-- 2. 기존 NULL 데이터에 기본값 설정
UPDATE courses SET course_type = 'running' WHERE course_type IS NULL;
UPDATE courses SET difficulty = 'medium' WHERE difficulty IS NULL;
UPDATE courses SET distance = 0 WHERE distance IS NULL;
UPDATE courses SET duration = 0 WHERE duration IS NULL;
UPDATE courses SET estimated_time = 0 WHERE estimated_time IS NULL;
UPDATE courses SET gps_route = '[]'::jsonb WHERE gps_route IS NULL;
UPDATE courses SET is_active = true WHERE is_active IS NULL;
UPDATE courses SET description = '' WHERE description IS NULL;

-- 3. 필요한 컬럼이 없다면 추가
DO $$ 
BEGIN
    -- course_type 컬럼 추가 (없는 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'course_type'
    ) THEN
        ALTER TABLE courses ADD COLUMN course_type VARCHAR(50) DEFAULT 'running';
    END IF;

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

-- 5. 현재 테이블 구조 확인 (디버깅용)
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;

-- 완료 메시지
SELECT 'courses 테이블 모든 NOT NULL 제약조건 완전 해결!' as message;
