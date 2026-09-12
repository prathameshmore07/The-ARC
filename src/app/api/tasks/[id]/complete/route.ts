import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/supabase-server';
import {
  computeRewards,
  applyShadowSteal,
  computeStreak,
  computeLevel,
  MIN_HEARTBEATS,
  HEARTBEAT_INTERVAL_SEC,
  validateFocusSession,
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

      // Validate focus session if provided
      if (focusSessionId) {
        const session = await tx.focusSession.findUnique({
          where: { id: focusSessionId },
        });
        if (session && session.userId === user.id && !session.endedAt) {
          // End the session
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
          // Session already ended — use its stored validation
          focusVerified = session.validated;
          computedDurationSec = session.computedDurationSec;
        }
      }

      // Check for XP boost
      const hasXpBoost = !!(
        task.attribute.xpBoostUntil &&
        task.attribute.xpBoostUntil > now
      );

      // Compute rewards
      const rewards = computeRewards({
        focusVerified,
        computedDurationSec,
        hasXpBoost,
      });

      let xpGained = rewards.xp;
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

      if (activeShadow) {
        // Apply steal
        const stealResult = applyShadowSteal(xpGained, activeShadow.stealRate);
        xpGained = stealResult.actualXp;
        stolenXp = stealResult.stolenXp;

        if (focusVerified) {
          const newProgress = activeShadow.sealProgress + 1;
          if (newProgress >= activeShadow.stepsNeeded) {
            // Shadow defeated!
            shadowDefeated = true;
            await tx.shadowEntity.update({
              where: { id: activeShadow.id },
              data: {
                sealProgress: newProgress,
                defeatedAt: now,
              },
            });

            // Award Scar badge
            const scarName = `Scar: Survived the Void of ${task.attribute.name}`;
            const scarCosmetic = await tx.cosmeticItem.upsert({
              where: { name: scarName },
              update: {},
              create: {
                name: scarName,
                type: 'badge',
                description: `Defeated the Shadow haunting your ${task.attribute.name}`,
                price: 0,
                cssClass: `badge-scar-${task.attribute.name.toLowerCase()}`,
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
                equipped: false,
              },
            });

            // Grant 48h XP boost
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
              data: { sealProgress: newProgress },
            });
            shadowInteraction = 'progressed';
          }
        } else {
          shadowInteraction = 'stealing';
        }
      }

      // Compute streak
      const newStreak = computeStreak(
        task.attribute.streak,
        task.attribute.lastActivityAt,
        now
      );

      // Update attribute
      const newXp = task.attribute.xp + xpGained;
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
          xpAwarded: xpGained,
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

      return {
        task: updatedTask,
        xpGained,
        gritGained,
        stolenXp,
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
