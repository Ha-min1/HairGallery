import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const INITIAL_PORTFOLIO_ITEMS = [
  {
    id: 'hair-01',
    image_name: 'hair_01.jpg',
    imageSrc: '/assets/images/hair/hair_01.jpg',
    title: '시그니처 발레아쥬 옴브레 & 내추럴 웨이브',
    description: '자연스러운 그라데이션과 부드러운 하이라이트로 얼굴 라인을 가꿔주는 더 헤어 갤러리의 베스트 컬러 시술입니다.',
    category: 'Color',
    tags: ['발레아쥬', '옴브레', '내추럴웨이브', '입체감'],
    designer: 'Senior Colorist Alex',
    display_order: 1,
    is_visible: true
  },
  {
    id: 'hair-02',
    image_name: 'hair_02.jpg',
    imageSrc: '/assets/images/hair/hair_02.jpg',
    title: '모던 허쉬 컷 & 페이스 라인 커튼뱅',
    description: '어깨 라인을 스치는 경쾌한 레이어와 커튼뱅이 결합되어 감각적이고 세련된 라인을 연출합니다.',
    category: 'Cut',
    tags: ['레이어드컷', '허쉬컷', '커튼뱅', '볼륨감'],
    designer: 'Master Stylist Claire',
    display_order: 2,
    is_visible: true
  },
  {
    id: 'hair-03',
    image_name: 'hair_03.jpg',
    imageSrc: '/assets/images/hair/hair_03.jpg',
    title: '클래식 헤이즐넛 브라운 젤리 파펌',
    description: '따뜻한 헤이즐넛 브라운 톤과 함께 풍성한 굵은 컬을 완성하는 손상 케어 특화 파펌입니다.',
    category: 'Perm',
    tags: ['빌드펌', '젤리펌', '헤이즐넛', '손상최소화'],
    designer: 'Top Stylist Min',
    display_order: 3,
    is_visible: true
  },
  {
    id: 'hair-04',
    image_name: 'hair_04.jpg',
    imageSrc: '/assets/images/hair/hair_04.jpg',
    title: '쿨 애쉬 블론드 슬릭 태슬 컷',
    description: '매끄러운 질감과 차가운 애쉬 톤의 하모니로 깔끔하고 세련된 분위기를 자아내는 프리미엄 디자인입니다.',
    category: 'Color',
    tags: ['애쉬블론드', '태슬컷', '슬릭컷', '트렌디'],
    designer: 'Director Jay',
    display_order: 4,
    is_visible: true
  }
];

async function verifyAdminAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return { user: null, error: '인증 헤더가 없습니다.' };

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

  if (authErr || !user) {
    return { user: null, error: '유효하지 않은 인증 세션입니다.' };
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
  const { data: profile } = await supabaseService
    .from('users')
    .select('id, name, email, role, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'ADMIN' || profile?.is_admin === true;

  if (!isAdmin) {
    return { user: null, error: '관리자 권한이 필요합니다.' };
  }

  return { user: { id: user.id, isAdmin: true }, error: null };
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from('hair_portfolio')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          image_name: item.image_name,
          imageSrc: item.image_name.startsWith('http') || item.image_name.startsWith('/')
            ? item.image_name
            : `/assets/images/hair/${item.image_name}`,
          title: item.title,
          description: item.description || '',
          category: item.category || 'Cut',
          tags: item.tags || [],
          designer: item.designer || 'Master Stylist',
          display_order: item.display_order ?? 0,
          is_visible: item.is_visible ?? true
        }));
        return NextResponse.json({ success: true, items: mapped });
      }
    }

    // Default fallback
    return NextResponse.json({ success: true, items: INITIAL_PORTFOLIO_ITEMS });
  } catch (err: any) {
    console.error('Error fetching portfolio items:', err);
    return NextResponse.json({ success: true, items: INITIAL_PORTFOLIO_ITEMS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error: authErr } = await verifyAdminAuth(req);
    if (authErr) {
      return NextResponse.json({ error: authErr }, { status: 403 });
    }

    const body = await req.json();
    const { image_name, title, description, category, tags, display_order, is_visible } = body;

    if (!image_name || !title) {
      return NextResponse.json({ error: '이미지 파일명과 제목은 필수 항목입니다.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    const payload = {
      image_name,
      title,
      description: description || null,
      category: category || 'Cut',
      tags: Array.isArray(tags) ? tags : [],
      display_order: display_order !== undefined ? Number(display_order) : 0,
      is_visible: is_visible !== undefined ? Boolean(is_visible) : true
    };

    const { data, error } = await supabase
      .from('hair_portfolio')
      .upsert(payload, { onConflict: 'image_name' })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, item: data });
  } catch (err: any) {
    console.error('Error updating portfolio item:', err);
    return NextResponse.json({ error: err.message || '헤어 포트폴리오 업데이트 실패' }, { status: 500 });
  }
}
