-- 친구 위치 데이터 직접 추가 (테스트용)

-- 현재 친구 ID: cab0716f-db85-4129-ba92-8da8e99fa56
-- 이 친구의 위치 데이터를 추가

INSERT INTO shared_locations (
    user_id, 
    latitude, 
    longitude, 
    accuracy, 
    speed, 
    heading, 
    is_running, 
    shared_at, 
    expires_at
) VALUES (
    'cab0716f-db85-4129-ba92-8da8e99fa56',  -- 친구 ID
    37.5326,  -- 한강공원 위도
    126.9619, -- 한강공원 경도
    5.0,      -- GPS 정확도 5m
    8.5,      -- 속도 8.5km/h
    45.0,     -- 방향각 45도
    true,     -- 런닝 중
    NOW(),    -- 현재 시간
    NOW() + INTERVAL '1 hour'  -- 1시간 후 만료
)
ON CONFLICT DO NOTHING;

-- 위치 공유 설정도 확인/추가
INSERT INTO user_location_settings (
    user_id,
    sharing_status,
    share_during_running,
    share_with_friends
) VALUES (
    'cab0716f-db85-4129-ba92-8da8e99fa56',
    'friends_only',
    true,
    true
)
ON CONFLICT (user_id) DO UPDATE SET
    sharing_status = EXCLUDED.sharing_status,
    share_during_running = EXCLUDED.share_during_running,
    share_with_friends = EXCLUDED.share_with_friends;
