// ═══════════════════════════════════════════════════════════════
// The ARC — AI Narrative Onboarding Synthesis Engine
// Analyzes user responses to synthesize archetype, paths, and bespoke quests.
// ═══════════════════════════════════════════════════════════════

import {
  type ArcAttributeKey,
  ARC_ATTRIBUTES,
  type QuestArchetype,
  type QuestDifficulty,
  calculateQuestReward,
} from './game-engine.ts';

export type ArcPathName = 'SCHOLAR' | 'WARRIOR' | 'ARTISAN' | 'SOCIAL';

export interface GeneratedQuest {
  id: string;
  code: string;
  title: string;
  archetype: QuestArchetype;
  difficulty: QuestDifficulty;
  attribute: ArcAttributeKey;
  objective: string;
  whyItMatters: string;
  target: string;
  targetValue: number;
  unit: string;
  durationMinutes: number;
  rewards: {
    xp: number;
    momentum: number;
    marks: number;
    attr: number;
  };
  checkpoints?: string[];
  actionPrompt?: string;
  skillPrompt?: string;
}

export interface ArcSynthesisProfile {
  identity: string;
  whyItMatters: string;
  direction: string;
  primaryPath: ArcPathName;
  secondaryPaths: ArcPathName[];
  commitment: string;
  dailyMinutes: number;
  growthAreas: string[];
  meaningfulMilestones: string[];
  firstQuests: GeneratedQuest[];
  attributeDistribution: Record<ArcAttributeKey, number>;
}

export interface OnboardingAnswers {
  q1Become: string;
  q2Why: string;
  q3How: string;
  q4Time: string;
}

/**
 * Clean and normalize text for keyword scoring.
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

const PATH_KEYWORDS: Record<ArcPathName, { words: string[]; attr: ArcAttributeKey }> = {
  SCHOLAR: {
    words: [
      'read', 'reading', 'learn', 'learning', 'study', 'studying', 'books', 'book',
      'knowledge', 'wisdom', 'mind', 'intellect', 'focus', 'deep', 'think', 'thought',
      'philosophy', 'research', 'comprehension', 'clarity', 'mental', 'curiosity',
      'language', 'math', 'science', 'history', 'attention'
    ],
    attr: 'MIND',
  },
  WARRIOR: {
    words: [
      'fit', 'fitness', 'gym', 'lift', 'lifting', 'run', 'running', 'strength',
      'muscle', 'body', 'health', 'cardio', 'endurance', 'stamina', 'weight',
      'workout', 'train', 'training', 'marathon', '5k', '10k', 'sweat', 'discipline',
      'physical', 'power', 'athletic', 'speed', 'sleep', 'diet', 'nutrition'
    ],
    attr: 'BODY',
  },
  ARTISAN: {
    words: [
      'code', 'coding', 'program', 'programming', 'software', 'build', 'building',
      'ship', 'shipping', 'developer', 'craft', 'art', 'design', 'write', 'writing',
      'project', 'create', 'creation', 'engineer', 'engineering', 'startup', 'product',
      'app', 'saas', 'system', 'architecture', 'music', 'publish', 'release'
    ],
    attr: 'CRAFT',
  },
  SOCIAL: {
    words: [
      'people', 'friend', 'friends', 'family', 'relationship', 'relationships',
      'connect', 'connection', 'talk', 'listen', 'mentor', 'community', 'leader',
      'leadership', 'team', 'network', 'presence', 'empathy', 'love', 'brother',
      'sister', 'partner', 'colleague', 'speak', 'influence', 'ally'
    ],
    attr: 'PEOPLE',
  },
};

/**
 * Score paths based on user answers.
 */
