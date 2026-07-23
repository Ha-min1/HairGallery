import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

async function verifyAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return { user: null, error: '로그인이 필요한 서비스입니다.' };

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

  if (authErr || !user) {
    return { user: null, error: '유효하지 않은 인증 세션입니다. 다시 로그인해 주세요.' };
  }

  // Fetch profile for role check
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
  const { data: profile } = await supabaseService
    .from('users')
    .select('id, name, email, role, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'ADMIN' || profile?.is_admin === true;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.full_name || '회원',
      role: profile?.role || 'USER',
      isAdmin
    },
    error: null
  };
}

function sortPosts(posts: any[]) {
  return [...posts].sort((a, b) => {
    // 1. is_pinned DESC
    const pinA = a.is_pinned ? 1 : 0;
    const pinB = b.is_pinned ? 1 : 0;
    if (pinA !== pinB) return pinB - pinA;

    // 2. If both pinned, pin_order ASC NULLS LAST
    if (a.is_pinned && b.is_pinned) {
      const orderA = a.pin_order !== null && a.pin_order !== undefined ? Number(a.pin_order) : Infinity;
      const orderB = b.pin_order !== null && b.pin_order !== undefined ? Number(b.pin_order) : Infinity;
      if (orderA !== orderB) return orderA - orderB;
    }

    // 3. created_at DESC
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function GET(req: NextRequest) {
  try {
    const { user, error: authErr } = await verifyAuth(req);
    if (authErr || !user) {
      return NextResponse.json({ error: authErr || '로그인이 필요합니다.' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users(id, name, email, role)
        `);

      if (!error && data) {
        const sorted = sortPosts(data);
        return NextResponse.json({ success: true, posts: sorted });
      }
      console.warn('Supabase fetch posts notice:', error?.message);
    }

    return NextResponse.json({ success: true, posts: [] });
  } catch (err: any) {
    console.error('Error fetching posts:', err);
    return NextResponse.json({ error: err.message || '게시글 목록을 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authErr } = await verifyAuth(req);
    if (authErr || !user) {
      return NextResponse.json({ error: authErr || '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, image_url = null, is_pinned = false, pin_order = null } = body;

    if (!title || !content) {
      return NextResponse.json({ error: '제목과 내용을 모두 입력해 주세요.' }, { status: 400 });
    }

    // Strict Admin Authorization Check for image_url, is_pinned, or pin_order
    const hasAdminFeatures = (image_url && String(image_url).trim().length > 0) || Boolean(is_pinned) || (pin_order !== null && pin_order !== undefined && pin_order !== '');
    if (hasAdminFeatures && !user.isAdmin) {
      return NextResponse.json({
        error: '이미지 첨부 및 게시글 상단 고정/순서 지정 기능은 관리자만 이용할 수 있습니다.'
      }, { status: 403 });
    }

    const newPost = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      author_id: user.id,
      image_url: user.isAdmin ? (image_url || null) : null,
      is_pinned: user.isAdmin ? Boolean(is_pinned) : false,
      pin_order: user.isAdmin && pin_order !== null && pin_order !== undefined && pin_order !== '' ? Number(pin_order) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from('posts')
        .insert([newPost])
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, post: data });
      }
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, post: newPost });
  } catch (err: any) {
    console.error('Error creating post:', err);
    return NextResponse.json({ error: err.message || '게시글 작성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, error: authErr } = await verifyAuth(req);
    if (authErr || !user) {
      return NextResponse.json({ error: authErr || '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, content, image_url, is_pinned, pin_order } = body;

    if (!id) {
      return NextResponse.json({ error: '게시글 ID가 필요합니다.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    const { data: targetPost } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();

    if (!targetPost) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    }

    const isAuthor = targetPost.author_id === user.id;
    if (!isAuthor && !user.isAdmin) {
      return NextResponse.json({ error: '수정 권한이 없습니다. 작성자 또는 관리자만 수정 가능합니다.' }, { status: 403 });
    }

    // Check if non-admin tries to change image_url / is_pinned / pin_order
    const isAlteringAdminFields = (image_url !== undefined && image_url !== targetPost.image_url) ||
      (is_pinned !== undefined && Boolean(is_pinned) !== Boolean(targetPost.is_pinned)) ||
      (pin_order !== undefined && pin_order !== targetPost.pin_order);

    if (isAlteringAdminFields && !user.isAdmin) {
      return NextResponse.json({
        error: '이미지 첨부 및 상단 고정/순서 변경은 관리자만 설정할 수 있습니다.'
      }, { status: 403 });
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };
    if (title !== undefined) updatePayload.title = title.trim();
    if (content !== undefined) updatePayload.content = content.trim();

    if (user.isAdmin) {
      if (image_url !== undefined) updatePayload.image_url = image_url || null;
      if (is_pinned !== undefined) updatePayload.is_pinned = Boolean(is_pinned);
      if (pin_order !== undefined) updatePayload.pin_order = pin_order !== null && pin_order !== '' ? Number(pin_order) : null;
    }

    const { error } = await supabase.from('posts').update(updatePayload).eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: updatePayload });
  } catch (err: any) {
    console.error('Error updating post:', err);
    return NextResponse.json({ error: err.message || '게시글 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, error: authErr } = await verifyAuth(req);
    if (authErr || !user) {
      return NextResponse.json({ error: authErr || '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '게시글 ID가 필요합니다.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    const { data: targetPost } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();

    if (!targetPost) {
      return NextResponse.json({ error: '게시글을 찾을 수 없거나 이미 삭제되었습니다.' }, { status: 404 });
    }

    const isAuthor = targetPost.author_id === user.id;
    if (!isAuthor && !user.isAdmin) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('Error deleting post:', err);
    return NextResponse.json({ error: err.message || '게시글 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
