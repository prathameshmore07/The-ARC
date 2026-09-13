import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
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

    const supabase = getSupabaseAdmin();
    const now = new Date();
    const graceThreshold = new Date(
      now.getTime() - DECAY_GRACE_HOURS * 60 * 60 * 1000
    );

    // Find all attributes past the grace period
    const { data: staleAttributes } = await supabase
      .from('Attribute')
      .select('*')
      .lt('lastActivityAt', graceThreshold.toISOString());

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

    for (const attr of (staleAttributes || [])) {
      // Compute decay
      const { newXp, overdueDays } = computeDecay(
        attr.xp,
        new Date(attr.lastActivityAt),
        now
      );

      // Update attribute XP
      await supabase
        .from('Attribute')
        .update({ xp: newXp })
        .eq('id', attr.id);

      // Query historical completions in trailing 14 days to compute habit baseline
      const { count: completionsCount } = await supabase
        .from('CompletionLog')
        .select('*', { count: 'exact', head: true })
        .eq('userId', attr.userId)
        .gte('completedAt', fourteenDaysAgo.toISOString());

      const baselineWeeklyRate = computeBaselineWeeklyRate(completionsCount || 0);
      const computedHp = computeShadowHp(baselineWeeklyRate, overdueDays);

      // Shadow spawn / growth
      const { data: activeShadow } = await supabase
        .from('ShadowEntity')
        .select('*')
        .eq('attributeId', attr.id)
        .eq('userId', attr.userId)
        .is('defeatedAt', null)
        .maybeSingle();

      let shadowAction: string;

      if (!activeShadow) {
        await supabase.from('ShadowEntity').insert({
          userId: attr.userId,
          attributeId: attr.id,
          hp: computedHp,
          baselineWeeklyRate,
          stepsNeeded: computeStepsNeeded(computedHp),
        });
        shadowAction = 'spawned';
      } else {
        const newHp = Math.max(activeShadow.hp, computedHp);
        await supabase
          .from('ShadowEntity')
          .update({
            hp: newHp,
            baselineWeeklyRate,
            stepsNeeded: computeStepsNeeded(newHp),
          })
          .eq('id', activeShadow.id);
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
    const { data: users } = await supabase
      .from('User')
      .select('id, attributes:Attribute(xp)');

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    for (const u of (users || [])) {
      const attrs = (u as any).attributes || [];
      const totalXp = attrs.reduce((sum: number, a: any) => sum + (a.xp || 0), 0);

      await supabase
        .from('DailySnapshot')
        .upsert(
          {
            userId: u.id,
            date: today.toISOString(),
            totalXp,
          },
          { onConflict: 'userId,date' }
        );
    }

    return NextResponse.json({
      success: true,
      processedAttributes: processedCount,
      usersSnapshotted: users?.length || 0,
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
