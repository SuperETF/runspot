-- RunSpot 코스 테이블 구조 수정 및 안전한 업데이트

-- 1. 기존 테이블 구조 확인
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'courses';

-- 2. 누락된 컬럼들을 안전하게 추가
DO $$ 
BEGIN
    -- is_active 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- difficulty 컬럼 추가 (없는 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'difficulty'
    ) THEN
        ALTER TABLE courses ADD COLUMN difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium';
    END IF;

    -- distance 컬럼 추가 (없는 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'distance'
    ) THEN
        ALTER TABLE courses ADD COLUMN distance DECIMAL(8,2) DEFAULT 0;
    END IF;

    -- estimated_time 컬럼 추가 (없는 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'estimated_time'
    ) THEN
        ALTER TABLE courses ADD COLUMN estimated_time INTEGER DEFAULT 0;
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

    -- updated_at 컬럼 추가 (없는 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE courses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

END $$;

-- 3. course_points 테이블 생성 (없는 경우)
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

-- 4. 인덱스 생성 (없는 경우에만)
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses(difficulty);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_course_points_course_id ON course_points(course_id);
CREATE INDEX IF NOT EXISTS idx_course_points_order ON course_points(course_id, point_order);

-- 5. RLS 정책 설정 (기존 정책이 있으면 무시)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_points ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Anyone can view active courses" ON courses;
DROP POLICY IF EXISTS "Authenticated users can create courses" ON courses;
DROP POLICY IF EXISTS "Users can update own courses" ON courses;
DROP POLICY IF EXISTS "Users can delete own courses" ON courses;
DROP POLICY IF EXISTS "Anyone can view course points" ON course_points;
DROP POLICY IF EXISTS "Course owners can create points" ON course_points;
DROP POLICY IF EXISTS "Course owners can update points" ON course_points;
DROP POLICY IF EXISTS "Course owners can delete points" ON course_points;

-- 새 정책 생성
CREATE POLICY "Anyone can view active courses" ON courses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create courses" ON courses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own courses" ON courses
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own courses" ON courses
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Anyone can view course points" ON course_points
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_points.course_id 
            AND courses.is_active = true
        )
    );

CREATE POLICY "Course owners can create points" ON course_points
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_points.course_id 
            AND courses.created_by = auth.uid()
        )
    );

CREATE POLICY "Course owners can update points" ON course_points
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_points.course_id 
            AND courses.created_by = auth.uid()
        )
    );

CREATE POLICY "Course owners can delete points" ON course_points
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_points.course_id 
            AND courses.created_by = auth.uid()
        )
    );

-- 6. updated_at 트리거 함수 및 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 기존 데이터 업데이트 (is_active가 NULL인 경우)
UPDATE courses SET is_active = true WHERE is_active IS NULL;

-- 완료 메시지
SELECT 'courses 테이블 구조 업데이트 완료!' as message;
