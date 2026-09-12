import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allItems = await prisma.cosmeticItem.findMany();
    const owned = await prisma.userCosmetic.findMany({
      where: { userId: user.id },
      include: { item: true }
    });

    return NextResponse.json({ items: allItems, owned });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