function scorePaths(answers: OnboardingAnswers): {
  primaryPath: ArcPathName;
  secondaryPaths: ArcPathName[];
  scores: Record<ArcPathName, number>;
} {
  const combined = `${answers.q1Become} ${answers.q2Why} ${answers.q3How}`;
  const words = extractKeywords(combined);

  const scores: Record<ArcPathName, number> = {
    SCHOLAR: 0,
    WARRIOR: 0,
    ARTISAN: 0,
    SOCIAL: 0,
  };

  for (const word of words) {
    for (const [pathName, cfg] of Object.entries(PATH_KEYWORDS) as [ArcPathName, typeof PATH_KEYWORDS[ArcPathName]][]) {
      if (cfg.words.includes(word)) {
        scores[pathName] += 1;
      }
    }
  }

  // Weight Q1 (Identity) more heavily
  const q1Words = extractKeywords(answers.q1Become);
  for (const word of q1Words) {
    for (const [pathName, cfg] of Object.entries(PATH_KEYWORDS) as [ArcPathName, typeof PATH_KEYWORDS[ArcPathName]][]) {
      if (cfg.words.includes(word)) {
        scores[pathName] += 1.5;
      }
    }
  }

  // Default tie-break baseline
  scores.ARTISAN = scores.ARTISAN || 1;
  scores.WARRIOR = scores.WARRIOR || 0.8;
  scores.SCHOLAR = scores.SCHOLAR || 0.6;
  scores.SOCIAL = scores.SOCIAL || 0.4;

  const sorted = (Object.keys(scores) as ArcPathName[]).sort((a, b) => scores[b] - scores[a]);
  const primaryPath = sorted[0];
  const secondaryPaths = sorted.slice(1, 3);

  return { primaryPath, secondaryPaths, scores };
}

/**
 * Parse daily minutes from the Q4 answer.
 */
function parseDailyMinutes(q4Time: string): number {
  if (q4Time.includes('15')) return 15;
  if (q4Time.includes('30')) return 30;
  if (q4Time.includes('45')) return 45;
  if (q4Time.includes('60')) return 60;
  if (q4Time.includes('90')) return 90;
  if (q4Time.includes('120')) return 120;
  return 30;
}

/**
 * Formulate an evocative Sovereign Identity Title.
 */
function synthesizeIdentityTitle(q1: string, primaryPath: ArcPathName): string {
  const cleaned = q1.trim().replace(/^i want to (be|become)\s+/i, '').replace(/^to (be|become)\s+/i, '');
  const titleWords = cleaned.split(/\s+/).slice(0, 4).join(' ').toUpperCase();

  if (titleWords.length >= 4 && titleWords.length <= 32 && !titleWords.includes('DON T') && !titleWords.includes('LIKE')) {
    if (titleWords.startsWith('THE ')) return titleWords;
    return `THE ${titleWords}`;
  }

  switch (primaryPath) {
    case 'ARTISAN':
      return 'THE SOVEREIGN BUILDER';
    case 'WARRIOR':
      return 'THE UNBREAKABLE TITAN';
    case 'SCHOLAR':
      return 'THE DISCIPLINED SAGE';
    case 'SOCIAL':
      return 'THE PILLAR OF ALLIES';
    default:
      return 'THE ASCENDING CHRONICLER';
  }
}

/**
 * Formulate actionable starter quests tailored to user's free-text inputs.
 */
