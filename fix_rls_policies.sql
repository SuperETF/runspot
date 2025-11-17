-- RLS 정책 문제 해결

-- 1. 현재 RLS 정책 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('courses', 'course_points');

-- 2. 현재 정책들 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('courses', 'course_points');

-- 3. 기존 정책들 모두 삭제
DROP POLICY IF EXISTS "Anyone can view active courses" ON courses;
DROP POLICY IF EXISTS "Authenticated users can create courses" ON courses;
DROP POLICY IF EXISTS "Users can update own courses" ON courses;
DROP POLICY IF EXISTS "Users can delete own courses" ON courses;
DROP POLICY IF EXISTS "Anyone can view course points" ON course_points;
DROP POLICY IF EXISTS "Course owners can create points" ON course_points;
DROP POLICY IF EXISTS "Course owners can update points" ON course_points;
DROP POLICY IF EXISTS "Course owners can delete points" ON course_points;

-- 4. 임시로 RLS 비활성화 (개발 환경용)
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_points DISABLE ROW LEVEL SECURITY;

-- 5. 또는 모든 사용자에게 모든 권한 허용하는 정책 생성 (개발 환경용)
-- ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE course_points ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow all for development" ON courses FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for development" ON course_points FOR ALL USING (true) WITH CHECK (true);

-- 6. 테이블 권한 확인 및 설정
GRANT ALL ON courses TO authenticated;
GRANT ALL ON course_points TO authenticated;
GRANT ALL ON courses TO anon;
GRANT ALL ON course_points TO anon;

-- 7. 시퀀스 권한도 설정 (UUID 생성용)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 8. 최종 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS 활성화됨'
        ELSE 'RLS 비활성화됨'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('courses', 'course_points');

-- 완료 메시지
SELECT 'RLS 정책 문제 해결 완료! (개발 환경용 설정)' as message;
