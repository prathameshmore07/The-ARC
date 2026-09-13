// ═══════════════════════════════════════════════════════════════
// THE ARC — Gemini Personal Arc Strategist Engine
// Server-Side Understanding, Evaluation, and Planning
// Progression, XP, Marks, and Integrity remain SERVER-AUTHORITATIVE
// ═══════════════════════════════════════════════════════════════

import {
  type ArcAttributeKey,
  type QuestArchetype,
  type QuestDifficulty,
  calculateQuestReward,
} from './game-engine.ts';

export type ArcPath = 'ARTISAN' | 'WARRIOR' | 'SCHOLAR' | 'SOCIAL';

export interface OnboardingAnswers {
  q1Become: string;
  q2Why: string;
  q3How: string;
  q4Time: string;
}

export interface InitialQuestSpec {
  id?: string;
  code?: string;
  title: string;
  archetype: QuestArchetype;
  attribute: ArcAttributeKey;
  difficulty: QuestDifficulty;
  targetType: string;
  targetValue: number;
  unit: string;
  description: string;
  whyItMatters: string;
  checkpoints?: string[];
  actionPrompt?: string;
  skillPrompt?: string;
  durationMinutes?: number;
  // Server-authoritative rewards calculated strictly by deterministic game engine
  rewards?: {
    xp: number;
    momentum: number;
    marks: number;
    attr: number;
  };
}

export interface MilestoneSpec {
  title: string;
  description: string;
  measurement: string;
  target: number;
}

export interface ArcPersonalPlan {
  identity: {
    becoming: string;
    why: string;
    direction: string;
    sovereignTitle: string;
  };
  commitment: {
    minutesPerDay: number;
  };
  paths: {
    primary: ArcPath;
    secondary: ArcPath[];
  };
  evaluation: {
    priorities: string[];
    constraints: string[];
    growthAreas: string[];
    potentialObstacles: string[];
  };
  milestones: MilestoneSpec[];
  questStrategy: {
    focusAreas: string[];
    recommendedWeeklyPattern: string[];
  };
  initialQuests: InitialQuestSpec[];
}

/**
 * Normalizes and maps raw difficulty representations to standard engine QuestDifficulty ('I' | 'II' | 'III' | 'IV' | 'V')
 */
export function normalizeDifficulty(diff: unknown): QuestDifficulty {
  if (typeof diff !== 'string') return 'II';
  const clean = diff.trim().toUpperCase();
  if (clean === 'I' || clean.includes('LIGHT') || clean.includes('I_LIGHT')) return 'I';
  if (clean === 'III' || clean.includes('DEMANDING') || clean.includes('III_DEMANDING')) return 'III';
  if (clean === 'IV' || clean.includes('MAJOR') || clean.includes('IV_MAJOR')) return 'IV';
  if (clean === 'V' || clean.includes('MILESTONE') || clean.includes('V_MILESTONE')) return 'V';
  return 'II';
}

/**
 * Normalizes raw path representations ('CRAFT' -> 'ARTISAN', etc.)
 */
export function normalizePath(path: unknown): ArcPath {
  if (typeof path !== 'string') return 'ARTISAN';
  const clean = path.trim().toUpperCase();
  if (clean.includes('WARRIOR') || clean.includes('BODY') || clean.includes('FITNESS')) return 'WARRIOR';
  if (clean.includes('SCHOLAR') || clean.includes('MIND') || clean.includes('INTELLECT')) return 'SCHOLAR';
  if (clean.includes('SOCIAL') || clean.includes('PEOPLE') || clean.includes('RELATION')) return 'SOCIAL';
  return 'ARTISAN';
}

/**
 * Normalizes raw attribute representations
 */
