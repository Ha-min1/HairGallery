-- 19. Hair Portfolio Table & RLS Policies (Complete CUD & is_admin Audit)

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.hair_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_name TEXT UNIQUE NOT NULL, -- e.g. 'hair_01.jpg' or full URL
    title TEXT NOT NULL,             -- e.g. '시그니처 발레아쥬 옴브레'
    description TEXT,                -- e.g. '자연스러운 그라데이션 하이라이트...'
    category TEXT DEFAULT 'Cut',     -- Cut, Color, Perm, Styling
    tags TEXT[] DEFAULT '{}',        -- ARRAY of tags
    designer TEXT DEFAULT 'Master Stylist',
    display_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns if table already exists
ALTER TABLE public.hair_portfolio ADD COLUMN IF NOT EXISTS designer TEXT DEFAULT 'Master Stylist';
ALTER TABLE public.hair_portfolio ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.hair_portfolio ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- 2. RLS 활성화
ALTER TABLE public.hair_portfolio ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (이전 이름 포함)
DROP POLICY IF EXISTS "Public hair_portfolio read policy" ON public.hair_portfolio;
DROP POLICY IF EXISTS "Admin hair_portfolio insert policy" ON public.hair_portfolio;
DROP POLICY IF EXISTS "Admin hair_portfolio update policy" ON public.hair_portfolio;
DROP POLICY IF EXISTS "Admin hair_portfolio delete policy" ON public.hair_portfolio;

DROP POLICY IF EXISTS "Anyone can view hair portfolio" ON public.hair_portfolio;
DROP POLICY IF EXISTS "Only admin can insert hair portfolio" ON public.hair_portfolio;
DROP POLICY IF EXISTS "Only admin can update hair portfolio" ON public.hair_portfolio;
DROP POLICY IF EXISTS "Only admin can delete hair portfolio" ON public.hair_portfolio;

-- 3. READ: 누구나 조회 가능 (SELECT)
CREATE POLICY "Anyone can view hair portfolio" ON public.hair_portfolio
    FOR SELECT TO public
    USING ( true );

-- 4. INSERT: 오직 ADMIN만 추가 가능
CREATE POLICY "Only admin can insert hair portfolio" ON public.hair_portfolio
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') AND public.is_admin())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
              AND (users.role = 'ADMIN' OR users.is_admin = true)
        )
    );

-- 5. UPDATE: 오직 ADMIN만 수정 가능
CREATE POLICY "Only admin can update hair portfolio" ON public.hair_portfolio
    FOR UPDATE TO authenticated
    USING (
        (SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') AND public.is_admin())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
              AND (users.role = 'ADMIN' OR users.is_admin = true)
        )
    )
    WITH CHECK (
        (SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') AND public.is_admin())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
              AND (users.role = 'ADMIN' OR users.is_admin = true)
        )
    );

-- 6. DELETE: 오직 ADMIN만 삭제 가능
CREATE POLICY "Only admin can delete hair portfolio" ON public.hair_portfolio
    FOR DELETE TO authenticated
    USING (
        (SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') AND public.is_admin())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
              AND (users.role = 'ADMIN' OR users.is_admin = true)
        )
    );

-- 7. Seed initial default items if empty
INSERT INTO public.hair_portfolio (image_name, title, description, category, tags, designer, display_order)
VALUES 
  ('hair_01.jpg', '시그니처 발레아쥬 옴브레 & 내추럴 웨이브', '자연스러운 그라데이션과 부드러운 하이라이트로 얼굴 라인을 가꿔주는 더 헤어 갤러리의 베스트 컬러 시술입니다.', 'Color', ARRAY['발레아쥬', '옴브레', '내추럴웨이브', '입체감'], 'Senior Colorist Alex', 1),
  ('hair_02.jpg', '모던 허쉬 컷 & 페이스 라인 커튼뱅', '어깨 라인을 스치는 경쾌한 레이어와 커튼뱅이 결합되어 감각적이고 세련된 라인을 연출합니다.', 'Cut', ARRAY['레이어드컷', '허쉬컷', '커튼뱅', '볼륨감'], 'Master Stylist Claire', 2),
  ('hair_03.jpg', '클래식 헤이즐넛 브라운 젤리 파펌', '따뜻한 헤이즐넛 브라운 톤과 함께 풍성한 굵은 컬을 완성하는 손상 케어 특화 파펌입니다.', 'Perm', ARRAY['빌드펌', '젤리펌', '헤이즐넛', '손상최소화'], 'Top Stylist Min', 3),
  ('hair_04.jpg', '쿨 애쉬 블론드 슬릭 태슬 컷', '매끄러운 질감과 차가운 애쉬 톤의 하모니로 깔끔하고 세련된 분위기를 자아내는 프리미엄 디자인입니다.', 'Color', ARRAY['애쉬블론드', '태슬컷', '슬릭컷', '트렌디'], 'Director Jay', 4)
ON CONFLICT (image_name) DO NOTHING;
