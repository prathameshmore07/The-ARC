import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { itemId } = await request.json();
    if (!itemId) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });

    const item = await prisma.cosmeticItem.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || dbUser.grit < item.price) {
      return NextResponse.json({ error: 'Not enough grit' }, { status: 400 });
    }

    const existing = await prisma.userCosmetic.findUnique({
      where: { userId_itemId: { userId: user.id, itemId: item.id } }
    });
    if (existing) {
      return NextResponse.json({ error: 'Already owned' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { grit: { decrement: item.price } }
      });

      const userCosmetic = await tx.userCosmetic.create({
        data: {
          userId: user.id,
          itemId: item.id,
          equipped: false
        },
        include: { item: true }
      });

      return { grit: updatedUser.grit, item: userCosmetic };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
