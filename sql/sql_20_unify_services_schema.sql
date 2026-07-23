-- =====================================================================
-- SQL 20: UNIFY SERVICES AND PRICE_LIST SCHEMAS INTO PUBLIC.SERVICES
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create public.services table if it does not exist
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL DEFAULT '커트',
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER DEFAULT 30,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure id column has default value generator on existing table
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.services ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION WHEN OTHERS THEN
        ALTER TABLE public.services ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    END;
END $$;

-- Ensure all required columns exist in public.services (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='services' AND column_name='category') THEN
        ALTER TABLE public.services ADD COLUMN category TEXT NOT NULL DEFAULT '커트';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='services' AND column_name='display_order') THEN
        ALTER TABLE public.services ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='services' AND column_name='is_active') THEN
        ALTER TABLE public.services ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='services' AND column_name='duration_minutes') THEN
        ALTER TABLE public.services ADD COLUMN duration_minutes INTEGER DEFAULT 30;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='services' AND column_name='description') THEN
        ALTER TABLE public.services ADD COLUMN description TEXT;
    END IF;
END $$;

-- 2. Migrate data from price_list if price_list table exists
DO $$
DECLARE
    id_is_uuid BOOLEAN;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='price_list') THEN
        SELECT (data_type = 'uuid') INTO id_is_uuid
        FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='services' AND column_name='id';

        IF id_is_uuid THEN
            INSERT INTO public.services (id, category, name, price, duration_minutes, description, display_order, is_active)
            SELECT 
                gen_random_uuid(),
                COALESCE(category, '커트'),
                COALESCE(title, '시술 항목'),
                CASE 
                    WHEN price ~ '^[0-9,]+' THEN CAST(REGEXP_REPLACE(price, '[^0-9]', '', 'g') AS INTEGER)
                    ELSE 0 
                END,
                COALESCE(duration_minutes, 30),
                description,
                COALESCE(display_order, 0),
                true
            FROM public.price_list
            ON CONFLICT DO NOTHING;
        ELSE
            INSERT INTO public.services (id, category, name, price, duration_minutes, description, display_order, is_active)
            SELECT 
                gen_random_uuid()::text,
                COALESCE(category, '커트'),
                COALESCE(title, '시술 항목'),
                CASE 
                    WHEN price ~ '^[0-9,]+' THEN CAST(REGEXP_REPLACE(price, '[^0-9]', '', 'g') AS INTEGER)
                    ELSE 0 
                END,
                COALESCE(duration_minutes, 30),
                description,
                COALESCE(display_order, 0),
                true
            FROM public.price_list
            ON CONFLICT DO NOTHING;
        END IF;
        
        DROP TABLE public.price_list CASCADE;
    END IF;
END $$;