export function normalizeAttribute(attr: unknown, pathFallback: ArcPath = 'ARTISAN'): ArcAttributeKey {
  if (typeof attr !== 'string') {
    switch (pathFallback) {
      case 'WARRIOR': return 'BODY';
      case 'SCHOLAR': return 'MIND';
      case 'SOCIAL': return 'PEOPLE';
      default: return 'CRAFT';
    }
  }
  const clean = attr.trim().toUpperCase();
  if (clean.includes('BODY') || clean.includes('WARRIOR')) return 'BODY';
  if (clean.includes('MIND') || clean.includes('SCHOLAR')) return 'MIND';
  if (clean.includes('PEOPLE') || clean.includes('SOCIAL')) return 'PEOPLE';
  return 'CRAFT';
}

/**
 * Normalizes raw archetype representation
 */
export function normalizeArchetype(arch: unknown): QuestArchetype {
  if (typeof arch !== 'string') return 'BUILD';
  const clean = arch.trim().toUpperCase();
  if (clean === 'FOCUS') return 'FOCUS';
  if (clean === 'DISTANCE') return 'DISTANCE';
  if (clean === 'COUNT') return 'COUNT';
  if (clean === 'ACTION') return 'ACTION';
  if (clean === 'SKILL') return 'SKILL';
  return 'BUILD';
}

/**
 * Parse daily minutes from input string
 */
export function parseDailyMinutes(rawTime: string): number {
  const match = rawTime.match(/\d+/);
  if (match) {
    const val = parseInt(match[0], 10);
    if (!isNaN(val) && val > 0 && val <= 480) return val;
  }
  return 30;
}

/**
 * Generates short, punchy, graphic-novel reactive line based on user's Q1 answer
 */
export function getReactiveLineQ1(answer: string): string {
  const lower = answer.toLowerCase();
  if (
    lower.includes('code') ||
    lower.includes('developer') ||
    lower.includes('engineer') ||
    lower.includes('build') ||
    lower.includes('software') ||
    lower.includes('program')
  ) {
    return 'THEN BUILD.';
  }
  if (
    lower.includes('strong') ||
    lower.includes('fit') ||
    lower.includes('lift') ||
    lower.includes('run') ||
    lower.includes('muscle') ||
    lower.includes('health') ||
    lower.includes('body')
  ) {
    return 'THEN BEGIN WITH ONE MOVE.';
  }
  if (
    lower.includes('potential') ||
    lower.includes('waste') ||
    lower.includes('lazy') ||
    lower.includes('discipline') ||
    lower.includes('focus')
  ) {
    return 'THEN GIVE IT DIRECTION.';
  }
  if (
    lower.includes('read') ||
    lower.includes('learn') ||
    lower.includes('study') ||
    lower.includes('think') ||
    lower.includes('scholar') ||
    lower.includes('write')
  ) {
    return 'THEN ANCHOR YOUR ATTENTION.';
  }
  if (
    lower.includes('people') ||
    lower.includes('lead') ||
    lower.includes('friend') ||
    lower.includes('connect') ||
    lower.includes('mentor')
  ) {
    return 'THEN STAND AS A PILLAR.';
  }
  return 'THEN INSCRIBE YOUR MOVE.';
}

/**
 * Strict Schema Validator & Sanitizer.
 * CRITICAL ARCHITECTURE RULE:
 * Strips any client- or AI-provided progression rewards (XP, Marks, Momentum).
 * Deterministically applies engine reward calculation.
 */
