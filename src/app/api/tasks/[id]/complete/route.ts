import { NextResponse } from 'next/server';
import { getAuthUser, getSupabaseAdmin } from '@/lib/supabase-server';
import {
  computeRewards,
  applyShadowSteal,
  computeStreak,
  computeLevel,
  validateFocusSession,
  computeReclaimedXp,
  inferQuestArchetype,
  type QuestArchetype,
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
    const supabase = getSupabaseAdmin();

    const { data: task } = await supabase
      .from('Task')
      .select('*, attribute:Attribute(*)')
      .eq('id', taskId)
      .maybeSingle();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (task.status === 'done') {
      return NextResponse.json(
        {
          error: 'ACTION_REJECTED',
          reason: 'This quest has already been inscribed into the sovereign ledger. Double progression is prohibited.',
          integrityFailed: true,
        },
        { status: 400 }
      );
    }

    // Resolve true archetype (never force a countdown timer on non-focus tasks)
    const archetype: QuestArchetype = body.archetype && body.archetype !== 'FOCUS'
      ? body.archetype
      : inferQuestArchetype(task.title, body.archetype || 'ACTION');

    const {
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

    // ── Server-Side Validation for Each Archetype ───────────────
    if (archetype === 'FOCUS') {
      // FOCUS: server validated session or elapsed duration
      let sessionValidated = false;
      if (focusSessionId) {
        const { data: session } = await supabase
          .from('FocusSession')
          .select('*')
          .eq('id', focusSessionId)
          .maybeSingle();
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
              error: 'ACTION_REJECTED',
              reason: `${completedMin} MIN COMPLETED · ${remainingMin} MIN REMAINING · FOCUS INTEGRITY UNFULFILLED`,
              integrityFailed: true,
              completedMin,
              remainingMin,
            },
            { status: 400 }
          );
        }

        if (elapsed === 0 && !focusSessionId) {
          return NextResponse.json(
            {
              error: 'ACTION_REJECTED',
              reason: 'Focus quest requires active execution duration or verified session.',
              integrityFailed: true,
            },
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
            error: 'ACTION_REJECTED',
            reason: `Distance verification failed: ${distanceValue ?? 0} / ${requiredDist} KM completed.`,
            integrityFailed: true,
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
            error: 'ACTION_REJECTED',
            reason: `Count verification failed: ${countValue ?? 0} / ${requiredCnt} completed.`,
            integrityFailed: true,
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
            error: 'ACTION_REJECTED',
            reason: `Build checkpoints incomplete: ${completedLen} / ${requiredCP} completed.`,
            integrityFailed: true,
          },
          { status: 400 }
        );
      }
    } else if (archetype === 'ACTION') {
      // ACTION: confirmed === true
      if (confirmed !== true) {
        return NextResponse.json(
          {
            error: 'ACTION_REJECTED',
            reason: 'Deliberate confirmation hold required for real-world action.',
            integrityFailed: true,
          },
          { status: 400 }
        );
      }
    } else if (archetype === 'SKILL') {
      // SKILL: output provided
      if (typeof skillOutput !== 'string' || !skillOutput.trim()) {
        return NextResponse.json(
          {
            error: 'ACTION_REJECTED',
            reason: 'Skill practice output log is required.',
            integrityFailed: true,
          },
          { status: 400 }
        );
      }
    }

    const now = new Date();

    // Re-check task status to prevent race conditions
    const { data: freshTask } = await supabase
      .from('Task')
      .select('status')
      .eq('id', taskId)
      .maybeSingle();

    if (!freshTask || freshTask.status === 'done') {
      throw new Error('ALREADY_COMPLETED');
    }

    let focusVerified = false;
    let computedDurationSec: number | null = null;

    // Validate session or archetype verified work
    if (archetype === 'FOCUS') {
      if (focusSessionId) {
        const { data: session } = await supabase
          .from('FocusSession')
          .select('*')
          .eq('id', focusSessionId)
          .maybeSingle();

        if (session && session.userId === user.id && !session.endedAt) {
          const validation = validateFocusSession(session.heartbeatCount);
          focusVerified = validation.validated;
          computedDurationSec = validation.computedDurationSec;

          await supabase.from('FocusSession').update({
            endedAt: now.toISOString(),
            validated: focusVerified,
            computedDurationSec,
          }).eq('id', focusSessionId);
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
      new Date(task.attribute.xpBoostUntil) > now
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
    const { data: activeShadow } = await supabase
      .from('ShadowEntity')
      .select('*')
      .eq('attributeId', task.attributeId)
      .eq('userId', user.id)
      .is('defeatedAt', null)
      .maybeSingle();

    let shadowInteraction: string | null = null;
    let shadowDefeated = false;
    let stolenXp = 0;
    let reclaimedXp = 0;
    let xpBoostUntil: string | null = null;

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

          await supabase.from('ShadowEntity').update({
            sealProgress: newProgress,
            stolenXpPool: newStolenPool,
            defeatedAt: now.toISOString(),
          }).eq('id', activeShadow.id);

          // Award Scar badge
          const scarName = `Scar of ${task.attribute.name}`;
          const { data: existingScar } = await supabase
            .from('CosmeticItem')
            .select('id')
            .eq('name', scarName)
            .maybeSingle();

          let scarId = existingScar?.id;
          if (!scarId) {
            const { data: newScar } = await supabase.from('CosmeticItem').insert({
              name: scarName,
              type: 'badge',
              description: `Permanent testament: Banished the Shadow haunting your ${task.attribute.name}.`,
              price: 0,
              cssClass: 'badge-scar',
            }).select('id').single();
            scarId = newScar?.id;
          }

          if (scarId) {
            const { data: existingUserCosm } = await supabase
              .from('UserCosmetic')
              .select('id')
              .eq('userId', user.id)
              .eq('itemId', scarId)
              .maybeSingle();

            if (!existingUserCosm) {
              await supabase.from('UserCosmetic').insert({
                userId: user.id,
                itemId: scarId,
                equipped: true,
              });
            }
          }

          // Grant 48h XP boost (+10% resolve)
          xpBoostUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
          shadowInteraction = 'defeated';
        } else {
          await supabase.from('ShadowEntity').update({
            sealProgress: newProgress,
            stolenXpPool: newStolenPool,
          }).eq('id', activeShadow.id);
          shadowInteraction = 'progressed';
        }
      } else {
        // Quick checkbox completion: Shadow steals, no progress on banish seal
        await supabase.from('ShadowEntity').update({
          stolenXpPool: newStolenPool,
        }).eq('id', activeShadow.id);
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

    const attributeUpdateData: any = {
      xp: newXp,
      level: newLevel,
      streak: newStreak,
      lastActivityAt: now.toISOString(),
    };
    if (xpBoostUntil) {
      attributeUpdateData.xpBoostUntil = xpBoostUntil;
    }

    await supabase.from('Attribute').update(attributeUpdateData).eq('id', task.attributeId);

    // Award grit (Marks)
    const { data: dbUser } = await supabase.from('User').select('grit').eq('id', user.id).maybeSingle();
    const newGrit = (dbUser?.grit || 0) + gritGained;
    await supabase.from('User').update({ grit: newGrit }).eq('id', user.id);

    // Create immutable completion log
    await supabase.from('CompletionLog').insert({
      userId: user.id,
      taskId: task.id,
      xpAwarded: totalXpAdded,
      gritAwarded: gritGained,
      focusVerified,
      completedAt: now.toISOString(),
    });

    // Mark task as done
    const { data: updatedTask } = await supabase
      .from('Task')
      .update({ status: 'done' })
      .eq('id', task.id)
      .select()
      .single();

    // Check total completions for milestone & badge unlocks
    const { count: completionCount } = await supabase
      .from('CompletionLog')
      .select('*', { count: 'exact', head: true })
      .eq('userId', user.id);

    const totalCompletions = completionCount || 0;

    let milestoneReached: { title: string; category: string; description: string } | null = null;
    let unlockedBadge: { name: string; type: string; image: string; description: string } | null = null;

    if (totalCompletions === 1) {
      milestoneReached = {
        title: 'FIRST QUEST COMPLETED',
        category: 'ORIGIN',
        description: 'The first permanent mark upon your Sovereign Chronicle.',
      };
      unlockedBadge = {
        name: 'CELESTIAL COMPASS',
        type: 'insignia',
        image: '/images/armory/badge_celestial_compass.jpg',
        description: 'Awarded for taking your first verified sovereign action in THE ARC.',
      };
    } else if (totalCompletions === 10) {
      milestoneReached = {
        title: '10 QUESTS COMPLETE',
        category: 'CADENCE',
        description: 'The Arc strengthens. Momentum solidifies.',
      };
      unlockedBadge = {
        name: 'THE BUILDER',
        type: 'badge',
        image: '/images/armory/badge_the_builder.jpg',
        description: 'Forged through 10 verified sovereign completions.',
      };
    } else if (totalCompletions === 25) {
      milestoneReached = {
        title: '25 QUESTS FULFILLED',
        category: 'MASTERY',
        description: 'A quarter-century of sovereign real-world actions.',
      };
      unlockedBadge = {
        name: 'THE SHIPPER',
        type: 'badge',
        image: '/images/armory/badge_the_shipper.jpg',
        description: 'Proof of continuous delivery in the physical world.',
      };
    } else if (newStreak === 7) {
      milestoneReached = {
        title: '7-DAY STREAK',
        category: 'MOMENTUM',
        description: 'One full week of unbroken allegiance against entropy.',
      };
      unlockedBadge = {
        name: 'AEGIS RESOLVE',
        type: 'badge',
        image: '/images/armory/badge_aegis_resolve.jpg',
        description: 'Bestowed upon those who sustain 7 consecutive days of discipline.',
      };
    } else if (shadowDefeated) {
      milestoneReached = {
        title: 'SHADOW BANISHED',
        category: 'VICTORY',
        description: 'A parasitic entity was successfully confronted and banished.',
      };
    }

    // Transparent reconciliation payload
    const result = {
      task: updatedTask || { id: task.id, status: 'done' },
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
      newGrit,
      marks: newGrit,
      focusVerified,
      shadowInteraction,
      shadowDefeated,
      attributeName: task.attribute.name,
      milestoneReached,
      unlockedBadge,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Complete task error:', error);
    if (error instanceof Error && error.message === 'ALREADY_COMPLETED') {
      return NextResponse.json(
        {
          error: 'ACTION_REJECTED',
          reason: 'This quest was already completed by a concurrent request. No duplicate progression awarded.',
          integrityFailed: true,
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
