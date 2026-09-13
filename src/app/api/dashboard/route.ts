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
        completions: {
          orderBy: { completedAt: 'desc' },
          take: 30,
          include: {
            task: {
              include: { attribute: true },
            },
          },
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

    // Resolve equipped cosmetics
    const equippedTitleItem = userData.cosmetics.find((c) => c.equipped && c.item?.type === 'title');
    const equippedBadgeItem = userData.cosmetics.find((c) => c.equipped && (c.item?.type === 'badge' || c.item?.type === 'insignia'));

    const equippedTitle = equippedTitleItem?.item?.name || 'THE BUILDER';
    const equippedInsignia = equippedBadgeItem?.item?.name || 'CELESTIAL COMPASS';

    // Aggregate streak
    const maxStreak = Math.max(...userData.attributes.map((a) => a.streak || 0), 7);
    const lastActivity = userData.attributes.reduce<Date | null>((latest, a) => {
      if (!latest || (a.lastActivityAt && new Date(a.lastActivityAt) > latest)) {
        return a.lastActivityAt ? new Date(a.lastActivityAt) : latest;
      }
      return latest;
    }, null);

    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        grit: userData.grit || 184,
        marks: userData.grit || 184,
        streak: maxStreak,
        lastActivityAt: lastActivity?.toISOString() || new Date().toISOString(),
        equippedTitle,
        equippedInsignia,
      },
      attributes,
      tasks,
      snapshots: userData.snapshots,
      cosmetics: {
        owned: userData.cosmetics,
      },
      completions: userData.completions,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
