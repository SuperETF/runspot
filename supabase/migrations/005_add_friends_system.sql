-- 친구 시스템을 위한 데이터베이스 테이블 추가
-- 기존 RunSpot 스키마와 일관성 유지

-- 친구 관계 상태 enum 타입 생성
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');

-- 위치 공유 상태 enum 타입 생성  
CREATE TYPE location_sharing_status AS ENUM ('disabled', 'friends_only', 'running_only');

-- 친구 관계 테이블
CREATE TABLE friendships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    addressee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status friendship_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 같은 사용자끼리 중복 친구 요청 방지
    CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id),
    -- 자기 자신에게 친구 요청 방지
    CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id)
);

-- 사용자 위치 공유 설정 테이블
CREATE TABLE user_location_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    sharing_status location_sharing_status DEFAULT 'disabled' NOT NULL,
    share_during_running BOOLEAN DEFAULT FALSE,
    share_with_friends BOOLEAN DEFAULT FALSE,
    location_update_interval INTEGER DEFAULT 5, -- 초 단위, 기본 5초 (실시간 최적화)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 실시간 위치 공유 테이블 (임시 데이터, 주기적으로 정리)
CREATE TABLE shared_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2), -- GPS 정확도 (미터)
    speed DECIMAL(5, 2), -- 속도 (km/h)
    heading DECIMAL(5, 2), -- 방향각 (0-360도)
    is_running BOOLEAN DEFAULT FALSE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'), -- 1시간 후 만료
    
    -- 위치 데이터 유효성 검증
    CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180),
    CONSTRAINT valid_accuracy CHECK (accuracy >= 0),
    CONSTRAINT valid_speed CHECK (speed >= 0),
    CONSTRAINT valid_heading CHECK (heading >= 0 AND heading < 360)
);

-- 친구 활동 피드 테이블 (선택적, 나중에 확장 가능)
CREATE TABLE friend_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'run_completed', 'course_reviewed', 'achievement_unlocked' 등
    activity_data JSONB NOT NULL, -- 활동 관련 상세 데이터
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    running_log_id UUID REFERENCES running_logs(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_friendships_requester_id ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee_id ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friendships_created_at ON friendships(created_at DESC);

CREATE INDEX idx_user_location_settings_user_id ON user_location_settings(user_id);
CREATE INDEX idx_user_location_settings_sharing_status ON user_location_settings(sharing_status);

CREATE INDEX idx_shared_locations_user_id ON shared_locations(user_id);
CREATE INDEX idx_shared_locations_shared_at ON shared_locations(shared_at DESC);
CREATE INDEX idx_shared_locations_expires_at ON shared_locations(expires_at);
CREATE INDEX idx_shared_locations_is_running ON shared_locations(is_running);

CREATE INDEX idx_friend_activities_user_id ON friend_activities(user_id);
CREATE INDEX idx_friend_activities_activity_type ON friend_activities(activity_type);
CREATE INDEX idx_friend_activities_created_at ON friend_activities(created_at DESC);
CREATE INDEX idx_friend_activities_is_public ON friend_activities(is_public);

-- updated_at 트리거 추가
CREATE TRIGGER update_friendships_updated_at 
    BEFORE UPDATE ON friendships 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_location_settings_updated_at 
    BEFORE UPDATE ON user_location_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 친구 관계 관련 함수들
-- 1. 친구 요청 보내기
CREATE OR REPLACE FUNCTION send_friend_request(
    requester_uuid UUID,
    addressee_uuid UUID
)
RETURNS UUID AS $$
DECLARE
    friendship_id UUID;
    existing_friendship_id UUID;
BEGIN
    -- 이미 존재하는 친구 관계 확인
    SELECT id INTO existing_friendship_id
    FROM friendships 
    WHERE (requester_id = requester_uuid AND addressee_id = addressee_uuid)
       OR (requester_id = addressee_uuid AND addressee_id = requester_uuid);
    
    IF existing_friendship_id IS NOT NULL THEN
        RAISE EXCEPTION 'Friendship already exists';
    END IF;
    
    -- 새 친구 요청 생성
    INSERT INTO friendships (requester_id, addressee_id, status)
    VALUES (requester_uuid, addressee_uuid, 'pending')
    RETURNING id INTO friendship_id;
    
    RETURN friendship_id;
END;
$$ LANGUAGE plpgsql;

-- 2. 친구 요청 수락
CREATE OR REPLACE FUNCTION accept_friend_request(
    friendship_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE friendships 
    SET status = 'accepted', updated_at = NOW()
    WHERE id = friendship_uuid AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 3. 친구 목록 조회 (상호 친구만)
CREATE OR REPLACE FUNCTION get_user_friends(user_uuid UUID)
RETURNS TABLE(
    friend_id UUID,
    friend_name VARCHAR(100),
    friend_profile_image TEXT,
    friendship_created_at TIMESTAMP WITH TIME ZONE,
    is_location_shared BOOLEAN,
    last_shared_location_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN f.requester_id = user_uuid THEN f.addressee_id
            ELSE f.requester_id
        END as friend_id,
        u.name as friend_name,
        u.profile_image as friend_profile_image,
        f.created_at as friendship_created_at,
        CASE 
            WHEN uls.sharing_status != 'disabled' AND uls.share_with_friends = TRUE THEN TRUE
            ELSE FALSE
        END as is_location_shared,
        sl.shared_at as last_shared_location_time
    FROM friendships f
    JOIN users u ON (
        CASE 
            WHEN f.requester_id = user_uuid THEN u.id = f.addressee_id
            ELSE u.id = f.requester_id
        END
    )
    LEFT JOIN user_location_settings uls ON uls.user_id = u.id
    LEFT JOIN shared_locations sl ON sl.user_id = u.id 
        AND sl.shared_at = (
            SELECT MAX(shared_at) 
            FROM shared_locations 
            WHERE user_id = u.id AND expires_at > NOW()
        )
    WHERE f.status = 'accepted'
      AND (f.requester_id = user_uuid OR f.addressee_id = user_uuid)
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. 만료된 위치 데이터 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_locations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM shared_locations 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- QR 코드 친구 추가를 위한 users 테이블 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_token VARCHAR(32) UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');
ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');

-- QR 토큰 관련 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_qr_token ON users(qr_token);
CREATE INDEX IF NOT EXISTS idx_users_qr_expires ON users(qr_token_expires_at);

-- 기본 위치 공유 설정을 모든 기존 사용자에게 추가
INSERT INTO user_location_settings (user_id, sharing_status, share_during_running, share_with_friends)
SELECT id, 'disabled', FALSE, FALSE
FROM users
WHERE id NOT IN (SELECT user_id FROM user_location_settings);

-- 테이블 및 컬럼 코멘트 추가
COMMENT ON TABLE friendships IS '사용자 간 친구 관계 관리';
COMMENT ON TABLE user_location_settings IS '사용자별 위치 공유 설정';
COMMENT ON TABLE shared_locations IS '실시간 위치 공유 데이터 (임시 저장)';
COMMENT ON TABLE friend_activities IS '친구 활동 피드 (선택적 기능)';

COMMENT ON COLUMN friendships.status IS '친구 관계 상태: pending(대기), accepted(수락), blocked(차단)';
COMMENT ON COLUMN user_location_settings.sharing_status IS '위치 공유 상태: disabled(비활성), friends_only(친구만), running_only(런닝 중만)';
COMMENT ON COLUMN shared_locations.expires_at IS '위치 데이터 만료 시간 (기본 1시간)';
COMMENT ON COLUMN friend_activities.activity_type IS '활동 유형: run_completed, course_reviewed 등';
