import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  computeDecay,
  computeStepsNeeded,
  computeBaselineWeeklyRate,
  computeShadowHp,
  DECAY_GRACE_HOURS,
} from '@/lib/game-engine';

export async function POST(request: Request) {
  try {
    // Authenticate via CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const graceThreshold = new Date(
      now.getTime() - DECAY_GRACE_HOURS * 60 * 60 * 1000
    );

    // Find all attributes past the grace period
    const staleAttributes = await prisma.attribute.findMany({
      where: { lastActivityAt: { lt: graceThreshold } },
    });

    let processedCount = 0;
    const decayLog: Array<{
      attributeId: string;
      userId: string;
      oldXp: number;
      newXp: number;
      overdueDays: number;
      shadowHp: number;
      baselineWeeklyRate: number;
      shadowAction: string;
    }> = [];

    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    for (const attr of staleAttributes) {
      // Compute decay
      const { newXp, overdueDays } = computeDecay(
        attr.xp,
        attr.lastActivityAt,
        now
      );

      // Update attribute XP
      await prisma.attribute.update({
        where: { id: attr.id },
        data: { xp: newXp },
      });

      // Query historical completions in trailing 14 days to compute habit baseline
      const completionsCount = await prisma.completionLog.count({
        where: {
          userId: attr.userId,
          task: { attributeId: attr.id },
          completedAt: { gte: fourteenDaysAgo },
        },
      });

      const baselineWeeklyRate = computeBaselineWeeklyRate(completionsCount);
      const computedHp = computeShadowHp(baselineWeeklyRate, overdueDays);

      // Shadow spawn / growth
      const activeShadow = await prisma.shadowEntity.findFirst({
        where: {
          attributeId: attr.id,
          userId: attr.userId,
          defeatedAt: null,
        },
      });

      let shadowAction: string;

      if (!activeShadow) {
        await prisma.shadowEntity.create({
          data: {
            userId: attr.userId,
            attributeId: attr.id,
            hp: computedHp,
            baselineWeeklyRate,
            stepsNeeded: computeStepsNeeded(computedHp),
          },
        });
        shadowAction = 'spawned';
      } else {
        const newHp = Math.max(activeShadow.hp, computedHp);
        await prisma.shadowEntity.update({
          where: { id: activeShadow.id },
          data: {
            hp: newHp,
            baselineWeeklyRate,
            stepsNeeded: computeStepsNeeded(newHp),
          },
        });
        shadowAction = 'grew';
      }

      decayLog.push({
        attributeId: attr.id,
        userId: attr.userId,
        oldXp: attr.xp,
        newXp,
        overdueDays,
        shadowHp: computedHp,
        baselineWeeklyRate,
        shadowAction,
      });

      processedCount++;
    }

    // Create daily snapshots for all users
    const users = await prisma.user.findMany({
      include: { attributes: true },
    });

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    for (const user of users) {
      const totalXp = user.attributes.reduce((sum, a) => sum + a.xp, 0);

      await prisma.dailySnapshot.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          },
        },
        update: { totalXp },
        create: {
          userId: user.id,
          date: today,
          totalXp,
        },
      });
    }

    return NextResponse.json({
      success: true,
      processedAttributes: processedCount,
      usersSnapshotted: users.length,
      decayLog,
    });
  } catch (error) {
    console.error('Decay cron error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
