import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { itemId } = await request.json();
    if (!itemId) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });

    const userCosmetic = await prisma.userCosmetic.findUnique({
      where: { userId_itemId: { userId: user.id, itemId: itemId } },
      include: { item: true }
    });

    if (!userCosmetic) {
      return NextResponse.json({ error: 'Item not owned' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      if (userCosmetic.item.type === 'theme') {
        const ownedThemes = await tx.userCosmetic.findMany({
          where: { userId: user.id, item: { type: 'theme' } }
        });
        for (const t of ownedThemes) {
          await tx.userCosmetic.update({
            where: { id: t.id },
            data: { equipped: false }
          });
        }
      }

      await tx.userCosmetic.update({
        where: { id: userCosmetic.id },
        data: { equipped: true }
      });
    });

    const updatedOwned = await prisma.userCosmetic.findMany({
      where: { userId: user.id },
      include: { item: true }
    });

    return NextResponse.json({ owned: updatedOwned });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
