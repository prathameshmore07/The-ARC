import { NextResponse } from 'next/server';
import { getAuthUser, getSupabaseAdmin } from '@/lib/supabase-server';
import { evaluateAdaptiveArc, UserProgressionHistory } from '@/lib/adaptive-arc';
import { getDecayStatus } from '@/lib/game-engine';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const originalGoal = body.originalGoal || {
      becoming: user.user_metadata?.name || 'THE SOVEREIGN ARTISAN',
      why: 'To resist entropy and build lasting capability.',
      direction: 'Relentless execution in your sovereign craft.',
      primaryPath: 'ARTISAN' as const,
    };

    const supabase = getSupabaseAdmin();

    const [attrRes, compRes] = await Promise.all([
      supabase.from('Attribute').select('*').eq('userId', user.id),
      supabase
        .from('CompletionLog')
        .select('*, task:Task(title)')
        .eq('userId', user.id)
        .order('completedAt', { ascending: false })
        .limit(10),
    ]);

    const rawAttributes = attrRes.data || [];
    const rawCompletions = compRes.data || [];

    const attributes = rawAttributes.map((a: any) => ({
      name: a.name,
      xp: a.xp,
      level: a.level,
      streak: a.streak,
      decayStatus: getDecayStatus(new Date(a.lastActivityAt)),
    }));

    const completedQuests = rawCompletions.map((c: any) => ({
      title: c.task?.title || 'Completed Quest',
      completedAt: c.completedAt ? new Date(c.completedAt).toISOString() : new Date().toISOString(),
    }));

    const totalCompletions = rawCompletions.length;

    const history: UserProgressionHistory = {
      userId: user.id,
      originalGoal,
      dailyMinutes: body.dailyMinutes || 30,
      attributes,
      completedQuests,
      totalCompletions,
    };

    const recommendation = await evaluateAdaptiveArc(history);

    return NextResponse.json({
      success: true,
      recommendation,
    });
  } catch (error) {
    console.error('Error in POST /api/arc/evaluate:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate adaptive arc' },
      { status: 500 }
    );
  }
}
