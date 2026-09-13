import { NextResponse } from 'next/server';
import { getAuthUser, getSupabaseAdmin } from '@/lib/supabase-server';
import {
  computeDecay,
  computeStepsNeeded,
  computeBaselineWeeklyRate,
  computeShadowHp,
} from '@/lib/game-engine';

export async function POST(request: Request) {
  try {
    // DEMO_MODE gate — 403 if not enabled or in production without demo flag
    const isDemo = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'development';
    if (!isDemo) {
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

    const supabase = getSupabaseAdmin();

    // Step 1: Set user's attributes lastActivityAt to simulated past
    await supabase
      .from('Attribute')
      .update({ lastActivityAt: simulatedLastActivity.toISOString() })
      .eq('userId', user.id);

    // Step 2: Run decay logic for this user's attributes
    const { data: attributes } = await supabase
      .from('Attribute')
      .select('*')
      .eq('userId', user.id);

    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const results = [];

    for (const attr of (attributes || [])) {
      const { newXp, overdueDays } = computeDecay(
        attr.xp,
        new Date(attr.lastActivityAt),
        now
      );

      await supabase
        .from('Attribute')
        .update({ xp: newXp })
        .eq('id', attr.id);

      // Query historical completions for memory calculation
      const { count: completionsCount } = await supabase
        .from('CompletionLog')
        .select('*', { count: 'exact', head: true })
        .eq('userId', user.id)
        .gte('completedAt', fourteenDaysAgo.toISOString());

      // If user is testing with zero past completions, seed a realistic 3.5x/wk benchmark
      const baselineWeeklyRate = (completionsCount && completionsCount > 0)
        ? computeBaselineWeeklyRate(completionsCount)
        : 3.5;

      const computedHp = computeShadowHp(baselineWeeklyRate, overdueDays);

      // Shadow spawn / growth
      const { data: activeShadow } = await supabase
        .from('ShadowEntity')
        .select('*')
        .eq('attributeId', attr.id)
        .eq('userId', user.id)
        .is('defeatedAt', null)
        .maybeSingle();

      if (!activeShadow && overdueDays > 0) {
        await supabase.from('ShadowEntity').insert({
          userId: user.id,
          attributeId: attr.id,
          hp: computedHp,
          baselineWeeklyRate,
          stepsNeeded: computeStepsNeeded(computedHp),
        });
      } else if (activeShadow && overdueDays > 0) {
        const newHp = Math.max(activeShadow.hp, computedHp);
        await supabase
          .from('ShadowEntity')
          .update({
            hp: newHp,
            baselineWeeklyRate,
            stepsNeeded: computeStepsNeeded(newHp),
          })
          .eq('id', activeShadow.id);
      }

      results.push({
        name: attr.name,
        oldXp: attr.xp,
        newXp,
        overdueDays,
        hp: computedHp,
        baselineWeeklyRate,
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
