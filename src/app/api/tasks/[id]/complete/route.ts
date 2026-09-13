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
    const {
      archetype = 'FOCUS',
      focusSessionId,
      elapsedDurationSec,
      targetDurationSec,
      durationMinutes,
      distanceValue,
      targetDistance,
      countValue,
      targetCount,
      completedCheckpoints,
      requiredCheckpoints,
      confirmed,
      skillOutput,
      targetValue,
    } = body;

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

    // ── Server-Side Validation for Each Archetype ───────────────
    if (archetype === 'FOCUS') {
      // FOCUS: server validated session or elapsed duration
      let sessionValidated = false;
      if (focusSessionId) {
        const session = await prisma.focusSession.findUnique({
          where: { id: focusSessionId },
        });
        if (session && session.userId === user.id) {
          const v = validateFocusSession(session.heartbeatCount);
          sessionValidated = v.validated;
        }
      }

      if (!sessionValidated) {
        const targetSec =
          typeof targetDurationSec === 'number' && targetDurationSec > 0
            ? targetDurationSec
            : typeof durationMinutes === 'number' && durationMinutes > 0
            ? durationMinutes * 60
            : 0;
        const elapsed = typeof elapsedDurationSec === 'number' ? elapsedDurationSec : 0;

        // Timer integrity check: if stopped early, reject completion without penalty
        if (targetSec > 0 && elapsed < Math.max(30, targetSec - 5)) {
          const completedMin = Math.floor(elapsed / 60);
          const remainingMin = Math.max(1, Math.ceil((targetSec - elapsed) / 60));
          return NextResponse.json(
            {
              error: `${completedMin} MIN COMPLETED · ${remainingMin} MIN REMAINING · [ CONTINUE QUEST ]`,
              integrityFailed: true,
              completedMin,
              remainingMin,
            },
            { status: 400 }
          );
        }

        if (elapsed === 0 && !focusSessionId) {
          return NextResponse.json(
            { error: 'Focus quest requires active execution duration or verified session.' },
            { status: 400 }
          );
        }
      }
    } else if (archetype === 'DISTANCE') {
      // DISTANCE: distanceValue >= targetValue
      const requiredDist = targetDistance ?? targetValue ?? 1.0;
      if (typeof distanceValue !== 'number' || distanceValue < requiredDist) {
        return NextResponse.json(
          {
            error: `Distance verification failed: ${distanceValue ?? 0} / ${requiredDist} KM completed.`,
          },
          { status: 400 }
        );
      }
    } else if (archetype === 'COUNT') {
      // COUNT: countValue >= targetValue
      const requiredCnt = targetCount ?? targetValue ?? 1;
      if (typeof countValue !== 'number' || countValue < requiredCnt) {
        return NextResponse.json(
          {
            error: `Count verification failed: ${countValue ?? 0} / ${requiredCnt} completed.`,
          },
          { status: 400 }
        );
      }
    } else if (archetype === 'BUILD') {
      // BUILD: completedCheckpoints.length >= requiredCheckpoints
      const requiredCP = requiredCheckpoints ?? targetValue ?? 1;
      const completedLen = Array.isArray(completedCheckpoints)
        ? completedCheckpoints.length
        : 0;
      if (completedLen < requiredCP) {
        return NextResponse.json(
          {
            error: `Build checkpoints incomplete: ${completedLen} / ${requiredCP} completed.`,
          },
          { status: 400 }
        );
      }
    } else if (archetype === 'ACTION') {
      // ACTION: confirmed === true
      if (confirmed !== true) {
        return NextResponse.json(
          { error: 'Action confirmation required.' },
          { status: 400 }
        );
      }
    } else if (archetype === 'SKILL') {
      // SKILL: output provided
      if (typeof skillOutput !== 'string' || !skillOutput.trim()) {
        return NextResponse.json(
          { error: 'Skill practice output log is required.' },
          { status: 400 }
        );
      }
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      let focusVerified = false;
      let computedDurationSec: number | null = null;

      // Validate session or archetype verified work
      if (archetype === 'FOCUS') {
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
        } else if (typeof elapsedDurationSec === 'number') {
          focusVerified = true;
          computedDurationSec = elapsedDurationSec;
        }
      } else {
        // Non-FOCUS archetypes are execution-verified through their dedicated arenas
        focusVerified = true;
        computedDurationSec =
          typeof elapsedDurationSec === 'number' && elapsedDurationSec > 0
            ? elapsedDurationSec
            : typeof durationMinutes === 'number' && durationMinutes > 0
            ? durationMinutes * 60
            : 1800;
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

      // Award grit (Marks)
      const updatedUser = await tx.user.update({
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

      // Transparent reconciliation payload
      return {
        task: updatedTask,
        archetype,
        earned: earnedXp,
        stolen: stolenXp,
        secured: securedXp,
        reclaimed: reclaimedXp,
        gritGained,
        marksAwarded: gritGained,
        momentumAwarded: Math.max(4, Math.round(earnedXp * 0.4)),
        xpAwarded: totalXpAdded,
        newXp,
        newLevel,
        oldLevel,
        leveledUp,
        newStreak,
        newGrit: updatedUser.grit,
        marks: updatedUser.grit,
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
