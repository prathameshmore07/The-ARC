// ═══════════════════════════════════════════════════════════════
// THE ARC — Adaptive Arc Progression & Calibration Engine
// Evaluates player history to recommend "YOUR NEXT ARC"
// Server remains authoritative over XP, Marks, and Completion
// ═══════════════════════════════════════════════════════════════

import {
  type ArcAttributeKey,
  type QuestArchetype,
  type QuestDifficulty,
  calculateQuestReward,
} from './game-engine.ts';
import {
  type InitialQuestSpec,
  type ArcPath,
  normalizeArchetype,
  normalizeDifficulty,
  normalizeAttribute,
} from './gemini-strategist.ts';

export interface UserProgressionHistory {
  userId: string;
  originalGoal: {
    becoming: string;
    why: string;
    direction: string;
    primaryPath: ArcPath;
  };
  dailyMinutes: number;
  attributes: Array<{
    name: string;
    xp: number;
    level: number;
    streak: number;
    decayStatus?: string;
  }>;
  completedQuests: Array<{
    title: string;
    archetype?: string;
    attributeName?: string;
    completedAt: string;
  }>;
  totalCompletions: number;
}

export interface AdaptiveArcRecommendation {
  focusArea: string;
  focusAttribute: ArcAttributeKey;
  difficultyAdjustment: 'MAINTAIN' | 'INCREASE' | 'EASE';
  strategicObservation: string;
  nextMilestone: {
    title: string;
    target: number;
    measurement: string;
  };
  recommendedQuests: InitialQuestSpec[];
}

/**
 * Heuristic/Deterministic Fallback for Adaptive Arc Evaluation
 */
export function generateDeterministicAdaptiveArc(
  history: UserProgressionHistory
): AdaptiveArcRecommendation {
  // Identify weakest or decaying attribute
  const attrScores = (history.attributes || []).map((a) => {
    const isDecaying = a.decayStatus === 'decaying' || a.decayStatus === 'vulnerable';
    return {
      name: a.name.toUpperCase(),
      score: a.xp + (isDecaying ? -100 : 0),
      raw: a,
    };
  });

  attrScores.sort((a, b) => a.score - b.score);
  const lowest = attrScores[0]?.name || 'BODY';
  const focusAttr: ArcAttributeKey = normalizeAttribute(lowest);

  const streak = Math.max(...(history.attributes || []).map((a) => a.streak || 0), 0);
  const diffAdjustment: 'MAINTAIN' | 'INCREASE' | 'EASE' =
    streak >= 5 ? 'INCREASE' : history.totalCompletions < 3 ? 'EASE' : 'MAINTAIN';

  const defaultDiff: QuestDifficulty = diffAdjustment === 'INCREASE' ? 'III' : 'II';

  const recommendedQuests: InitialQuestSpec[] = [
    {
      id: 'quest-adapt-01',
      code: 'A10',
      title: `${Math.min(history.dailyMinutes || 30, 45)} MIN FOCUSED DEEP SURGE`,
      archetype: 'FOCUS',
      attribute: focusAttr,
      difficulty: defaultDiff,
      targetType: 'FOCUS',
      targetValue: Math.min(history.dailyMinutes || 30, 45),
      unit: 'MIN',
      description: `Sustain unbroken focus dedicated to reinforcing your ${focusAttr.toLowerCase()} domain.`,
      whyItMatters: 'Targeting your lowest attribute prevents entropy from corrupting your overall Arc.',
      durationMinutes: Math.min(history.dailyMinutes || 30, 45),
      rewards: calculateQuestReward(defaultDiff),
    },
    {
      id: 'quest-adapt-02',
      code: 'A20',
      title: focusAttr === 'BODY'
        ? 'ENDURANCE PACING — 3.5 KM'
        : focusAttr === 'MIND'
        ? 'DENSE DISCIPLINE — 25 PAGES'
        : focusAttr === 'CRAFT'
        ? 'SHIP REFACTOR ARTIFACT'
        : 'ACTIVE ALLIANCE DIALOGUE',
      archetype: focusAttr === 'BODY' ? 'DISTANCE' : focusAttr === 'MIND' ? 'COUNT' : focusAttr === 'CRAFT' ? 'BUILD' : 'ACTION',
      attribute: focusAttr,
      difficulty: 'II',
      targetType: focusAttr === 'BODY' ? 'DISTANCE' : focusAttr === 'MIND' ? 'COUNT' : focusAttr === 'CRAFT' ? 'BUILD' : 'ACTION',
      targetValue: focusAttr === 'BODY' ? 3.5 : focusAttr === 'MIND' ? 25 : focusAttr === 'CRAFT' ? 3 : 1,
      unit: focusAttr === 'BODY' ? 'KM' : focusAttr === 'MIND' ? 'Pages' : focusAttr === 'CRAFT' ? 'Checkpoints' : 'Action',
      description: `Complete verified volume in the ${focusAttr.toLowerCase()} domain.`,
      whyItMatters: 'Tactile output grounds ambition into unshakeable evidence.',
      durationMinutes: 30,
      rewards: calculateQuestReward('II'),
      checkpoints: focusAttr === 'CRAFT' ? ['Clarify target fix', 'Implement changes', 'Run tests and ship'] : undefined,
      actionPrompt: focusAttr === 'PEOPLE' ? 'Who did you contact and what truth did you exchange?' : undefined,
    },
  ];

  return {
    focusArea: `Reinforcing ${focusAttr}`,
    focusAttribute: focusAttr,
    difficultyAdjustment: diffAdjustment,
    strategicObservation: `Your ${focusAttr.toLowerCase()} attribute has the highest leverage for resistance against entropy.`,
    nextMilestone: {
      title: `${history.totalCompletions + 5} Verified Missions`,
      target: history.totalCompletions + 5,
      measurement: 'Completions',
    },
    recommendedQuests,
  };
}