function generateBespokeQuests(
  answers: OnboardingAnswers,
  primaryPath: ArcPathName,
  secondaryPaths: ArcPathName[],
  dailyMinutes: number
): GeneratedQuest[] {
  const quests: GeneratedQuest[] = [];
  const q3Lower = answers.q3How.toLowerCase();

  // Quest 1: PRIMARY FOCUS QUEST (Duration-based, matched to available daily minutes)
  const focusMinutes = Math.min(dailyMinutes, 45);
  let focusTitle = 'UNBROKEN CRAFT SESSION';
  let focusObj = `Complete ${focusMinutes} minutes of uninterrupted high-leverage focus on your primary craft.`;
  let focusAttr: ArcAttributeKey = 'CRAFT';

  if (primaryPath === 'SCHOLAR') {
    focusTitle = 'DEEP STUDY PROTOCOL';
    focusObj = `Sustain ${focusMinutes} minutes of intense non-fiction or technical reading with zero device distractions.`;
    focusAttr = 'MIND';
  } else if (primaryPath === 'WARRIOR') {
    focusTitle = 'IRON DISCIPLINE SESSION';
    focusObj = `Dedicate ${focusMinutes} minutes to focused physical movement, mobility, and progressive training.`;
    focusAttr = 'BODY';
  } else if (primaryPath === 'SOCIAL') {
    focusTitle = 'PRESENCE & CONVERSATION BLOCK';
    focusObj = `Engage in ${focusMinutes} minutes of active mentorship, fellowship, or undivided listening.`;
    focusAttr = 'PEOPLE';
  }

  // If user mentioned specific keywords in Q1/Q3, weave them in
  if (q3Lower.includes('code') || q3Lower.includes('software') || q3Lower.includes('programming') || q3Lower.includes('rust') || q3Lower.includes('python')) {
    focusTitle = 'DEEP ARCHITECTURE & CODE';
    focusObj = `Dedicate ${focusMinutes} uninterrupted minutes to advancing your core codebase and implementation logic.`;
    focusAttr = 'CRAFT';
  } else if (q3Lower.includes('write') || q3Lower.includes('writing') || q3Lower.includes('essay') || q3Lower.includes('book')) {
    focusTitle = 'DEEP WRITING IMMERSION';
    focusObj = `Spend ${focusMinutes} minutes writing without editing, drafting your key thoughts in stillness.`;
    focusAttr = 'CRAFT';
  }

  const q1Diff: QuestDifficulty = focusMinutes >= 45 ? 'III' : 'II';
  quests.push({
    id: 'quest-start-01',
    code: '010',
    title: focusTitle,
    archetype: 'FOCUS',
    difficulty: q1Diff,
    attribute: focusAttr,
    objective: focusObj,
    whyItMatters: 'Compounding mastery requires deep, unbroken cognitive stillness.',
    target: `${focusMinutes} MIN`,
    targetValue: focusMinutes,
    unit: 'MIN',
    durationMinutes: focusMinutes,
    rewards: calculateQuestReward(q1Diff),
  });

  // Quest 2: PHYSICAL OR VOLUME REPETITION (DISTANCE or COUNT)
  if (q3Lower.includes('run') || q3Lower.includes('running') || q3Lower.includes('5k') || primaryPath === 'WARRIOR' || secondaryPaths.includes('WARRIOR')) {
    const distTarget = dailyMinutes <= 30 ? 2.5 : 4.0;
    const diff: QuestDifficulty = distTarget >= 4 ? 'III' : 'II';
    quests.push({
      id: 'quest-start-02',
      code: '020',
      title: 'AEROBIC TEMPO CADENCE',
      archetype: 'DISTANCE',
      difficulty: diff,
      attribute: 'BODY',
      objective: `Log ${distTarget} kilometers at a steady, rhythmic pace without halting.`,
      whyItMatters: 'Physical endurance anchors your nervous system against daily resistance.',
      target: `${distTarget.toFixed(1)} KM`,
      targetValue: distTarget,
      unit: 'KM',
      durationMinutes: Math.round(distTarget * 7),
      rewards: calculateQuestReward(diff),
    });
  } else if (q3Lower.includes('gym') || q3Lower.includes('lift') || q3Lower.includes('workout') || q3Lower.includes('strength')) {
    const sets = dailyMinutes <= 30 ? 4 : 5;
    const diff: QuestDifficulty = 'II';
    quests.push({
      id: 'quest-start-02',
      code: '025',
      title: 'PROGRESSIVE COMPOUND DRILL',
      archetype: 'SKILL',
      difficulty: diff,
      attribute: 'BODY',
      objective: `Execute and record ${sets} working sets under progressive resistance.`,
      whyItMatters: 'Strength is earned through mechanical tension and consistent technique.',
      target: `${sets} SETS`,
      targetValue: sets,
      unit: 'Sets',
      durationMinutes: 30,
      rewards: calculateQuestReward(diff),
      skillPrompt: 'Record working sets, weights, reps, and technique observations.',
    });
  } else {
    // Default Count quest: Reading volume
    const pages = dailyMinutes <= 30 ? 15 : 25;
    const diff: QuestDifficulty = 'I';
    quests.push({
      id: 'quest-start-02',
      code: '028',
      title: 'FOUNDATIONAL NON-FICTION',
      archetype: 'COUNT',
      difficulty: diff,
      attribute: 'MIND',
      objective: `Read ${pages} pages of foundational literature with pencil in hand.`,
      whyItMatters: 'Dense long-form reading repairs attention fractured by modern feeds.',
      target: `${pages} PAGES`,
      targetValue: pages,
      unit: 'Pages',
      durationMinutes: 25,
      rewards: calculateQuestReward(diff),
    });
  }

  // Quest 3: TANGIBLE DELIVERABLE (BUILD or ACTION)
  if (primaryPath === 'ARTISAN' || q3Lower.includes('ship') || q3Lower.includes('project') || q3Lower.includes('build')) {
    const diff: QuestDifficulty = 'III';
    quests.push({
      id: 'quest-start-03',
      code: '030',
      title: 'SHIP FIRST MILESTONE ARTIFACT',
      archetype: 'BUILD',
      difficulty: diff,
      attribute: 'CRAFT',
      objective: 'Define, implement, and verify a complete deliverable milestone across all 3 checkpoints.',
      whyItMatters: 'Until an artifact is verified and shipped, effort remains speculative.',
      target: '3 CHECKPOINTS',
      targetValue: 3,
      unit: 'Checkpoints',
      durationMinutes: 45,
      rewards: calculateQuestReward(diff),
      checkpoints: [
        'Clarify the deliverable contract and scope boundaries',
        'Execute the core build and verify implementation',
        'Verify zero regressions and log completed artifact',
      ],
    });
  } else {
    const diff: QuestDifficulty = 'I';
    quests.push({
      id: 'quest-start-03',
      code: '035',
      title: 'SOVEREIGN ANCHOR VERIFICATION',
      archetype: 'ACTION',
      difficulty: diff,
      attribute: primaryPath === 'SOCIAL' ? 'PEOPLE' : 'MIND',
      objective: 'Take one uncomfortable, high-friction real-world action that serves your anchor and confirm it deliberately.',
      whyItMatters: 'A single real-world confrontation breaks weeks of theoretical contemplation.',
      target: 'CONFIRMATION',
      targetValue: 1,
      unit: 'Action',
      durationMinutes: 15,
      rewards: calculateQuestReward(diff),
      actionPrompt: 'What specific friction did you confront and what shifted?',
    });
  }

  // Optional 4th Quest if 60+ minutes committed: A relational or health habit
  if (dailyMinutes >= 60) {
    const diff: QuestDifficulty = 'II';
    quests.push({
      id: 'quest-start-04',
      code: '040',
      title: 'GENUINE ALLIANCE CHECK-IN',
      archetype: 'ACTION',
      difficulty: diff,
      attribute: 'PEOPLE',
      objective: 'Reach out to a valued peer, ally, or collaborator with undivided attention.',
      whyItMatters: 'Trust and sovereign fellowship are forged through deliberate recurrence.',
      target: 'CONFIRMATION',
      targetValue: 1,
      unit: 'Call',
      durationMinutes: 15,
      rewards: calculateQuestReward(diff),
      actionPrompt: 'Who did you connect with and what truth was exchanged?',
    });
  }

  return quests;
}

