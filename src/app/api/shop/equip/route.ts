import { NextResponse } from 'next/server';
import { getAuthUser, getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { itemId } = await request.json();
    if (!itemId) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    const { data: userCosmetic } = await supabase
      .from('UserCosmetic')
      .select('*, item:CosmeticItem(*)')
      .eq('userId', user.id)
      .eq('itemId', itemId)
      .maybeSingle();

    if (!userCosmetic) {
      return NextResponse.json({ error: 'Item not owned' }, { status: 400 });
    }

    const type = userCosmetic.item?.type;
    const { data: ownedItems } = await supabase
      .from('UserCosmetic')
      .select('*, item:CosmeticItem(*)')
      .eq('userId', user.id);

    if (ownedItems) {
      for (const t of ownedItems) {
        const tType = t.item?.type;
        const isSameSlot =
          (type === 'badge' || type === 'insignia')
            ? (tType === 'badge' || tType === 'insignia')
            : tType === type;

        if (isSameSlot && t.equipped && t.id !== userCosmetic.id) {
          await supabase
            .from('UserCosmetic')
            .update({ equipped: false })
            .eq('id', t.id);
        }
      }
    }

    await supabase
      .from('UserCosmetic')
      .update({ equipped: true })
      .eq('id', userCosmetic.id);

    const { data: updatedOwned } = await supabase
      .from('UserCosmetic')
      .select('*, item:CosmeticItem(*)')
      .eq('userId', user.id);

    return NextResponse.json({ owned: updatedOwned || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
