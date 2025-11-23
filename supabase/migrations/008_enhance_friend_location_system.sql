-- 친구 위치 시스템 개선을 위한 추가 마이그레이션
-- 홈 화면 친구 위치 표시 기능 최적화

-- 1. user_location_settings 테이블에 추가 컬럼
ALTER TABLE user_location_settings ADD COLUMN IF NOT EXISTS
  show_activity_status BOOLEAN DEFAULT TRUE,   -- 활동 상태 표시 여부
  visible_to_friends BOOLEAN DEFAULT TRUE,     -- 친구들에게 보이기 여부
  last_location_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(); -- 마지막 위치 업데이트 시간

-- 2. shared_locations 테이블에 활동 타입 추가
ALTER TABLE shared_locations ADD COLUMN IF NOT EXISTS
  activity_type VARCHAR(20) DEFAULT 'idle' CHECK (activity_type IN ('idle', 'walking', 'running', 'cycling')),
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100), -- 배터리 수준 (위치 업데이트 최적화용)
  network_quality VARCHAR(10) DEFAULT 'good' CHECK (network_quality IN ('poor', 'fair', 'good', 'excellent')); -- 네트워크 품질

-- 3. 친구별 위치 공유 세부 설정 테이블 (선택적)
CREATE TABLE IF NOT EXISTS friend_location_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    can_see_location BOOLEAN DEFAULT TRUE,
    can_see_activity BOOLEAN DEFAULT TRUE,
    can_see_running_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 같은 친구 관계에 대해 중복 설정 방지
    CONSTRAINT unique_friend_permission UNIQUE (user_id, friend_id),
    -- 자기 자신에 대한 설정 방지
    CONSTRAINT no_self_permission CHECK (user_id != friend_id)
);

-- 4. 위치 기반 알림 설정 테이블 (향후 확장용)
CREATE TABLE IF NOT EXISTS location_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    notify_when_friend_nearby BOOLEAN DEFAULT FALSE,
    nearby_distance_meters INTEGER DEFAULT 500, -- 근처 거리 (미터)
    notify_when_friend_running BOOLEAN DEFAULT FALSE,
    notify_when_friend_at_favorite_spot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_nearby_distance CHECK (nearby_distance_meters > 0 AND nearby_distance_meters <= 5000)
);

-- 5. 위치 히스토리 테이블 (분석 및 통계용, 선택적)
CREATE TABLE IF NOT EXISTS location_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    activity_type VARCHAR(20) DEFAULT 'idle',
    is_running BOOLEAN DEFAULT FALSE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 파티셔닝을 위한 월별 인덱스 (성능 최적화)
    CONSTRAINT valid_latitude_history CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT valid_longitude_history CHECK (longitude >= -180 AND longitude <= 180)
);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_shared_locations_activity_type ON shared_locations(activity_type);
CREATE INDEX IF NOT EXISTS idx_shared_locations_user_activity ON shared_locations(user_id, activity_type, shared_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_location_settings_visible ON user_location_settings(visible_to_friends, sharing_status);

CREATE INDEX IF NOT EXISTS idx_friend_location_permissions_user ON friend_location_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_location_permissions_friend ON friend_location_permissions(friend_id);

CREATE INDEX IF NOT EXISTS idx_location_notifications_user ON location_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_location_history_user_time ON location_history(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_history_activity ON location_history(activity_type, recorded_at DESC);

-- updated_at 트리거 추가
CREATE TRIGGER IF NOT EXISTS update_friend_location_permissions_updated_at 
    BEFORE UPDATE ON friend_location_permissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_location_notifications_updated_at 
    BEFORE UPDATE ON location_notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책 추가
ALTER TABLE friend_location_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 설정만 볼 수 있음
CREATE POLICY friend_location_permissions_policy ON friend_location_permissions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY location_notifications_policy ON location_notifications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY location_history_policy ON location_history
    FOR ALL USING (auth.uid() = user_id);

-- 기본 설정을 모든 기존 사용자에게 추가
INSERT INTO location_notifications (user_id, notify_when_friend_nearby, notify_when_friend_running)
SELECT id, FALSE, FALSE
FROM users
WHERE id NOT IN (SELECT user_id FROM location_notifications);

-- 테이블 코멘트 추가
COMMENT ON TABLE friend_location_permissions IS '친구별 위치 공유 세부 권한 설정';
COMMENT ON TABLE location_notifications IS '위치 기반 알림 설정';
COMMENT ON TABLE location_history IS '위치 히스토리 (분석 및 통계용)';

COMMENT ON COLUMN shared_locations.activity_type IS '사용자 활동 타입: idle, walking, running, cycling';
COMMENT ON COLUMN shared_locations.battery_level IS '배터리 수준 (위치 업데이트 최적화용)';
COMMENT ON COLUMN shared_locations.network_quality IS '네트워크 품질 (업데이트 빈도 조절용)';