/**
 * Main Entry Point: Synthesizes user answers into a complete Arc Profile.
 * Deterministic, server-authoritative, retry-safe, and refresh-safe.
 */
export async function synthesizeArcProfile(answers: OnboardingAnswers): Promise<ArcSynthesisProfile> {
  const { primaryPath, secondaryPaths } = scorePaths(answers);
  const dailyMinutes = parseDailyMinutes(answers.q4Time);
  const identity = synthesizeIdentityTitle(answers.q1Become, primaryPath);

  // Generate direction statement derived directly from user's words
  const direction = answers.q3How.trim().length > 10
    ? `Anchor into ${primaryPath.toLowerCase()} mastery through ${answers.q3How.trim().replace(/\.$/, '')}.`
    : `Pursue relentless ${primaryPath.toLowerCase()} advancement with a ${dailyMinutes}-minute daily standard.`;

  // Meaningful growth areas derived from answers
  const growthAreas = [
    `${ARC_ATTRIBUTES[PATH_KEYWORDS[primaryPath].attr].growthArea}`,
    `Daily Recurrence: ${answers.q4Time} of unbroken focus`,
    `Confronting Entropy through sovereign execution`,
  ];

  // Meaningful milestones
  const meaningfulMilestones = [
    `Day 7: Establish initial unbroken cadence in ${primaryPath}`,
    `Day 21: Solidify identity as ${identity}`,
    `Day 60: Confront and banish all emerging Shadow Entities`,
    `Day 100: Attain Sovereign Master status`,
  ];

  // Attribute distribution (summing to 250 base points distributed according to answers)
  const baseAttr = {
    CRAFT: 50,
    BODY: 50,
    MIND: 50,
    PEOPLE: 50,
  };

  const primaryAttr = PATH_KEYWORDS[primaryPath].attr;
  baseAttr[primaryAttr] += 30;
  for (const sec of secondaryPaths) {
    baseAttr[PATH_KEYWORDS[sec].attr] += 10;
  }

  // Bespoke starter quests
  const firstQuests = generateBespokeQuests(answers, primaryPath, secondaryPaths, dailyMinutes);

  return {
    identity,
    whyItMatters: answers.q2Why.trim() || 'To forge capability and defend against entropy before time expires.',
    direction,
    primaryPath,
    secondaryPaths,
    commitment: `${dailyMinutes} MIN / DAY`,
    dailyMinutes,
    growthAreas,
    meaningfulMilestones,
    firstQuests,
    attributeDistribution: baseAttr,
  };
}
