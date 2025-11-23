-- 테스트용 제휴 스팟 데이터 추가
-- 생성일: 2024-11-23

-- spots 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS spots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    signature_menu VARCHAR(255),
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone VARCHAR(20),
    open_time VARCHAR(100),
    discount_percentage INTEGER,
    special_offer TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logo_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    thumbnail_image TEXT
);

-- 테스트용 스팟 데이터 삽입 (기존 데이터가 없는 경우에만)
INSERT INTO spots (name, category, description, signature_menu, address, latitude, longitude, phone, open_time, discount_percentage, special_offer)
SELECT * FROM (VALUES
    ('런너스 카페', 'cafe', '러너들을 위한 전용 카페입니다. 건강한 음료와 간식을 제공합니다.', '프로틴 스무디', '서울특별시 강남구 테헤란로 123', 37.5012, 127.0396, '02-1234-5678', '06:00-22:00', 15, null),
    ('헬시 레스토랑', 'restaurant', '건강한 식단을 제공하는 레스토랑입니다.', '닭가슴살 샐러드', '서울특별시 서초구 서초대로 456', 37.4946, 127.0276, '02-2345-6789', '11:00-21:00', 20, null),
    ('스포츠 용품점', 'shop', '런닝 용품 전문 매장입니다.', '런닝화', '서울특별시 송파구 올림픽로 789', 37.5145, 127.1026, '02-3456-7890', '10:00-20:00', 10, '런닝화 구매 시 양말 증정'),
    ('피트니스 센터', 'fitness', '24시간 운영하는 피트니스 센터입니다.', '1일 이용권', '서울특별시 마포구 월드컵로 321', 37.5563, 126.9356, '02-4567-8901', '24시간', null, '1일 무료 이용권'),
    ('런닝 클럽 카페', 'cafe', '런닝 클럽이 운영하는 커뮤니티 카페입니다.', '에너지 드링크', '서울특별시 용산구 한강대로 654', 37.5326, 126.9652, '02-5678-9012', '05:00-23:00', 25, null)
) AS v(name, category, description, signature_menu, address, latitude, longitude, phone, open_time, discount_percentage, special_offer)
WHERE NOT EXISTS (SELECT 1 FROM spots LIMIT 1);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_spots_category ON spots(category);
CREATE INDEX IF NOT EXISTS idx_spots_is_active ON spots(is_active);
CREATE INDEX IF NOT EXISTS idx_spots_location ON spots(latitude, longitude);
