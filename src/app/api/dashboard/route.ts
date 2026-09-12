import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/supabase-server';
import { getDecayStatus, levelProgress, xpForLevel } from '@/lib/game-engine';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        attributes: {
          include: {
            shadows: {
              where: { defeatedAt: null },
            },
          },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          include: { attribute: true },
        },
        snapshots: {
          orderBy: { date: 'desc' },
          take: 14, // 2 weeks for ghost rival
        },
        cosmetics: {
          include: { item: true },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Enrich attributes with decay status and progress
    const attributes = userData.attributes.map((attr) => ({
      ...attr,
      decayStatus: getDecayStatus(attr.lastActivityAt),
      progress: levelProgress(attr.xp, attr.level),
      xpForCurrentLevel: xpForLevel(attr.level),
      xpForNextLevel: xpForLevel(attr.level + 1),
      shadow: attr.shadows[0] || null,
    }));

    // Separate tasks by status
    const tasks = userData.tasks.map((t) => ({
      ...t,
      attribute: { id: t.attribute.id, name: t.attribute.name },
    }));

    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        grit: userData.grit,
      },
      attributes,
      tasks,
      snapshots: userData.snapshots,
      cosmetics: {
        owned: userData.cosmetics,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
