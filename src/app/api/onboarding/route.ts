import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/supabase-server';
import { synthesizeArcPlanWithGemini, OnboardingAnswers, ArcPersonalPlan } from '@/lib/gemini-strategist';

/**
 * GET /api/onboarding
 * Checks if the current authenticated user has completed onboarding.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has tasks or completions
    const [taskCount, completionCount] = await Promise.all([
      prisma.task.count({ where: { userId: user.id } }).catch(() => 0),
      prisma.completionLog.count({ where: { userId: user.id } }).catch(() => 0),
    ]);

    const completed = taskCount > 0 || completionCount > 0;

    return NextResponse.json({
      completed,
      userId: user.id,
      taskCount,
    });
  } catch (error) {
    console.error('Error in GET /api/onboarding:', error);
    return NextResponse.json({ completed: false }, { status: 200 });
  }
}

/**
 * POST /api/onboarding
 * Receives the 4 narrative answers, calls the Gemini Personal Arc Strategist,
 * applies deterministic server-authoritative reward calculations,
 * and idempotently creates the user's initial tasks in the database.
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { q1Become, q2Why, q3How, q4Time } = body as Partial<OnboardingAnswers>;

    if (!q1Become?.trim() || !q2Why?.trim() || !q3How?.trim() || !q4Time?.trim()) {
      return NextResponse.json(
        { error: 'All 4 narrative answers are required.' },
        { status: 400 }
      );
    }

    const answers: OnboardingAnswers = {
      q1Become: q1Become.trim(),
      q2Why: q2Why.trim(),
      q3How: q3How.trim(),
      q4Time: q4Time.trim(),
    };

    // Synthesize plan with Gemini Strategist (server-side, sanitized against unauthorized reward values)
    const plan: ArcPersonalPlan = await synthesizeArcPlanWithGemini(answers);

    // Persist starter quests idempotently in the database
    let userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      include: { attributes: true, tasks: true },
    }).catch(() => null);

    if (!userRecord) {
      try {
        userRecord = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email || 'user@thearc.dev',
            name: plan.identity.sovereignTitle,
            attributes: {
              create: [
                { name: 'CRAFT', xp: 50 },
                { name: 'BODY', xp: 50 },
                { name: 'MIND', xp: 50 },
                { name: 'PEOPLE', xp: 50 },
              ],
            },
          },
          include: { attributes: true, tasks: true },
        });
      } catch {
        userRecord = await prisma.user.findUnique({
          where: { id: user.id },
          include: { attributes: true, tasks: true },
        }).catch(() => null);
      }
    } else {
      // Update name to sovereign title if not set
      if (!userRecord.name || userRecord.name.includes('user')) {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: plan.identity.sovereignTitle },
        }).catch(() => {});
      }
    }

    if (userRecord && userRecord.tasks.length === 0 && userRecord.attributes.length > 0) {
      const attrMap: Record<string, string> = {};
      userRecord.attributes.forEach((attr) => {
        const upper = attr.name.toUpperCase();
        if (upper.includes('CRAFT') || upper.includes('CREATIV')) attrMap.CRAFT = attr.id;
        else if (upper.includes('BODY') || upper.includes('STRENGTH')) attrMap.BODY = attr.id;
        else if (upper.includes('MIND') || upper.includes('INTELLECT')) attrMap.MIND = attr.id;
        else if (upper.includes('PEOPLE') || upper.includes('DISCIPLINE') || upper.includes('SOCIAL')) attrMap.PEOPLE = attr.id;
      });

      const fallbackAttrId = userRecord.attributes[0].id;

      // Create starter tasks in database
      for (const quest of plan.initialQuests) {
        const targetAttrId = attrMap[quest.attribute] || fallbackAttrId;
        await prisma.task.create({
          data: {
            title: quest.title,
            attributeId: targetAttrId,
            userId: user.id,
          },
        }).catch(() => {});
      }
    }

    // Build compatibility profile format for any existing views
    const profileCompat = {
      identity: plan.identity.sovereignTitle,
      whyItMatters: plan.identity.why,
      direction: plan.identity.direction,
      primaryPath: plan.paths.primary,
      secondaryPaths: plan.paths.secondary,
      commitment: `${plan.commitment.minutesPerDay} MIN / DAY`,
      dailyMinutes: plan.commitment.minutesPerDay,
      growthAreas: plan.evaluation.growthAreas,
      meaningfulMilestones: plan.milestones.map((m) => `${m.title}: ${m.description}`),
      firstQuests: plan.initialQuests.map((q) => ({
        id: q.id || 'quest-01',
        code: q.code || '010',
        title: q.title,
        archetype: q.archetype,
        difficulty: q.difficulty,
        attribute: q.attribute,
        objective: q.description,
        whyItMatters: q.whyItMatters,
        target: `${q.targetValue} ${q.unit}`,
        targetValue: q.targetValue,
        unit: q.unit,
        durationMinutes: q.durationMinutes || 30,
        rewards: q.rewards || { xp: 35, momentum: 10, marks: 15, attr: 10 },
        checkpoints: q.checkpoints,
        actionPrompt: q.actionPrompt,
        skillPrompt: q.skillPrompt,
      })),
      attributeDistribution: {
        CRAFT: plan.paths.primary === 'ARTISAN' ? 80 : 50,
        BODY: plan.paths.primary === 'WARRIOR' ? 80 : 50,
        MIND: plan.paths.primary === 'SCHOLAR' ? 80 : 50,
        PEOPLE: plan.paths.primary === 'SOCIAL' ? 80 : 50,
      },
    };

    return NextResponse.json({
      success: true,
      plan,
      profile: profileCompat,
    });
  } catch (error) {
    console.error('Error in POST /api/onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize Arc plan. Please retry.' },
      { status: 500 }
    );
  }
}
