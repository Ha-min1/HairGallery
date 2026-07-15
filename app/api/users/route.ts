import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// DELETE: Withdraw membership (Delete user profile and authentication user account)
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error: Missing env vars' }, { status: 500 });
    }
    
    // 1. Verify user token using the standard anon client
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    
    // 2. Create admin client to bypass RLS and delete database profile & auth account
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // A. Delete user profile row in database 'users' table (associated reservations will have user_id set to NULL)
    const { error: dbError } = await adminClient
      .from('users')
      .delete()
      .eq('id', user.id);
      
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    
    // B. Delete Supabase Auth account
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (authDeleteError) {
      console.error('Failed to delete auth user account:', authDeleteError.message);
      // We still proceed since the personal info (profile in 'users' table) is deleted
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
