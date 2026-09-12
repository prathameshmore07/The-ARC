import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/supabase-server';
import {
  computeRewards,
  applyShadowSteal,
  computeStreak,
  computeLevel,
  validateFocusSession,
  computeReclaimedXp,
} from '@/lib/game-engine';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = await params;
    const body = await request.json().catch(() => ({}));
    const { focusSessionId } = body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { attribute: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (task.status === 'done') {
      return NextResponse.json({ error: 'Task already completed' }, { status: 400 });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      let focusVerified = false;
      let computedDurationSec: number | null = null;

      // Validate server-timed session if provided
      if (focusSessionId) {
        const session = await tx.focusSession.findUnique({
          where: { id: focusSessionId },
        });
        if (session && session.userId === user.id && !session.endedAt) {
          const validation = validateFocusSession(session.heartbeatCount);
          focusVerified = validation.validated;
          computedDurationSec = validation.computedDurationSec;

          await tx.focusSession.update({
            where: { id: focusSessionId },
            data: {
              endedAt: now,
              validated: focusVerified,
              computedDurationSec,
            },
          });
        } else if (session && session.endedAt) {
          focusVerified = session.validated;
          computedDurationSec = session.computedDurationSec;
        }
      }

      // Check for 48h resolve boost
      const hasXpBoost = !!(
        task.attribute.xpBoostUntil &&
        task.attribute.xpBoostUntil > now
      );

      // Compute initial rewards
      const rewards = computeRewards({
        focusVerified,
        computedDurationSec,
        hasXpBoost,
      });

      const earnedXp = rewards.xp;
      let securedXp = earnedXp;
      const gritGained = rewards.grit;

      // Shadow interaction
      const activeShadow = await tx.shadowEntity.findFirst({
        where: {
          attributeId: task.attributeId,
          userId: user.id,
          defeatedAt: null,
        },
      });

      let shadowInteraction: string | null = null;
      let shadowDefeated = false;
      let stolenXp = 0;
      let reclaimedXp = 0;

      if (activeShadow) {
        // Apply parasitic steal
        const stealResult = applyShadowSteal(earnedXp, activeShadow.stealRate);
        securedXp = stealResult.actualXp;
        stolenXp = stealResult.stolenXp;
        const newStolenPool = (activeShadow.stolenXpPool || 0) + stolenXp;

        if (focusVerified) {
          const newProgress = activeShadow.sealProgress + 1;
          if (newProgress >= activeShadow.stepsNeeded) {
            // Shadow defeated!
            shadowDefeated = true;
            reclaimedXp = computeReclaimedXp(newStolenPool);

            await tx.shadowEntity.update({
              where: { id: activeShadow.id },
              data: {
                sealProgress: newProgress,
                stolenXpPool: newStolenPool,
                defeatedAt: now,
              },
            });

            // Award Scar badge
            const scarName = `Scar of ${task.attribute.name}`;
            const scarCosmetic = await tx.cosmeticItem.upsert({
              where: { name: scarName },
              update: {},
              create: {
                name: scarName,
                type: 'badge',
                description: `Permanent testament: Banished the Shadow haunting your ${task.attribute.name}.`,
                price: 0,
                cssClass: `badge-scar`,
              },
            });

            await tx.userCosmetic.upsert({
              where: {
                userId_itemId: {
                  userId: user.id,
                  itemId: scarCosmetic.id,
                },
              },
              update: {},
              create: {
                userId: user.id,
                itemId: scarCosmetic.id,
                equipped: true,
              },
            });

            // Grant 48h XP boost (+10% resolve)
            await tx.attribute.update({
              where: { id: task.attributeId },
              data: {
                xpBoostUntil: new Date(now.getTime() + 48 * 60 * 60 * 1000),
              },
            });

            shadowInteraction = 'defeated';
          } else {
            await tx.shadowEntity.update({
              where: { id: activeShadow.id },
              data: {
                sealProgress: newProgress,
                stolenXpPool: newStolenPool,
              },
            });
            shadowInteraction = 'progressed';
          }
        } else {
          // Quick checkbox completion: Shadow steals, no progress on banish seal
          await tx.shadowEntity.update({
            where: { id: activeShadow.id },
            data: {
              stolenXpPool: newStolenPool,
            },
          });
          shadowInteraction = 'stealing';
        }
      }

      // Compute streak
      const newStreak = computeStreak(
        task.attribute.streak,
        task.attribute.lastActivityAt,
        now
      );

      // Attribute XP update (secured + any reclaimed XP on defeat)
      const totalXpAdded = securedXp + reclaimedXp;
      const newXp = task.attribute.xp + totalXpAdded;
      const oldLevel = task.attribute.level;
      const newLevel = computeLevel(newXp);
      const leveledUp = newLevel > oldLevel;

      await tx.attribute.update({
        where: { id: task.attributeId },
        data: {
          xp: newXp,
          level: newLevel,
          streak: newStreak,
          lastActivityAt: now,
        },
      });

      // Award grit
      await tx.user.update({
        where: { id: user.id },
        data: { grit: { increment: gritGained } },
      });

      // Create immutable completion log
      await tx.completionLog.create({
        data: {
          userId: user.id,
          taskId: task.id,
          xpAwarded: totalXpAdded,
          gritAwarded: gritGained,
          focusVerified,
          completedAt: now,
        },
      });

      // Mark task as done
      const updatedTask = await tx.task.update({
        where: { id: task.id },
        data: { status: 'done' },
      });

      // Part A #7: Transparent 3-number reconciliation payload
      return {
        task: updatedTask,
        earned: earnedXp,
        stolen: stolenXp,
        secured: securedXp,
        reclaimed: reclaimedXp,
        gritGained,
        newXp,
        newLevel,
        oldLevel,
        leveledUp,
        newStreak,
        focusVerified,
        shadowInteraction,
        shadowDefeated,
        attributeName: task.attribute.name,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Complete task error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