export function validateAndSanitizeArcPlan(
  raw: any,
  answers: OnboardingAnswers
): ArcPersonalPlan {
  const minutes = parseDailyMinutes(answers.q4Time);

  // 1. Identity & Direction
  const primaryPath = normalizePath(raw?.paths?.primary);
  const secondaryPaths: ArcPath[] = Array.isArray(raw?.paths?.secondary)
    ? raw.paths.secondary.map(normalizePath).filter((p: ArcPath) => p !== primaryPath)
    : [];

  const sovereignTitle =
    typeof raw?.identity?.sovereignTitle === 'string' && raw.identity.sovereignTitle.trim()
      ? raw.identity.sovereignTitle.trim().toUpperCase()
      : `THE SOVEREIGN ${primaryPath}`;

  const becoming =
    typeof raw?.identity?.becoming === 'string' && raw.identity.becoming.trim()
      ? raw.identity.becoming.trim()
      : answers.q1Become.trim();

  const why =
    typeof raw?.identity?.why === 'string' && raw.identity.why.trim()
      ? raw.identity.why.trim()
      : answers.q2Why.trim();

  const direction =
    typeof raw?.identity?.direction === 'string' && raw.identity.direction.trim()
      ? raw.identity.direction.trim()
      : `Anchor into continuous ${primaryPath.toLowerCase()} mastery through ${answers.q3How.trim()}.`;

  // 2. Evaluation
  const evaluation = {
    priorities: Array.isArray(raw?.evaluation?.priorities) && raw.evaluation.priorities.length > 0
      ? raw.evaluation.priorities.map((p: any) => String(p).slice(0, 140))
      : ['Establish daily unbroken momentum', 'Implement tangible weekly deliverables'],
    constraints: Array.isArray(raw?.evaluation?.constraints) && raw.evaluation.constraints.length > 0
      ? raw.evaluation.constraints.map((c: any) => String(c).slice(0, 140))
      : [`Available daily capacity bounded to ${minutes} minutes`, 'Cognitive context-switching resistance'],
    growthAreas: Array.isArray(raw?.evaluation?.growthAreas) && raw.evaluation.growthAreas.length > 0
      ? raw.evaluation.growthAreas.map((g: any) => String(g).slice(0, 140))
      : ['Deliberate deep execution', 'Tangible artifact completion', 'Resistance against entropy decay'],
    potentialObstacles: Array.isArray(raw?.evaluation?.potentialObstacles) && raw.evaluation.potentialObstacles.length > 0
      ? raw.evaluation.potentialObstacles.map((o: any) => String(o).slice(0, 140))
      : ['Unscheduled distraction fractures', 'Perfectionism delaying milestone verification'],
  };

  // 3. Milestones
  const rawMilestones = Array.isArray(raw?.milestones) ? raw.milestones : [];
  const milestones: MilestoneSpec[] = rawMilestones.slice(0, 4).map((m: any, idx: number) => ({
    title: typeof m?.title === 'string' && m.title.trim() ? m.title.trim() : `Milestone 0${idx + 1}`,
    description: typeof m?.description === 'string' ? m.description.trim() : 'Complete key deliverable target.',
    measurement: typeof m?.measurement === 'string' ? m.measurement.trim() : 'Completions',
    target: typeof m?.target === 'number' && m.target > 0 ? m.target : idx * 5 + 5,
  }));

  if (milestones.length === 0) {
    milestones.push(
      { title: 'Anchor Cadence', description: `Sustain unbroken ${minutes}m daily execution for 7 consecutive days`, measurement: 'Days', target: 7 },
      { title: 'First Significant Artifact', description: 'Complete and verify a foundational deliverable milestone', measurement: 'Artifacts', target: 1 },
      { title: 'Entropy Resistance Mastery', description: 'Maintain all attributes in stable sovereign state across 21 days', measurement: 'Days', target: 21 }
    );
  }

  // 4. Quest Strategy
  const questStrategy = {
    focusAreas: Array.isArray(raw?.questStrategy?.focusAreas)
      ? raw.questStrategy.focusAreas.map((f: any) => String(f).slice(0, 100))
      : ['Deep Work Cadence', 'Tactile Repetition', 'Verified Shipments'],
    recommendedWeeklyPattern: Array.isArray(raw?.questStrategy?.recommendedWeeklyPattern)
      ? raw.questStrategy.recommendedWeeklyPattern.map((p: any) => String(p).slice(0, 100))
      : ['5x Focus Sessions', '3x Output Builds', '2x Skill Reflections'],
  };

  // 5. Initial Quests — SANITIZE AND FORCE DETERMINISTIC SERVER REWARDS
  const rawQuests = Array.isArray(raw?.initialQuests) ? raw.initialQuests : [];
  const initialQuests: InitialQuestSpec[] = [];

  for (let i = 0; i < Math.max(rawQuests.length, 3); i++) {
    const q = rawQuests[i];
    if (!q && i >= 3) break;

    const archetype = normalizeArchetype(q?.archetype || (i === 0 ? 'FOCUS' : i === 1 ? 'BUILD' : 'SKILL'));
    const attribute = normalizeAttribute(q?.attribute, primaryPath);
    const difficulty = normalizeDifficulty(q?.difficulty || 'II');

    let title = typeof q?.title === 'string' && q.title.trim() ? q.title.trim().toUpperCase() : '';
    if (!title) {
      if (archetype === 'FOCUS') title = `${Math.min(minutes, 45)} MIN DEEP FOCUS SESSION`;
      else if (archetype === 'DISTANCE') title = 'AEROBIC ROAD CADENCE — 3.0 KM';
      else if (archetype === 'COUNT') title = 'FOUNDATIONAL STUDY — 20 PAGES';
      else if (archetype === 'BUILD') title = 'SHIP FOUNDATIONAL MILESTONE ARTIFACT';
      else if (archetype === 'ACTION') title = 'DELIBERATE ALLIANCE REACHOUT';
      else title = 'PROGRESSIVE TECHNIQUE DRILL';
    }

    let targetValue = typeof q?.targetValue === 'number' && q.targetValue > 0 ? q.targetValue : 1;
    let unit = typeof q?.unit === 'string' && q.unit.trim() ? q.unit.trim() : 'Units';

    if (archetype === 'FOCUS') {
      targetValue = Math.min(minutes, 45);
      unit = 'MIN';
    } else if (archetype === 'DISTANCE') {
      targetValue = targetValue >= 1 ? targetValue : 3.0;
      unit = 'KM';
    } else if (archetype === 'COUNT') {
      targetValue = targetValue >= 5 ? targetValue : 20;
      unit = 'Pages';
    } else if (archetype === 'BUILD') {
      targetValue = targetValue >= 1 && targetValue <= 5 ? targetValue : 3;
      unit = 'Checkpoints';
    } else if (archetype === 'ACTION') {
      targetValue = 1;
      unit = 'Action';
    } else if (archetype === 'SKILL') {
      targetValue = targetValue >= 1 && targetValue <= 10 ? targetValue : 5;
      unit = 'Sets';
    }

    const description = typeof q?.description === 'string' && q.description.trim()
      ? q.description.trim()
      : `Execute the ${archetype.toLowerCase()} standard to advance your ${attribute.toLowerCase()} attribute.`;

    const whyItMatters = typeof q?.whyItMatters === 'string' && q.whyItMatters.trim()
      ? q.whyItMatters.trim()
      : 'Real-world execution anchors identity and resists entropy decay.';

    // STRICT DETERMINISTIC REWARD ENFORCEMENT
    // Completely ignore any client/AI-supplied XP or Marks
    const authoritativeReward = calculateQuestReward(difficulty);

    const initialQuest: InitialQuestSpec = {
      id: `quest-init-0${i + 1}`,
      code: `0${(i + 1) * 10}`,
      title,
      archetype,
      attribute,
      difficulty,
      targetType: archetype,
      targetValue,
      unit,
      description,
      whyItMatters,
      durationMinutes: archetype === 'FOCUS' ? targetValue : 30,
      rewards: authoritativeReward,
    };

    if (archetype === 'BUILD') {
      initialQuest.checkpoints = Array.isArray(q?.checkpoints) && q.checkpoints.length >= 2
        ? q.checkpoints.map((c: any) => String(c).slice(0, 100))
        : [
            'Define requirements & interface boundaries',
            'Implement core solution logic',
            'Verify zero errors and ship artifact',
          ];
    } else if (archetype === 'ACTION') {
      initialQuest.actionPrompt = typeof q?.actionPrompt === 'string' && q.actionPrompt.trim()
        ? q.actionPrompt.trim()
        : 'What friction did you confront and what truth was exchanged?';
    } else if (archetype === 'SKILL') {
      initialQuest.skillPrompt = typeof q?.skillPrompt === 'string' && q.skillPrompt.trim()
        ? q.skillPrompt.trim()
        : 'Record working sets, resistance/load, and technique observations.';
    }

    initialQuests.push(initialQuest);
  }

  return {
    identity: {
      becoming,
      why,
      direction,
      sovereignTitle,
    },
    commitment: {
      minutesPerDay: minutes,
    },
    paths: {
      primary: primaryPath,
      secondary: secondaryPaths,
    },
    evaluation,
    milestones,
    questStrategy,
    initialQuests,
  };
}

