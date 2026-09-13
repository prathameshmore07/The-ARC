import { NextResponse } from 'next/server';
import { getAuthUser, getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { itemId } = await request.json();
    if (!itemId) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    const { data: item } = await supabase
      .from('CosmeticItem')
      .select('*')
      .eq('id', itemId)
      .maybeSingle();

    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const { data: dbUser } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!dbUser || (dbUser.grit || 0) < item.price) {
      return NextResponse.json({ error: 'Not enough grit' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('UserCosmetic')
      .select('id')
      .eq('userId', user.id)
      .eq('itemId', item.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Already owned' }, { status: 400 });
    }

    const newGrit = (dbUser.grit || 0) - item.price;
    await supabase
      .from('User')
      .update({ grit: newGrit })
      .eq('id', user.id);

    const { data: userCosmetic, error: cosmError } = await supabase
      .from('UserCosmetic')
      .insert({
        userId: user.id,
        itemId: item.id,
        equipped: false,
      })
      .select('*, item:CosmeticItem(*)')
      .single();

    if (cosmError) {
      return NextResponse.json({ error: cosmError.message }, { status: 500 });
    }

    return NextResponse.json({ grit: newGrit, item: userCosmetic }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
