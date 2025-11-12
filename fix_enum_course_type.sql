-- course_type ENUM 문제 해결

-- 1. 현재 course_type ENUM 값들 확인
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'course_type'
ORDER BY e.enumsortorder;

-- 2. course_type 컬럼 정보 확인
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'courses' AND column_name = 'course_type';

-- 3. course_type을 VARCHAR로 변경하거나 ENUM에 값 추가
DO $$ 
DECLARE
    enum_exists BOOLEAN;
    running_exists BOOLEAN;
BEGIN
    -- course_type ENUM이 존재하는지 확인
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'course_type'
    ) INTO enum_exists;
    
    IF enum_exists THEN
        -- 'running' 값이 ENUM에 있는지 확인
        SELECT EXISTS (
            SELECT 1 FROM pg_enum e 
            JOIN pg_type t ON e.enumtypid = t.oid 
            WHERE t.typname = 'course_type' AND e.enumlabel = 'running'
        ) INTO running_exists;
        
        IF NOT running_exists THEN
            -- 'running' 값을 ENUM에 추가
            ALTER TYPE course_type ADD VALUE 'running';
            RAISE NOTICE 'course_type ENUM에 running 값 추가됨';
        END IF;
        
        -- 기본값 설정
        ALTER TABLE courses ALTER COLUMN course_type SET DEFAULT 'running';
        
    ELSE
        -- ENUM이 없으면 VARCHAR로 변경
        ALTER TABLE courses ALTER COLUMN course_type TYPE VARCHAR(50);
        ALTER TABLE courses ALTER COLUMN course_type SET DEFAULT 'running';
        RAISE NOTICE 'course_type을 VARCHAR로 변경하고 기본값 설정';
    END IF;
    
    -- NOT NULL 제약조건 제거
    ALTER TABLE courses ALTER COLUMN course_type DROP NOT NULL;
    
END $$;

-- 4. 다른 NOT NULL 컬럼들 처리 (course_type 제외)
DO $$ 
DECLARE
    col_record RECORD;
BEGIN
    FOR col_record IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND is_nullable = 'NO' 
        AND column_name NOT IN ('id', 'created_at', 'course_type') -- course_type 제외
    LOOP
        EXECUTE format('ALTER TABLE courses ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
        
        -- 각 컬럼별 기본값 설정
        CASE col_record.column_name
            WHEN 'name' THEN
                EXECUTE 'ALTER TABLE courses ALTER COLUMN name SET DEFAULT ''Untitled Course''';
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
                NULL;
        END CASE;
        
        RAISE NOTICE '컬럼 % NOT NULL 제약조건 제거 완료', col_record.column_name;
    END LOOP;
END $$;

-- 5. 기존 NULL 데이터에 기본값 설정
UPDATE courses SET course_type = 'running' WHERE course_type IS NULL;
UPDATE courses SET difficulty = 'medium' WHERE difficulty IS NULL;
UPDATE courses SET distance = 0 WHERE distance IS NULL;
UPDATE courses SET duration = 0 WHERE duration IS NULL;
UPDATE courses SET estimated_time = 0 WHERE estimated_time IS NULL;
UPDATE courses SET gps_route = '[]'::jsonb WHERE gps_route IS NULL;
UPDATE courses SET is_active = true WHERE is_active IS NULL;
UPDATE courses SET description = '' WHERE description IS NULL;

-- 6. 최종 테이블 구조 확인
SELECT 
    column_name, 
    data_type,
    udt_name,
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;

-- 완료 메시지
SELECT 'course_type ENUM 문제 및 모든 NOT NULL 제약조건 해결 완료!' as message;