/**
 * Deterministic Heuristic Fallback Engine
 * Generates an identical conforming ArcPersonalPlan when GEMINI_API_KEY is not set or network fails.
 */
export function generateDeterministicArcPlan(answers: OnboardingAnswers): ArcPersonalPlan {
  const q1Lower = answers.q1Become.toLowerCase();
  const q3Lower = answers.q3How.toLowerCase();
  const minutes = parseDailyMinutes(answers.q4Time);

  let primary: ArcPath = 'ARTISAN';
  let secondary: ArcPath[] = ['SCHOLAR'];

  if (q1Lower.includes('fit') || q1Lower.includes('run') || q1Lower.includes('strong') || q1Lower.includes('athlete') || q3Lower.includes('gym') || q3Lower.includes('workout')) {
    primary = 'WARRIOR';
    secondary = ['ARTISAN'];
  } else if (q1Lower.includes('read') || q1Lower.includes('learn') || q1Lower.includes('think') || q1Lower.includes('scholar') || q3Lower.includes('study') || q3Lower.includes('books')) {
    primary = 'SCHOLAR';
    secondary = ['ARTISAN'];
  } else if (q1Lower.includes('people') || q1Lower.includes('leader') || q1Lower.includes('social') || q1Lower.includes('connect') || q3Lower.includes('talk')) {
    primary = 'SOCIAL';
    secondary = ['SCHOLAR'];
  }

  const rawClean = answers.q1Become.trim().replace(/^i want to (be|become)\s+/i, '');
  const sovereignTitle = `THE SOVEREIGN ${rawClean.split(/\s+/).slice(0, 3).join(' ').toUpperCase() || primary}`;

  const mockPlan = {
    identity: {
      becoming: answers.q1Become.trim(),
      why: answers.q2Why.trim(),
      direction: `Execute relentless ${primary.toLowerCase()} discipline to achieve: ${answers.q3How.trim()}`,
      sovereignTitle,
    },
    commitment: {
      minutesPerDay: minutes,
    },
    paths: {
      primary,
      secondary,
    },
    evaluation: {
      priorities: [
        `Lock daily ${minutes}m uninterrupted execution block`,
        'Build tangible proof of competence weekly',
        'Protect cognitive energy against entropy decay',
      ],
      constraints: [
        `Daily dedicated capacity limited to ${minutes} minutes`,
        'Initial inertia when confronting deep work',
      ],
      growthAreas: [
        primary === 'WARRIOR' ? 'Physical stamina & kinetic power' : primary === 'SCHOLAR' ? 'Deep synthesis & intellectual stamina' : primary === 'SOCIAL' ? 'Empathy, active listening & leadership' : 'Engineering architecture & shipping velocity',
        'Unbroken habit streak discipline',
        'Sovereign self-regulation',
      ],
      potentialObstacles: [
        'Reactive context-switching and superficial notifications',
        'Allowing gaps in cadence to manifest Shadow Entities',
      ],
    },
    milestones: [
      {
        title: '7-Day Sovereign Foundation',
        description: `Complete ${minutes}m daily discipline for 7 unbroken days`,
        measurement: 'Days',
        target: 7,
      },
      {
        title: 'First Verified Artifact',
        description: 'Complete and ship a tangible milestone deliverable',
        measurement: 'Artifacts',
        target: 1,
      },
      {
        title: '21-Day Habit Seal',
        description: 'Solidify your sovereign identity against any entropy slip',
        measurement: 'Days',
        target: 21,
      },
    ],
    questStrategy: {
      focusAreas: [
        'Unbroken Deep Work Blocks',
        'Tactile Repetition Volume',
        'Verified Deliverables',
      ],
      recommendedWeeklyPattern: [
        '4x Primary Deep Work Sessions',
        '2x Physical Movement / Recovery Logs',
        '1x Weekly Sovereign Reflection',
      ],
    },
    initialQuests: [
      {
        title: `${Math.min(minutes, 45)} MIN UNBROKEN DEEP FOCUS`,
        archetype: 'FOCUS' as const,
        attribute: primary === 'WARRIOR' ? 'BODY' : primary === 'SCHOLAR' ? 'MIND' : primary === 'SOCIAL' ? 'PEOPLE' : 'CRAFT',
        difficulty: minutes >= 45 ? 'III_DEMANDING' : 'II_STANDARD',
        targetType: 'FOCUS',
        targetValue: Math.min(minutes, 45),
        unit: 'MIN',
        description: `Dedicate ${Math.min(minutes, 45)} minutes of continuous unbroken focus without checking notifications.`,
        whyItMatters: 'Deep work is the prime currency of sovereign transformation.',
      },
      {
        title: primary === 'WARRIOR'
          ? 'TEMPO RUN — 3.0 KM'
          : primary === 'SCHOLAR'
          ? 'LONG-FORM TEXT — 20 PAGES'
          : 'SHIP ONE FEATURE DELIVERABLE',
        archetype: primary === 'WARRIOR' ? 'DISTANCE' as const : primary === 'SCHOLAR' ? 'COUNT' as const : 'BUILD' as const,
        attribute: primary === 'WARRIOR' ? 'BODY' : primary === 'SCHOLAR' ? 'MIND' : 'CRAFT',
        difficulty: 'II_STANDARD',
        targetType: primary === 'WARRIOR' ? 'DISTANCE' : primary === 'SCHOLAR' ? 'COUNT' : 'BUILD',
        targetValue: primary === 'WARRIOR' ? 3.0 : primary === 'SCHOLAR' ? 20 : 3,
        unit: primary === 'WARRIOR' ? 'KM' : primary === 'SCHOLAR' ? 'Pages' : 'Checkpoints',
        description: primary === 'WARRIOR'
          ? 'Complete a steady 3.0 km cadence without stopping.'
          : primary === 'SCHOLAR'
          ? 'Read 20 pages of dense foundational literature.'
          : 'Define, implement, and verify a deliverable across 3 checkpoints.',
        whyItMatters: 'Actionable volume turns speculative ambition into factual momentum.',
        checkpoints: primary === 'ARTISAN' ? ['Define requirements & scope', 'Implement core functionality', 'Verify zero regressions'] : undefined,
      },
      {
        title: primary === 'SOCIAL'
          ? 'DELIBERATE ALLIANCE CHECK-IN'
          : 'SOVEREIGN ANCHOR CONFRONTATION',
        archetype: 'ACTION' as const,
        attribute: primary === 'SOCIAL' ? 'PEOPLE' : 'MIND',
        difficulty: 'I_LIGHT',
        targetType: 'ACTION',
        targetValue: 1,
        unit: 'Action',
        description: 'Confront one uncomfortable, high-friction real-world action and confirm it with deliberate intent.',
        whyItMatters: 'One tangible action dispels weeks of theoretical hesitation.',
        actionPrompt: 'What friction did you confront and what shifted in your reality?',
      },
    ],
  };

  return validateAndSanitizeArcPlan(mockPlan, answers);
}