/**
 * Server-Side Adaptive Arc Evaluator using Gemini
 */
export async function evaluateAdaptiveArc(
  history: UserProgressionHistory
): Promise<AdaptiveArcRecommendation> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'placeholder' || apiKey.trim() === '') {
    return generateDeterministicAdaptiveArc(history);
  }

  const prompt = `
You are the personal ARC STRATEGIST in "THE ARC" — an RPG Life System.
Evaluate this user's progression history against their original goal:

ORIGINAL GOAL:
- Identity: "${history.originalGoal.becoming}"
- Why: "${history.originalGoal.why}"
- Direction: "${history.originalGoal.direction}"
- Primary Path: ${history.originalGoal.primaryPath}
- Daily Commitment: ${history.dailyMinutes} min/day

CURRENT PROGRESSION:
- Total Quests Completed: ${history.totalCompletions}
- Attributes: ${JSON.stringify(history.attributes)}
- Recent Completed Quests: ${JSON.stringify(history.completedQuests.slice(0, 5))}

Recommend "YOUR NEXT ARC":
1. Focus area (which attribute needs attention)
2. Difficulty adjustment ("MAINTAIN", "INCREASE", or "EASE")
3. Strategic observation (short, 1-2 sentences)
4. Next measurable milestone
5. 2-3 recommended quests across natural archetypes (FOCUS, DISTANCE, COUNT, BUILD, ACTION, SKILL).
DO NOT return XP or currency values.

Format as JSON:
{
  "focusArea": string,
  "focusAttribute": "BODY" | "MIND" | "CRAFT" | "PEOPLE",
  "difficultyAdjustment": "MAINTAIN" | "INCREASE" | "EASE",
  "strategicObservation": string,
  "nextMilestone": { "title": string, "target": number, "measurement": string },
  "recommendedQuests": [
    {
      "title": string,
      "archetype": "FOCUS" | "DISTANCE" | "COUNT" | "BUILD" | "ACTION" | "SKILL",
      "attribute": "BODY" | "MIND" | "CRAFT" | "PEOPLE",
      "difficulty": "I_LIGHT" | "II_STANDARD" | "III_DEMANDING",
      "targetType": string,
      "targetValue": number,
      "unit": string,
      "description": string,
      "whyItMatters": string
    }
  ]
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    });

    if (!response.ok) {
      return generateDeterministicAdaptiveArc(history);
    }

    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return generateDeterministicAdaptiveArc(history);

    const parsed = JSON.parse(text);
    const focusAttr = normalizeAttribute(parsed.focusAttribute);
    const diffAdj = parsed.difficultyAdjustment === 'INCREASE' || parsed.difficultyAdjustment === 'EASE'
      ? parsed.difficultyAdjustment
      : 'MAINTAIN';

    const recommendedQuests: InitialQuestSpec[] = (parsed.recommendedQuests || []).map((q: any, i: number) => {
      const arch = normalizeArchetype(q.archetype);
      const diff = normalizeDifficulty(q.difficulty);
      const attr = normalizeAttribute(q.attribute, history.originalGoal.primaryPath);
      return {
        id: `quest-adapt-0${i + 1}`,
        code: `A0${i + 1}`,
        title: typeof q.title === 'string' ? q.title.toUpperCase() : 'NEXT ARC MISSION',
        archetype: arch,
        attribute: attr,
        difficulty: diff,
        targetType: arch,
        targetValue: typeof q.targetValue === 'number' ? q.targetValue : 1,
        unit: typeof q.unit === 'string' ? q.unit : 'Units',
        description: typeof q.description === 'string' ? q.description : 'Execute next sovereign standard.',
        whyItMatters: typeof q.whyItMatters === 'string' ? q.whyItMatters : 'Compounding consistency.',
        durationMinutes: arch === 'FOCUS' ? (typeof q.targetValue === 'number' ? q.targetValue : 30) : 30,
        rewards: calculateQuestReward(diff),
      };
    });

    return {
      focusArea: typeof parsed.focusArea === 'string' ? parsed.focusArea : `Reinforce ${focusAttr}`,
      focusAttribute: focusAttr,
      difficultyAdjustment: diffAdj,
      strategicObservation: typeof parsed.strategicObservation === 'string' ? parsed.strategicObservation : 'Focus your next moves where resistance is highest.',
      nextMilestone: {
        title: parsed.nextMilestone?.title || 'Next Sovereign Checkpoint',
        target: parsed.nextMilestone?.target || history.totalCompletions + 5,
        measurement: parsed.nextMilestone?.measurement || 'Completions',
      },
      recommendedQuests: recommendedQuests.length > 0 ? recommendedQuests : generateDeterministicAdaptiveArc(history).recommendedQuests,
    };
  } catch (err) {
    console.warn('Adaptive arc evaluation error:', err);
    return generateDeterministicAdaptiveArc(history);
  }
}
