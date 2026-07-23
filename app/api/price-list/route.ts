import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const INITIAL_PRICE_ITEMS = [
  { id: 'p1', category: '커트', title: '남성 디자인 컷', price: '25,000원', description: '샴푸 및 왁스 스타일링 포함 (45분)', display_order: 1 },
  { id: 'p2', category: '커트', title: '여성 디자인 컷', price: '30,000원', description: '샴푸 및 블로우 드라이 포함 (60분)', display_order: 2 },
  { id: 'p3', category: '커트', title: '학생 컷 (중/고등)', price: '20,000원', description: '트렌디한 학업 친화적 커트 (40분)', display_order: 3 },
  { id: 'p4', category: '커트', title: '어린이 컷 (미취학/초등)', price: '18,000원', description: '자극 없는 프리미엄 커트 (30분)', display_order: 4 },
  
  { id: 'p5', category: '염색', title: '뿌리 염색 (3cm 이내)', price: '50,000원 ~', description: '단백질 보호제 및 영양 샴푸 케어 (75분)', display_order: 5 },
  { id: 'p6', category: '염색', title: '전체 디자인 컬러', price: '80,000원 ~', description: '고급 아베다/밀본 프리미엄 염모제 사용 (120분)', display_order: 6 },
  { id: 'p7', category: '염색', title: '발레아쥬 입체 컬러', price: '150,000원 ~', description: '손상 최소화 탈색 1회 + 무드 토너 앰플 (180분)', display_order: 7 },
  
  { id: 'p8', category: '펌', title: '베이직 펌', price: '70,000원 ~', description: '내추럴 컬 & 볼륨 세팅 (90분)', display_order: 8 },
  { id: 'p9', category: '펌', title: '열펌 / 디지털 & 세팅펌', price: '110,000원 ~', description: '탄력 있는 S컬 / C컬 원장 직접 시술 (120분)', display_order: 9 },
  { id: 'p10', category: '펌', title: '볼륨 매직 & 다운펌', price: '120,000원 ~', description: '곱슬 교정 및 깔끔한 차분함 연출 (150분)', display_order: 10 },
  
  { id: 'p11', category: '클리닉', title: '모발 수분 집중 케어', price: '60,000원', description: '3단계 단백질 충전 & 스팀 미스트 (45분)', display_order: 11 },
  { id: 'p12', category: '클리닉', title: '두피 스파 & 디톡스 테라피', price: '70,000원', description: '두피 스케일링 & 각질 스파 타월 마사지 (50분)', display_order: 12 },
  
  { id: 'p13', category: '스타일링', title: '내추럴 블로우 드라이', price: '20,000원', description: '볼륨 웨이브 & 데일리 세팅 (30분)', display_order: 13 },
  { id: 'p14', category: '스타일링', title: '아이론 & 웨이브 세팅', price: '25,000원', description: '특별한 모임/행사를 위한 아이론 드라이 (40분)', display_order: 14 },
  
  { id: 'p15', category: '샴푸', title: '스페셜 릴렉싱 샴푸', price: '15,000원', description: '두피 두들링 지압 & 스팀 타월 마무리 (25분)', display_order: 15 },
  
  { id: 'p16', category: '업스타일', title: '행사 / 파티 업스타일', price: '80,000원 ~', description: '드레스/한복 연출을 위한 단아한 고전 세팅 (60분)', display_order: 16 },
  { id: 'p17', category: '업스타일', title: '웨딩 / 혼주 메이크업 헤어', price: '120,000원 ~', description: '1:1 맞춤 볼륨 고정 프리미엄 업스타일 (90분)', display_order: 17 }
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

  const isAdmin = Boolean(
    profile?.role === 'ADMIN' ||
    profile?.is_admin === true ||
    user.user_metadata?.role === 'ADMIN' ||
    user.user_metadata?.is_admin === true ||
    user.email === 'admin@hairgallery.com'
  );

  if (!isAdmin) {
    return { user: null, error: '관리자 권한이 필요합니다.' };
  }

  return { user: { id: user.id, isAdmin: true }, error: null };
}

// 1. GET: Public fetch of price list items
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from('price_list')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, items: data });
      }
    }

    return NextResponse.json({ success: true, items: INITIAL_PRICE_ITEMS });
  } catch (err: any) {
    console.error('Error fetching price list:', err);
    return NextResponse.json({ success: true, items: INITIAL_PRICE_ITEMS });
  }
}

// 2. POST: Admin insert new price item
export async function POST(req: NextRequest) {
  try {
    const { error: authErr } = await verifyAdminAuth(req);
    if (authErr) {
      return NextResponse.json({ error: authErr }, { status: 403 });
    }

    const body = await req.json();
    const { category, title, price, description, display_order } = body;

    if (!category || !title || price === undefined || price === null || price === '') {
      return NextResponse.json({ error: '카테고리, 시술명, 가격은 필수 입력 항목입니다.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    const payload = {
      category: category.trim(),
      title: title.trim(),
      price: String(price).trim(),
      description: description ? description.trim() : null,
      display_order: display_order !== undefined ? Number(display_order) : 0
    };

    const { data, error } = await supabase
      .from('price_list')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, item: data });
  } catch (err: any) {
    console.error('Error inserting price item:', err);
    return NextResponse.json({ error: err.message || '가격 항목 추가 실패' }, { status: 500 });
  }
}

// 3. PUT: Admin update existing price item
export async function PUT(req: NextRequest) {
  try {
    const { error: authErr } = await verifyAdminAuth(req);
    if (authErr) {
      return NextResponse.json({ error: authErr }, { status: 403 });
    }

    const body = await req.json();
    const { id, category, title, price, description, display_order } = body;

    if (!id || !category || !title || price === undefined || price === null || price === '') {
      return NextResponse.json({ error: 'ID, 카테고리, 시술명, 가격은 필수 항목입니다.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    const payload: any = {
      category: category.trim(),
      title: title.trim(),
      price: String(price).trim(),
      description: description ? description.trim() : null,
      display_order: display_order !== undefined ? Number(display_order) : 0
    };

    const { data, error } = await supabase
      .from('price_list')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, item: data });
  } catch (err: any) {
    console.error('Error updating price item:', err);
    return NextResponse.json({ error: err.message || '가격 항목 수정 실패' }, { status: 500 });
  }
}

// 4. DELETE: Admin delete price item
export async function DELETE(req: NextRequest) {
  try {
    const { error: authErr } = await verifyAdminAuth(req);
    if (authErr) {
      return NextResponse.json({ error: authErr }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id || null;
      } catch (e) {
        // query string only
      }
    }

    if (!id) {
      return NextResponse.json({ error: '삭제할 항목의 id가 필요합니다.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    const { data, error } = await supabase
      .from('price_list')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, deleted: data });
  } catch (err: any) {
    console.error('Error deleting price item:', err);
    return NextResponse.json({ error: err.message || '가격 항목 삭제 실패' }, { status: 500 });
  }
}
