-- =====================================================================
-- THE HAIR GALLERY - POSTGRESQL / SUPABASE DATABASE SCHEMAS
-- =====================================================================

-- 1. Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Define custom type structures
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE reservation_status AS ENUM ('Pending', 'Confirmed', 'Completed', 'Cancelled');

-- 3. Create 'users' table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'USER',
    phone VARCHAR(50),
    provider VARCHAR(50) NOT NULL DEFAULT 'credentials', -- "credentials" or "google"
    mobile_optimized BOOLEAN DEFAULT TRUE,
    price INTEGER,
    work_menu VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create unified 'services' table (Single consolidated table for procedure & pricing management)
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL DEFAULT '커트',
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL DEFAULT 0, -- Stored in KRW
    duration_minutes INTEGER DEFAULT 30,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create 'reservations' table
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL, -- "09:00", "14:00" etc.
    status reservation_status DEFAULT 'Pending',
    price INTEGER, -- Custom overriding price for the reservation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Add Performance Indexes
CREATE INDEX idx_reservations_date_time ON reservations(date, time);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);

-- 7. DOUBLE-BOOKING PREVENTION CONSTRAINT (Database-Level Guarantee)
-- A partial unique index ensures that no two active reservations can share the same date and time slot.
-- If a reservation is 'Cancelled', it is excluded from the unique constraint, freeing up the slot.
CREATE UNIQUE INDEX idx_reservations_prevent_double_booking
ON reservations (date, time)
WHERE (status <> 'Cancelled');

-- 8. Seed Initial Service Registry (Unified Services Table)
INSERT INTO services (category, name, price, duration_minutes, description, display_order, is_active) VALUES
('커트', '어린이커트', 13000, 30, '자극 없는 미취학/초등 전용 컷', 1, true),
('커트', '중.고생커트', 15000, 30, '학업 친화적 트렌디 커트', 2, true),
('커트', '남성커트', 17000, 45, '정교한 가위/클리퍼 컷 및 프리미엄 스타일링', 3, true),
('커트', '여자커트', 19000, 30, '맞춤 샴푸 및 볼륨 레이어드 컷', 4, true),
('염색', '새치머리 뿌리염색 기본', 40000, 120, '두피에서 산생모 3cm이하', 5, true),
('염색', '멋내기 뿌리염색', 50000, 60, '새로 자란 모발의 자연스러운 톤 연결 및 광택 케어', 6, true),
('염색', '전체 디자인 컬러', 80000, 120, '고급 아베다/밀본 프리미엄 염모제 사용', 7, true),
('펌', '베이직 펌', 70000, 90, '내추럴 컬 & 볼륨 세팅', 8, true),
('펌', '열펌 / 디지털 & 세팅펌', 110000, 120, '탄력 있는 S컬 / C컬 원장 직접 시술', 9, true),
('펌', '볼륨 매직 & 다운펌', 120000, 150, '곱슬 교정 및 깔끔한 차분함 연출', 10, true),
('클리닉', '모발 수분 집중 케어', 60000, 45, '3단계 단백질 충전 & 스팀 미스트', 11, true),
('클리닉', '두피 스파 & 디톡스 테라피', 70000, 50, '두피 스케일링 & 각질 스파 타월 마사지', 12, true),
('스타일링', '드라이', 20000, 45, '특별한 약속이나 이벤트를 위한 고급스러운 볼륨 드라이', 13, true),
('스타일링', '아이론 & 웨이브 세팅', 25000, 40, '특별한 모임/행사를 위한 아이론 드라이', 14, true),
('샴푸', '스페셜 릴렉싱 샴푸', 15000, 25, '두피 두들링 지압 & 스팀 타월 마무리', 15, true),
('업스타일', '행사 / 파티 업스타일', 80000, 60, '드레스/한복 연출을 위한 단아한 고전 세팅', 16, true),
('업스타일', '웨딩 / 혼주 메이크업 헤어', 120000, 90, '1:1 맞춤 볼륨 고정 프리미엄 업스타일', 17, true);

-- 9. Enable Row Level Security (RLS) on Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 10. Row Level Security Policies

-- 1. Create is_admin() security definer function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users can read their own row, admins can read any row
CREATE POLICY "Select users policy" ON users FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
);

-- Users can insert their own row, admins can insert any row
CREATE POLICY "Insert users policy" ON users FOR INSERT WITH CHECK (
    auth.uid() = id OR public.is_admin()
);

-- Users can update their own row, admins can update any row
CREATE POLICY "Update users policy" ON users FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
) WITH CHECK (
    auth.uid() = id OR public.is_admin()
);

-- Only admins can delete user rows
CREATE POLICY "Delete users policy" ON users FOR DELETE USING (
    public.is_admin()
);

-- Services policies:
-- Anyone can view services
DROP POLICY IF EXISTS "Services read public" ON services;
CREATE POLICY "Services read public" ON services FOR SELECT TO public USING (true);

-- Authenticated admins can insert new services
DROP POLICY IF EXISTS "Admins can insert services" ON services;
CREATE POLICY "Admins can insert services" ON services FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- Authenticated admins can update services
DROP POLICY IF EXISTS "Admins can update services" ON services;
CREATE POLICY "Admins can update services" ON services FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Authenticated admins can delete services
DROP POLICY IF EXISTS "Admins can delete services" ON services;
CREATE POLICY "Admins can delete services" ON services FOR DELETE TO authenticated
USING (public.is_admin());

-- Reservations policies:
-- Anyone can view reservations to check slot availability (necessary for the calendar to display disabled/booked slots)
CREATE POLICY "Reservations read public" ON reservations FOR SELECT TO public USING (true);

-- Anyone can insert a reservation (guests booking on the website)
CREATE POLICY "Reservations insert public" ON reservations FOR INSERT WITH CHECK (true);

-- Users can update/cancel their own reservations if they are signed in (or we can let users manage their own if they have their user_id set)
CREATE POLICY "Users update own reservations" ON reservations FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- =====================================================================
-- 11. Create 'work_records' table (Admin Work & Sales Management)
-- =====================================================================
CREATE TABLE work_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    work_content TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for search performance
CREATE INDEX idx_work_records_search ON work_records (customer_name, customer_phone);
-- Indexing for date sorting & range queries
CREATE INDEX idx_work_records_date ON work_records (date ASC);

-- Enable Row Level Security (RLS) on work_records
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;

-- Create policies: Only users with role = 'ADMIN' in 'users' table can perform CRUD operations
CREATE POLICY "Admins can select work_records" 
ON work_records FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
);

CREATE POLICY "Admins can insert work_records" 
ON work_records FOR INSERT TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
);

CREATE POLICY "Admins can update work_records" 
ON work_records FOR UPDATE TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
);

CREATE POLICY "Admins can delete work_records" 
ON work_records FOR DELETE TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
);
