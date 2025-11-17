-- CHECK 제약조건 제거

-- 1. 현재 courses 테이블의 모든 CHECK 제약조건 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'courses'::regclass 
AND contype = 'c';

-- 2. duration 관련 CHECK 제약조건 제거
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    -- courses 테이블의 모든 CHECK 제약조건을 찾아서 제거
    FOR constraint_record IN 
        SELECT conname AS constraint_name
        FROM pg_constraint 
        WHERE conrelid = 'courses'::regclass 
        AND contype = 'c'
        AND conname LIKE '%duration%'
    LOOP
        EXECUTE format('ALTER TABLE courses DROP CONSTRAINT %I', constraint_record.constraint_name);
        RAISE NOTICE 'CHECK 제약조건 % 제거됨', constraint_record.constraint_name;
    END LOOP;
    
    -- 다른 CHECK 제약조건들도 제거 (필요한 경우)
    FOR constraint_record IN 
        SELECT conname AS constraint_name
        FROM pg_constraint 
        WHERE conrelid = 'courses'::regclass 
        AND contype = 'c'
        AND conname NOT LIKE '%difficulty%' -- difficulty는 유지
    LOOP
        EXECUTE format('ALTER TABLE courses DROP CONSTRAINT %I', constraint_record.constraint_name);
        RAISE NOTICE 'CHECK 제약조건 % 제거됨', constraint_record.constraint_name;
    END LOOP;
END $$;

-- 3. duration 컬럼 설정 재조정
ALTER TABLE courses ALTER COLUMN duration DROP NOT NULL;
ALTER TABLE courses ALTER COLUMN duration SET DEFAULT 0;

-- 4. 기존 데이터 정리
UPDATE courses SET duration = 0 WHERE duration IS NULL OR duration < 0;

-- 5. 다른 컬럼들도 안전하게 설정
UPDATE courses SET distance = 0 WHERE distance IS NULL OR distance < 0;
UPDATE courses SET estimated_time = 0 WHERE estimated_time IS NULL OR estimated_time < 0;

-- 6. 최종 CHECK 제약조건 상태 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'courses'::regclass 
AND contype = 'c';

-- 완료 메시지
SELECT 'CHECK 제약조건 제거 완료!' as message;
