import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/supabase-server';
import {
  computeDecay,
  computeStepsNeeded,
  SHADOW_INITIAL_HP,
  SHADOW_HP_PER_DAY,
} from '@/lib/game-engine';

export async function POST(request: Request) {
  try {
    // DEMO_MODE gate — 403 if not enabled
    if (process.env.DEMO_MODE !== 'true') {
      return NextResponse.json({ error: 'Demo mode not enabled' }, { status: 403 });
    }

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const days = Math.min(Math.max(1, body.days || 3), 7); // Clamp 1-7

    const now = new Date();
    const simulatedLastActivity = new Date(
      now.getTime() - days * 24 * 60 * 60 * 1000
    );

    // Step 1: Set all user's attributes lastActivityAt to simulated past
    await prisma.attribute.updateMany({
      where: { userId: user.id },
      data: { lastActivityAt: simulatedLastActivity },
    });

    // Step 2: Run decay logic for this user's attributes
    const attributes = await prisma.attribute.findMany({
      where: { userId: user.id },
    });

    const results = [];

    for (const attr of attributes) {
      const { newXp, overdueDays } = computeDecay(
        attr.xp,
        attr.lastActivityAt,
        now
      );

      await prisma.attribute.update({
        where: { id: attr.id },
        data: { xp: newXp },
      });

      // Shadow spawn/growth
      const activeShadow = await prisma.shadowEntity.findFirst({
        where: {
          attributeId: attr.id,
          userId: user.id,
          defeatedAt: null,
        },
      });

      if (!activeShadow && overdueDays > 0) {
        await prisma.shadowEntity.create({
          data: {
            userId: user.id,
            attributeId: attr.id,
            hp: SHADOW_INITIAL_HP,
            stepsNeeded: computeStepsNeeded(SHADOW_INITIAL_HP),
          },
        });
      } else if (activeShadow && overdueDays > 0) {
        const newHp = activeShadow.hp + SHADOW_HP_PER_DAY * overdueDays;
        await prisma.shadowEntity.update({
          where: { id: activeShadow.id },
          data: {
            hp: newHp,
            stepsNeeded: computeStepsNeeded(newHp),
          },
        });
      }

      results.push({
        name: attr.name,
        oldXp: attr.xp,
        newXp,
        overdueDays,
      });
    }

    return NextResponse.json({
      success: true,
      simulatedDays: days,
      results,
    });
  } catch (error) {
    console.error('Simulate error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
