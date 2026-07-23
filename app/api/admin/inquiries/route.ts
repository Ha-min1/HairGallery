import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return { isAdmin: false, error: 'Unauthorized: Token missing' };

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { isAdmin: false, error: 'Missing environment configuration' };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

  if (authErr || !user) {
    return { isAdmin: false, error: 'Unauthorized: Invalid token' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = Boolean(
    profile?.role === 'ADMIN' ||
    (profile?.role && String(profile.role).toUpperCase() === 'ADMIN') ||
    profile?.is_admin === true ||
    profile?.is_admin === 'true' ||
    user.user_metadata?.role === 'ADMIN' ||
    user.user_metadata?.is_admin === true ||
    user.email === 'admin@hairgallery.com'
  );

  if (!isAdmin) {
    return { isAdmin: false, error: 'Forbidden: Admin access required' };
  }

  return { isAdmin: true, user };
}

export async function GET(req: NextRequest) {
  try {
    const authCheck = await verifyAdmin(req);
    if (!authCheck.isAdmin) {
      return NextResponse.json({ error: authCheck.error }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from('component_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return NextResponse.json({ inquiries: data });
      }
      console.warn('Supabase admin inquiries fetch notice:', error?.message);
    }

    return NextResponse.json({ inquiries: [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching inquiries' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authCheck = await verifyAdmin(req);
    if (!authCheck.isAdmin) {
      return NextResponse.json({ error: authCheck.error }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, reply_content, admin_reply } = body;

    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 });
    }

    const finalReply = reply_content !== undefined ? reply_content : admin_reply;
    const updatePayload: any = { updated_at: new Date().toISOString() };
    
    if (status !== undefined) updatePayload.status = status;
    if (finalReply !== undefined) {
      updatePayload.reply_content = finalReply;
      updatePayload.admin_reply = finalReply; // backward compatibility
      if (finalReply && finalReply.trim().length > 0) {
        updatePayload.replied_at = new Date().toISOString();
        if (!status) updatePayload.status = 'replied';
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const { error } = await supabase
        .from('component_inquiries')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, updated: updatePayload });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error updating inquiry' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authCheck = await verifyAdmin(req);
    if (!authCheck.isAdmin) {
      return NextResponse.json({ error: authCheck.error }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const { error } = await supabase
        .from('component_inquiries')
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error deleting inquiry' }, { status: 500 });
  }
}