/**
 * Server-Side Gemini API Caller
 * Uses official Google Gemini REST API with structured JSON output schema.
 * Re-attempts on parse error, and safely falls back to deterministic heuristic on failure.
 */
export async function synthesizeArcPlanWithGemini(
  answers: OnboardingAnswers
): Promise<ArcPersonalPlan> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'placeholder' || apiKey.trim() === '') {
    // Zero config / offline mode: return deterministic engine plan
    return generateDeterministicArcPlan(answers);
  }

  const systemPrompt = `
You are the personal ARC STRATEGIST in "THE ARC" — a premium single-player graphic novel Life RPG.
Your job is to UNDERSTAND, EVALUATE, and PLAN for the user based on their 4 onboarding answers.

CRITICAL RULES:
1. You are a strategist, NOT the game engine.
2. DO NOT return XP, Marks, Momentum, or currency values. Progression math is strictly calculated by the server.
3. Choose realistic, non-generic quests that connect DIRECTLY to what the user said.
4. Quests must use their natural real-world ARCHETYPE:
   - FOCUS: deep work sessions with timer
   - DISTANCE: running, walking, cycling in km (NOT a timer)
   - COUNT: reading pages, writing words, drinking units (NOT a timer)
   - BUILD: shipping features, making projects with checkpoints (NOT a timer)
   - ACTION: real-world conversations, high-friction confrontation (NOT a timer)
   - SKILL: workout sets, instrument technique practice (NOT a timer)
5. Assign difficulty: "I_LIGHT", "II_STANDARD", "III_DEMANDING", "IV_MAJOR", or "V_MILESTONE".
6. Return strictly valid JSON adhering to the specified schema.
`;

  const userContent = `
USER ONBOARDING ANSWERS:
Q1: WHAT DO YOU WANT TO BECOME?
"${answers.q1Become}"

Q2: WHY DOES THIS MATTER?
"${answers.q2Why}"

Q3: HOW WILL YOU GET THERE?
"${answers.q3How}"

Q4: HOW MUCH TIME CAN YOU GIVE EACH DAY?
"${answers.q4Time}"

Generate the complete Personal Arc Plan JSON according to the schema:
{
  "identity": {
    "becoming": string,
    "why": string,
    "direction": string,
    "sovereignTitle": string
  },
  "commitment": {
    "minutesPerDay": number
  },
  "paths": {
    "primary": "ARTISAN" | "WARRIOR" | "SCHOLAR" | "SOCIAL",
    "secondary": ["ARTISAN" | "WARRIOR" | "SCHOLAR" | "SOCIAL"]
  },
  "evaluation": {
    "priorities": string[],
    "constraints": string[],
    "growthAreas": string[],
    "potentialObstacles": string[]
  },
  "milestones": [
    {
      "title": string,
      "description": string,
      "measurement": string,
      "target": number
    }
  ],
  "questStrategy": {
    "focusAreas": string[],
    "recommendedWeeklyPattern": string[]
  },
  "initialQuests": [
    {
      "title": string,
      "archetype": "FOCUS" | "DISTANCE" | "COUNT" | "BUILD" | "ACTION" | "SKILL",
      "attribute": "BODY" | "MIND" | "CRAFT" | "PEOPLE",
      "difficulty": "I_LIGHT" | "II_STANDARD" | "III_DEMANDING" | "IV_MAJOR" | "V_MILESTONE",
      "targetType": string,
      "targetValue": number,
      "unit": string,
      "description": string,
      "whyItMatters": string,
      "checkpoints": string[] (if BUILD),
      "actionPrompt": string (if ACTION),
      "skillPrompt": string (if SKILL)
    }
  ]
}
`;

  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userContent}` }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        console.warn(`Gemini API call failed on ${model} with status ${response.status}`);
        continue;
      }

      const resJson = await response.json();
      const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      const validated = validateAndSanitizeArcPlan(parsed, answers);
      return validated;
    } catch (err) {
      console.warn(`Gemini evaluation error on ${model}:`, err);
    }
  }

  // Fallback to deterministic plan
  return generateDeterministicArcPlan(answers);
}
