import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/supabase-server';
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

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        attributes: true,
        completions: {
          orderBy: { completedAt: 'desc' },
          take: 10,
          include: { task: true },
        },
      },
    });

    const attributes = (userData?.attributes || []).map((a) => ({
      name: a.name,
      xp: a.xp,
      level: a.level,
      streak: a.streak,
      decayStatus: getDecayStatus(a.lastActivityAt),
    }));

    const completedQuests = (userData?.completions || []).map((c) => ({
      title: c.task?.title || 'Completed Quest',
      completedAt: c.completedAt.toISOString(),
    }));

    const totalCompletions = userData?.completions.length || 0;

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
