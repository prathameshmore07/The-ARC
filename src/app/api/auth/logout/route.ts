import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Supabase logout error:', error);
    return NextResponse.json({ error: 'Failed to sign out from Supabase' }, { status: 500 });
  }
}
