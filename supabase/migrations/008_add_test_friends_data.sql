-- 테스트용 친구 관계 및 위치 데이터 추가

-- 개발용 더미 사용자 생성 (이미 있다면 무시)
INSERT INTO users (id, email, name, profile_image, total_distance, total_runs, created_at) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'dev@runspot.com', '개발자', null, 0, 0, NOW()),
  ('00000000-0000-0000-0000-000000000002', 'friend1@runspot.com', '친구1', null, 25.5, 12, NOW()),
  ('00000000-0000-0000-0000-000000000003', 'friend2@runspot.com', '친구2', null, 18.3, 8, NOW()),
  ('00000000-0000-0000-0000-000000000004', 'friend3@runspot.com', '친구3', null, 42.1, 20, NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  total_distance = EXCLUDED.total_distance,
  total_runs = EXCLUDED.total_runs;

-- 친구 관계 생성
INSERT INTO friendships (requester_id, addressee_id, status, created_at) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'accepted', NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'accepted', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'accepted', NOW() - INTERVAL '3 days')
ON CONFLICT (requester_id, addressee_id) DO NOTHING;

-- 위치 공유 설정 추가
INSERT INTO user_location_settings (user_id, sharing_status, share_during_running, share_with_friends, created_at) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'friends_only', true, true, NOW()),
  ('00000000-0000-0000-0000-000000000002', 'friends_only', true, true, NOW()),
  ('00000000-0000-0000-0000-000000000003', 'friends_only', true, true, NOW()),
  ('00000000-0000-0000-0000-000000000004', 'friends_only', true, true, NOW())
ON CONFLICT (user_id) DO UPDATE SET
  sharing_status = EXCLUDED.sharing_status,
  share_during_running = EXCLUDED.share_during_running,
  share_with_friends = EXCLUDED.share_with_friends;

-- 테스트용 위치 데이터 추가 (서울 시내 여러 위치)
INSERT INTO shared_locations (user_id, latitude, longitude, accuracy, speed, heading, is_running, shared_at, expires_at) 
VALUES 
  -- 친구1: 한강공원 (런닝 중)
  ('00000000-0000-0000-0000-000000000002', 37.5326, 126.9619, 5.0, 8.5, 45.0, true, NOW() - INTERVAL '2 minutes', NOW() + INTERVAL '58 minutes'),
  -- 친구2: 올림픽공원 (런닝 중)
  ('00000000-0000-0000-0000-000000000003', 37.5219, 127.1241, 3.0, 7.2, 120.0, true, NOW() - INTERVAL '5 minutes', NOW() + INTERVAL '55 minutes'),
  -- 친구3: 남산 (정지 상태)
  ('00000000-0000-0000-0000-000000000004', 37.5511, 126.9882, 8.0, 0.0, 0.0, false, NOW() - INTERVAL '10 minutes', NOW() + INTERVAL '50 minutes');

-- 코스 데이터가 있다면 연결 (선택적)
UPDATE shared_locations 
SET course_id = (SELECT id FROM courses WHERE name LIKE '%한강%' LIMIT 1)
WHERE user_id = '00000000-0000-0000-0000-000000000002';

UPDATE shared_locations 
SET course_id = (SELECT id FROM courses WHERE name LIKE '%올림픽%' LIMIT 1)
WHERE user_id = '00000000-0000-0000-0000-000000000003';
