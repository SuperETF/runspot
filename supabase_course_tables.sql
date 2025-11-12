-- RunSpot 코스 관리를 위한 데이터베이스 테이블 생성

-- 1. 코스 기본 정보 테이블
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    distance DECIMAL(8,2) DEFAULT 0, -- km 단위
    estimated_time INTEGER DEFAULT 0, -- 분 단위
    elevation_gain INTEGER DEFAULT 0, -- 미터 단위
    start_latitude DECIMAL(10,8),
    start_longitude DECIMAL(11,8),
    end_latitude DECIMAL(10,8),
    end_longitude DECIMAL(11,8),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 코스 경로 포인트 테이블
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

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses(difficulty);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_course_points_course_id ON course_points(course_id);
CREATE INDEX IF NOT EXISTS idx_course_points_order ON course_points(course_id, point_order);

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_points ENABLE ROW LEVEL SECURITY;

-- 코스 읽기 정책 (모든 사용자가 활성 코스 조회 가능)
CREATE POLICY "Anyone can view active courses" ON courses
    FOR SELECT USING (is_active = true);

-- 코스 생성 정책 (인증된 사용자만 생성 가능)
CREATE POLICY "Authenticated users can create courses" ON courses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 코스 수정 정책 (작성자만 수정 가능)
CREATE POLICY "Users can update own courses" ON courses
    FOR UPDATE USING (auth.uid() = created_by);

-- 코스 삭제 정책 (작성자만 삭제 가능)
CREATE POLICY "Users can delete own courses" ON courses
    FOR DELETE USING (auth.uid() = created_by);

-- 코스 포인트 읽기 정책 (활성 코스의 포인트만 조회 가능)
CREATE POLICY "Anyone can view course points" ON course_points
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_points.course_id 
            AND courses.is_active = true
        )
    );

-- 코스 포인트 생성 정책 (코스 작성자만 포인트 생성 가능)
CREATE POLICY "Course owners can create points" ON course_points
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_points.course_id 
            AND courses.created_by = auth.uid()
        )
    );

-- 코스 포인트 수정 정책 (코스 작성자만 포인트 수정 가능)
CREATE POLICY "Course owners can update points" ON course_points
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_points.course_id 
            AND courses.created_by = auth.uid()
        )
    );

-- 코스 포인트 삭제 정책 (코스 작성자만 포인트 삭제 가능)
CREATE POLICY "Course owners can delete points" ON course_points
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_points.course_id 
            AND courses.created_by = auth.uid()
        )
    );

-- 5. 트리거 함수 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 샘플 데이터 (테스트용)
INSERT INTO courses (name, description, difficulty, distance, estimated_time, start_latitude, start_longitude, end_latitude, end_longitude, created_by) 
VALUES 
    ('한강 러닝 코스', '한강공원을 따라 달리는 평탄한 코스입니다.', 'easy', 5.2, 30, 37.5326, 126.9652, 37.5298, 126.9725, '550e8400-e29b-41d4-a716-446655440001'),
    ('남산 트레일', '남산을 오르는 도전적인 코스입니다.', 'hard', 3.8, 25, 37.5547, 126.9707, 37.5512, 126.9882, '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT DO NOTHING;
