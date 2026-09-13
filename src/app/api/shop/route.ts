import { NextResponse } from 'next/server';
import { getAuthUser, getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();

    const [itemsRes, ownedRes] = await Promise.all([
      supabase.from('CosmeticItem').select('*'),
      supabase.from('UserCosmetic').select('*, item:CosmeticItem(*)').eq('userId', user.id),
    ]);

    return NextResponse.json({
      items: itemsRes.data || [],
      owned: ownedRes.data || [],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

