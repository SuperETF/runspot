-- Insert sample users (these would normally be created through auth signup)
-- Note: In production, users are created automatically via the trigger

-- Insert sample courses
INSERT INTO courses (
    name, 
    description, 
    gps_route, 
    distance, 
    duration, 
    difficulty, 
    course_type, 
    area, 
    images, 
    facilities,
    created_by,
    is_verified
) VALUES 
(
    '한강공원 여의도 코스',
    '한강공원 여의도 지구를 따라 달리는 평평하고 아름다운 코스입니다. 한강의 경치를 감상하며 달릴 수 있어 초보자에게 추천합니다.',
    '[
        {"lat": 37.5285, "lng": 126.9367},
        {"lat": 37.5290, "lng": 126.9380},
        {"lat": 37.5295, "lng": 126.9390},
        {"lat": 37.5300, "lng": 126.9400},
        {"lat": 37.5305, "lng": 126.9410},
        {"lat": 37.5300, "lng": 126.9420},
        {"lat": 37.5295, "lng": 126.9430},
        {"lat": 37.5290, "lng": 126.9440},
        {"lat": 37.5285, "lng": 126.9450},
        {"lat": 37.5280, "lng": 126.9440},
        {"lat": 37.5275, "lng": 126.9430},
        {"lat": 37.5270, "lng": 126.9420},
        {"lat": 37.5275, "lng": 126.9410},
        {"lat": 37.5280, "lng": 126.9400},
        {"lat": 37.5285, "lng": 126.9390},
        {"lat": 37.5285, "lng": 126.9367}
    ]'::jsonb,
    5.2,
    35,
    'easy',
    'hangang',
    '여의도',
    ARRAY['https://example.com/yeouido1.jpg', 'https://example.com/yeouido2.jpg'],
    '{
        "toilet": [{"lat": 37.5285, "lng": 126.9370, "name": "여의도공원 화장실"}],
        "convenience_store": [{"lat": 37.5280, "lng": 126.9375, "name": "GS25 여의도점"}],
        "parking": [{"lat": 37.5275, "lng": 126.9365, "name": "여의도공원 주차장"}]
    }'::jsonb,
    '00000000-0000-0000-0000-000000000001'::uuid,
    true
),
(
    '남산 순환로',
    '남산타워를 중심으로 한 순환 코스입니다. 경사가 있어 중급자 이상에게 추천하며, 서울 시내 전경을 감상할 수 있습니다.',
    '[
        {"lat": 37.5512, "lng": 126.9882},
        {"lat": 37.5520, "lng": 126.9890},
        {"lat": 37.5530, "lng": 126.9900},
        {"lat": 37.5540, "lng": 126.9910},
        {"lat": 37.5550, "lng": 126.9920},
        {"lat": 37.5555, "lng": 126.9930},
        {"lat": 37.5560, "lng": 126.9940},
        {"lat": 37.5555, "lng": 126.9950},
        {"lat": 37.5550, "lng": 126.9960},
        {"lat": 37.5540, "lng": 126.9970},
        {"lat": 37.5530, "lng": 126.9960},
        {"lat": 37.5520, "lng": 126.9950},
        {"lat": 37.5512, "lng": 126.9940},
        {"lat": 37.5505, "lng": 126.9930},
        {"lat": 37.5500, "lng": 126.9920},
        {"lat": 37.5505, "lng": 126.9910},
        {"lat": 37.5510, "lng": 126.9900},
        {"lat": 37.5512, "lng": 126.9882}
    ]'::jsonb,
    3.8,
    45,
    'medium',
    'mountain',
    '중구',
    ARRAY['https://example.com/namsan1.jpg', 'https://example.com/namsan2.jpg', 'https://example.com/namsan3.jpg'],
    '{
        "toilet": [{"lat": 37.5515, "lng": 126.9885, "name": "남산공원 화장실"}],
        "water_fountain": [{"lat": 37.5525, "lng": 126.9895, "name": "남산 약수터"}],
        "parking": [{"lat": 37.5505, "lng": 126.9875, "name": "남산 주차장"}]
    }'::jsonb,
    '00000000-0000-0000-0000-000000000001'::uuid,
    true
),
(
    '올림픽공원 둘레길',
    '올림픽공원을 한 바퀴 도는 코스입니다. 잘 정비된 산책로와 다양한 조각상을 감상하며 달릴 수 있습니다.',
    '[
        {"lat": 37.5219, "lng": 127.1241},
        {"lat": 37.5230, "lng": 127.1250},
        {"lat": 37.5240, "lng": 127.1260},
        {"lat": 37.5250, "lng": 127.1270},
        {"lat": 37.5260, "lng": 127.1280},
        {"lat": 37.5270, "lng": 127.1290},
        {"lat": 37.5275, "lng": 127.1300},
        {"lat": 37.5270, "lng": 127.1310},
        {"lat": 37.5260, "lng": 127.1320},
        {"lat": 37.5250, "lng": 127.1310},
        {"lat": 37.5240, "lng": 127.1300},
        {"lat": 37.5230, "lng": 127.1290},
        {"lat": 37.5220, "lng": 127.1280},
        {"lat": 37.5210, "lng": 127.1270},
        {"lat": 37.5205, "lng": 127.1260},
        {"lat": 37.5210, "lng": 127.1250},
        {"lat": 37.5219, "lng": 127.1241}
    ]'::jsonb,
    4.5,
    30,
    'easy',
    'park',
    '송파구',
    ARRAY['https://example.com/olympic1.jpg', 'https://example.com/olympic2.jpg'],
    '{
        "toilet": [
            {"lat": 37.5225, "lng": 127.1245, "name": "올림픽공원 화장실 1"},
            {"lat": 37.5255, "lng": 127.1285, "name": "올림픽공원 화장실 2"}
        ],
        "convenience_store": [{"lat": 37.5220, "lng": 127.1250, "name": "CU 올림픽공원점"}],
        "parking": [{"lat": 37.5215, "lng": 127.1235, "name": "올림픽공원 주차장"}]
    }'::jsonb,
    '00000000-0000-0000-0000-000000000001'::uuid,
    true
),
(
    '청계천 코스',
    '청계천을 따라 달리는 도심 속 힐링 코스입니다. 평지이며 접근성이 좋아 직장인들에게 인기가 높습니다.',
    '[
        {"lat": 37.5694, "lng": 126.9784},
        {"lat": 37.5700, "lng": 126.9790},
        {"lat": 37.5705, "lng": 126.9800},
        {"lat": 37.5710, "lng": 126.9810},
        {"lat": 37.5715, "lng": 126.9820},
        {"lat": 37.5720, "lng": 126.9830},
        {"lat": 37.5725, "lng": 126.9840},
        {"lat": 37.5730, "lng": 126.9850},
        {"lat": 37.5735, "lng": 126.9860},
        {"lat": 37.5740, "lng": 126.9870},
        {"lat": 37.5745, "lng": 126.9880},
        {"lat": 37.5750, "lng": 126.9890}
    ]'::jsonb,
    2.8,
    20,
    'easy',
    'urban',
    '중구',
    ARRAY['https://example.com/cheonggyecheon1.jpg'],
    '{
        "toilet": [{"lat": 37.5700, "lng": 126.9795, "name": "청계천 화장실"}],
        "convenience_store": [
            {"lat": 37.5695, "lng": 126.9785, "name": "세븐일레븐 청계천점"},
            {"lat": 37.5720, "lng": 126.9835, "name": "GS25 을지로점"}
        ]
    }'::jsonb,
    '00000000-0000-0000-0000-000000000001'::uuid,
    true
),
(
    '북한산 둘레길 1구간',
    '북한산 둘레길의 첫 번째 구간으로, 자연 속에서 달릴 수 있는 트레일 코스입니다. 고급자용 코스입니다.',
    '[
        {"lat": 37.6586, "lng": 126.9772},
        {"lat": 37.6590, "lng": 126.9780},
        {"lat": 37.6595, "lng": 126.9790},
        {"lat": 37.6600, "lng": 126.9800},
        {"lat": 37.6605, "lng": 126.9810},
        {"lat": 37.6610, "lng": 126.9820},
        {"lat": 37.6615, "lng": 126.9830},
        {"lat": 37.6620, "lng": 126.9840},
        {"lat": 37.6625, "lng": 126.9850},
        {"lat": 37.6630, "lng": 126.9860},
        {"lat": 37.6635, "lng": 126.9870},
        {"lat": 37.6640, "lng": 126.9880}
    ]'::jsonb,
    6.7,
    80,
    'hard',
    'mountain',
    '은평구',
    ARRAY['https://example.com/bukhansan1.jpg', 'https://example.com/bukhansan2.jpg'],
    '{
        "toilet": [{"lat": 37.6590, "lng": 126.9775, "name": "북한산 둘레길 화장실"}],
        "water_fountain": [{"lat": 37.6610, "lng": 126.9825, "name": "북한산 약수터"}],
        "parking": [{"lat": 37.6585, "lng": 126.9770, "name": "북한산 주차장"}]
    }'::jsonb,
    '00000000-0000-0000-0000-000000000001'::uuid,
    true
);

-- Insert sample reviews
INSERT INTO reviews (user_id, course_id, rating, comment) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 
 (SELECT id FROM courses WHERE name = '한강공원 여의도 코스'), 
 5, 
 '정말 좋은 코스입니다! 한강 뷰가 최고예요. 초보자에게 강력 추천합니다.'),
('00000000-0000-0000-0000-000000000001'::uuid, 
 (SELECT id FROM courses WHERE name = '남산 순환로'), 
 4, 
 '경치는 좋지만 생각보다 경사가 있어서 힘들었어요. 그래도 야경이 아름다워서 만족합니다.'),
('00000000-0000-0000-0000-000000000001'::uuid, 
 (SELECT id FROM courses WHERE name = '올림픽공원 둘레길'), 
 5, 
 '잘 정비되어 있고 안전해서 좋습니다. 가족과 함께 달리기에도 좋은 것 같아요.');