-- 3. Seed real service data into public.services if table is currently empty
DO $$
DECLARE
    id_is_uuid BOOLEAN;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.services) THEN
        SELECT (data_type = 'uuid') INTO id_is_uuid
        FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='services' AND column_name='id';

        IF id_is_uuid THEN
            INSERT INTO public.services (id, category, name, price, duration_minutes, description, display_order, is_active) VALUES
            (gen_random_uuid(), '커트', '어린이커트', 13000, 30, '자극 없는 미취학/초등 전용 컷', 1, true),
            (gen_random_uuid(), '커트', '중.고생커트', 15000, 30, '학업 친화적 트렌디 커트', 2, true),
            (gen_random_uuid(), '커트', '남성커트', 17000, 45, '정교한 가위/클리퍼 컷 및 프리미엄 스타일링', 3, true),
            (gen_random_uuid(), '커트', '여자커트', 19000, 30, '맞춤 샴푸 및 볼륨 레이어드 컷', 4, true),
            (gen_random_uuid(), '염색', '새치머리 뿌리염색 기본', 40000, 120, '두피에서 산생모 3cm이하', 5, true),
            (gen_random_uuid(), '염색', '멋내기 뿌리염색', 50000, 60, '새로 자란 모발의 자연스러운 톤 연결 및 광택 케어', 6, true),
            (gen_random_uuid(), '염색', '전체 디자인 컬러', 80000, 120, '고급 아베다/밀본 프리미엄 염모제 사용', 7, true),
            (gen_random_uuid(), '펌', '베이직 펌', 70000, 90, '내추럴 컬 & 볼륨 세팅', 8, true),
            (gen_random_uuid(), '펌', '열펌 / 디지털 & 세팅펌', 110000, 120, '탄력 있는 S컬 / C컬 원장 직접 시술', 9, true),
            (gen_random_uuid(), '펌', '볼륨 매직 & 다운펌', 120000, 150, '곱슬 교정 및 깔끔한 차분함 연출', 10, true),
            (gen_random_uuid(), '클리닉', '모발 수분 집중 케어', 60000, 45, '3단계 단백질 충전 & 스팀 미스트', 11, true),
            (gen_random_uuid(), '클리닉', '두피 스파 & 디톡스 테라피', 70000, 50, '두피 스케일링 & 각질 스파 타월 마사지', 12, true),
            (gen_random_uuid(), '스타일링', '드라이', 20000, 45, '특별한 약속이나 이벤트를 위한 고급스러운 볼륨 드라이', 13, true),
            (gen_random_uuid(), '스타일링', '아이론 & 웨이브 세팅', 25000, 40, '특별한 모임/행사를 위한 아이론 드라이', 14, true),
            (gen_random_uuid(), '샴푸', '스페셜 릴렉싱 샴푸', 15000, 25, '두피 두들링 지압 & 스팀 타월 마무리', 15, true),
            (gen_random_uuid(), '업스타일', '행사 / 파티 업스타일', 80000, 60, '드레스/한복 연출을 위한 단아한 고전 세팅', 16, true),
            (gen_random_uuid(), '업스타일', '웨딩 / 혼주 메이크업 헤어', 120000, 90, '1:1 맞춤 볼륨 고정 프리미엄 업스타일', 17, true);
        ELSE
            INSERT INTO public.services (id, category, name, price, duration_minutes, description, display_order, is_active) VALUES
            (gen_random_uuid()::text, '커트', '어린이커트', 13000, 30, '자극 없는 미취학/초등 전용 컷', 1, true),
            (gen_random_uuid()::text, '커트', '중.고생커트', 15000, 30, '학업 친화적 트렌디 커트', 2, true),
            (gen_random_uuid()::text, '커트', '남성커트', 17000, 45, '정교한 가위/클리퍼 컷 및 프리미엄 스타일링', 3, true),
            (gen_random_uuid()::text, '커트', '여자커트', 19000, 30, '맞춤 샴푸 및 볼륨 레이어드 컷', 4, true),
            (gen_random_uuid()::text, '염색', '새치머리 뿌리염색 기본', 40000, 120, '두피에서 산생모 3cm이하', 5, true),
            (gen_random_uuid()::text, '염색', '멋내기 뿌리염색', 50000, 60, '새로 자란 모발의 자연스러운 톤 연결 및 광택 케어', 6, true),
            (gen_random_uuid()::text, '염색', '전체 디자인 컬러', 80000, 120, '고급 아베다/밀본 프리미엄 염모제 사용', 7, true),
            (gen_random_uuid()::text, '펌', '베이직 펌', 70000, 90, '내추럴 컬 & 볼륨 세팅', 8, true),
            (gen_random_uuid()::text, '펌', '열펌 / 디지털 & 세팅펌', 110000, 120, '탄력 있는 S컬 / C컬 원장 직접 시술', 9, true),
            (gen_random_uuid()::text, '펌', '볼륨 매직 & 다운펌', 120000, 150, '곱슬 교정 및 깔끔한 차분함 연출', 10, true),
            (gen_random_uuid()::text, '클리닉', '모발 수분 집중 케어', 60000, 45, '3단계 단백질 충전 & 스팀 미스트', 11, true),
            (gen_random_uuid()::text, '클리닉', '두피 스파 & 디톡스 테라피', 70000, 50, '두피 스케일링 & 각질 스파 타월 마사지', 12, true),
            (gen_random_uuid()::text, '스타일링', '드라이', 20000, 45, '특별한 약속이나 이벤트를 위한 고급스러운 볼륨 드라이', 13, true),
            (gen_random_uuid()::text, '스타일링', '아이론 & 웨이브 세팅', 25000, 40, '특별한 모임/행사를 위한 아이론 드라이', 14, true),
            (gen_random_uuid()::text, '샴푸', '스페셜 릴렉싱 샴푸', 15000, 25, '두피 두들링 지압 & 스팀 타월 마무리', 15, true),
            (gen_random_uuid()::text, '업스타일', '행사 / 파티 업스타일', 80000, 60, '드레스/한복 연출을 위한 단아한 고전 세팅', 16, true),
            (gen_random_uuid()::text, '업스타일', '웨딩 / 혼주 메이크업 헤어', 120000, 90, '1:1 맞춤 볼륨 고정 프리미엄 업스타일', 17, true);
        END IF;
    END IF;
END $$;

-- 4. Configure Row Level Security (RLS) policies
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Services read public" ON public.services;
CREATE POLICY "Services read public" ON public.services 
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
CREATE POLICY "Admins can insert services" ON public.services 
FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update services" ON public.services;
CREATE POLICY "Admins can update services" ON public.services 
FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete services" ON public.services;
CREATE POLICY "Admins can delete services" ON public.services 
FOR DELETE TO authenticated USING (public.is_admin());
