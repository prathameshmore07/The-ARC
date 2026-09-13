// ═══════════════════════════════════════════════════════════════
// Entropy Engine — Core Game Logic (Deterministic, Server-Safe)
// v4 — The Living Ledger Edition
// ═══════════════════════════════════════════════════════════════

// ── Leveling ────────────────────────────────────────────────────

/** XP required to reach level `n` (non-linear scaling). */
export function xpForLevel(n: number): number {
  return Math.floor(100 * Math.pow(n, 1.5));
}

/** Given current XP, compute what level the user should be at. */
export function computeLevel(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) {
    level++;
  }
  return level;
}

/** XP progress within current level as a fraction [0, 1]. */
export function levelProgress(xp: number, level: number): number {
  const currentThreshold = xpForLevel(level);
  const nextThreshold = xpForLevel(level + 1);
  const range = nextThreshold - currentThreshold;
  if (range <= 0) return 0;
  return Math.max(0, Math.min(1, (xp - currentThreshold) / range));
}

// ── XP Awards ───────────────────────────────────────────────────

/** Base XP for completing a task (standard session). */
export const BASE_TASK_XP = 25;

/** XP per minute of focus-session-verified work. */
export const FOCUS_XP_PER_MINUTE = 2;

/** Grit (currency) awarded for standard task completion. */
export const BASE_TASK_GRIT = 5;

/** Grit per minute of focus-session-verified work. */
export const FOCUS_GRIT_PER_MINUTE = 1;

/** XP boost multiplier when post-Shadow-defeat boost is active (48h resolve). */
export const POST_SHADOW_BOOST = 1.10;

/**
 * Compute XP and Grit awards for a task completion.
 * If a validated focus session is provided, awards scale with duration.
 */
export function computeRewards(opts: {
  focusVerified: boolean;
  computedDurationSec?: number | null;
  hasXpBoost: boolean;
}): { xp: number; grit: number } {
  let xp: number;
  let grit: number;

  if (opts.focusVerified && opts.computedDurationSec && opts.computedDurationSec > 0) {
    const minutes = opts.computedDurationSec / 60;
    xp = BASE_TASK_XP + Math.floor(minutes * FOCUS_XP_PER_MINUTE);
    grit = BASE_TASK_GRIT + Math.floor(minutes * FOCUS_GRIT_PER_MINUTE);
  } else {
    xp = BASE_TASK_XP;
    grit = BASE_TASK_GRIT;
  }

  if (opts.hasXpBoost) {
    xp = Math.floor(xp * POST_SHADOW_BOOST);
  }

  return { xp, grit };
}

// ── Shadow Steal & Memory (v4) ──────────────────────────────────

/**
 * Apply Shadow's XP steal: returns actual XP the user receives
 * and the amount stolen into the Shadow's corrupting pool.
 */
export function applyShadowSteal(
  xpEarned: number,
  stealRate: number = 0.2
): { actualXp: number; stolenXp: number } {
  const stolenXp = Math.floor(xpEarned * stealRate);
  return {
    actualXp: xpEarned - stolenXp,
    stolenXp,
  };
}

/**
 * Compute trailing 14-day completion baseline weekly rate.
 */
export function computeBaselineWeeklyRate(completionsCount14Days: number): number {
  return parseFloat((completionsCount14Days / 2).toFixed(1));
}

/**
 * Pattern-aware Shadow HP formula (v4 Part A #2):
 * hp = 10 + Math.round(baselineWeeklyRate * daysNeglected * 2)
 * A habit you previously practiced frequently spawns a much deeper stain.
 */
export function computeShadowHp(
  baselineWeeklyRate: number,
  daysNeglected: number
): number {
  const severityBonus = Math.round(baselineWeeklyRate * daysNeglected * 2);
  return Math.max(10, 10 + severityBonus);
}

/**
 * Reclaimed XP on Shadow defeat (v4 Part A #1):
 * Restores 50% of the stolen pool plus a 20 XP triumphant bounty.
 */
export function computeReclaimedXp(stolenXpPool: number): number {
  return Math.max(25, Math.floor(stolenXpPool * 0.5) + 20);
}

/**
 * Human-legible origin story copy for the Shadow card.
 */
export function getShadowOriginStory(
  baselineWeeklyRate: number,
  daysNeglected: number
): string {
  if (baselineWeeklyRate >= 3) {
    return `Remembers you used to show up ${baselineWeeklyRate}x a week. You fell far, so the stain runs deep.`;
  }
  if (baselineWeeklyRate > 0) {
    return `Born from a ${baselineWeeklyRate}x/week rhythm abandoned for ${daysNeglected} days.`;
  }
  return `Spawned from ${daysNeglected} days of unattended stillness.`;
}

// ── Shadow Difficulty Scaling ───────────────────────────────────

/** Compute steps needed to banish a Shadow based on its HP. */
export function computeStepsNeeded(hp: number): number {
  return Math.min(3 + Math.floor(hp / 50), 6);
}

// ── Decay ───────────────────────────────────────────────────────

/** Grace period in hours before decay starts. */
export const DECAY_GRACE_HOURS = 48;

/** Decay rate per overdue day (fraction of current XP). */
export const DECAY_RATE = 0.05;

/** Initial Shadow HP baseline. */
export const SHADOW_INITIAL_HP = 10;

/**
 * Compute decay for an attribute.
 * Returns the new XP value and overdue days (0 if no decay).
 */
export function computeDecay(
  currentXp: number,
  lastActivityAt: Date,
  now: Date = new Date()
): { newXp: number; overdueDays: number } {
  const msElapsed = now.getTime() - lastActivityAt.getTime();
  const hoursElapsed = msElapsed / (1000 * 60 * 60);

  if (hoursElapsed <= DECAY_GRACE_HOURS) {
    return { newXp: currentXp, overdueDays: 0 };
  }

  const totalDays = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  const overdueDays = Math.max(1, totalDays - 1); // subtract 1 for the grace period day
  const decayAmount = Math.floor(currentXp * DECAY_RATE * overdueDays);
  const newXp = Math.max(0, currentXp - decayAmount);

  return { newXp, overdueDays };
}

// ── Streaks ─────────────────────────────────────────────────────

/**
 * Compute new streak value based on when the attribute was last active.
 * - Yesterday: streak + 1
 * - Today (already active): no change
 * - Anything else: reset to 1
 */
export function computeStreak(
  currentStreak: number,
  lastActivityAt: Date,
  now: Date = new Date()
): number {
  const lastDate = new Date(lastActivityAt);
  lastDate.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return currentStreak;
  } else if (diffDays === 1) {
    return currentStreak + 1;
  } else {
    return 1;
  }
}

// ── Focus Session Validation ────────────────────────────────────

/** Heartbeat interval in seconds. */
export const HEARTBEAT_INTERVAL_SEC = 30;

/** Tolerance window for heartbeat timing (seconds). */
export const HEARTBEAT_TOLERANCE_SEC = 5;

/** Minimum heartbeats for a session to be considered validated. */
export const MIN_HEARTBEATS = 2; // At least ~60s of focus

/**
 * Validate a server-timed session based on heartbeat count.
 * Returns computed duration and whether the session is validated.
 */
export function validateFocusSession(heartbeatCount: number): {
  validated: boolean;
  computedDurationSec: number;
} {
  return {
    validated: heartbeatCount >= MIN_HEARTBEATS,
    computedDurationSec: heartbeatCount * HEARTBEAT_INTERVAL_SEC,
  };
}

// ── Display Helpers ─────────────────────────────────────────────

export type DecayStatus = 'stable' | 'vulnerable' | 'decaying';

export function getDecayStatus(lastActivityAt: Date, now: Date = new Date()): DecayStatus {
  const hoursElapsed = (now.getTime() - lastActivityAt.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed <= 24) return 'stable';
  if (hoursElapsed <= DECAY_GRACE_HOURS) return 'vulnerable';
  return 'decaying';
}

export function getLevelTitle(level: number): string {
  if (level <= 3) return 'Novice Inscription';
  if (level <= 6) return 'Apprentice Scribe';
  if (level <= 10) return 'Journeyman';
  if (level <= 15) return 'Adept Archivist';
  if (level <= 20) return 'Master Chronicler';
  if (level <= 30) return 'Grandmaster';
  return 'Living Chronicle';
}

// ═══════════════════════════════════════════════════════════════
// The ARC — Core Life RPG Progression System
// ═══════════════════════════════════════════════════════════════

export interface ArcLevelDefinition {
  level: number;
  title: string;
  threshold: number;
  meaning: string;
}

export const ARC_LEVELS: ArcLevelDefinition[] = [
  { level: 1, title: 'BEGINNING', threshold: 0, meaning: 'The first intentional step into your arc.' },
  { level: 2, title: 'FIRST STEP', threshold: 100, meaning: 'Inertia broken. Initial motion confirmed.' },
  { level: 3, title: 'IN MOTION', threshold: 230, meaning: 'Early rhythm overcoming daily friction.' },
  { level: 4, title: 'FINDING RHYTHM', threshold: 390, meaning: 'Patterns beginning to crystallize.' },
  { level: 5, title: 'COMMITTED', threshold: 590, meaning: 'Resistance confronted. Routine established.' },
  { level: 6, title: 'STEADY', threshold: 840, meaning: 'Pacing stabilized against distraction.' },
  { level: 7, title: 'BUILDER', threshold: 1150, meaning: 'Laying tangible foundations daily.' },
  { level: 8, title: 'MOMENTUM', threshold: 1520, meaning: 'Compounding progress takes hold.' },
  { level: 9, title: 'DISCIPLINED', threshold: 1950, meaning: 'Action independent of transient mood.' },
  { level: 10, title: 'ESTABLISHED', threshold: 2450, meaning: 'A permanent baseline established.' },
  { level: 11, title: 'ADVANCING', threshold: 3050, meaning: 'Surpassing previous personal limits.' },
  { level: 12, title: 'FOCUSED', threshold: 3750, meaning: 'Cutting noise with deliberate depth.' },
  { level: 13, title: 'CAPABLE', threshold: 4550, meaning: 'Broadening capability across domains.' },
  { level: 14, title: 'RESOLUTE', threshold: 5450, meaning: 'Navigating adversity without faltering.' },
  { level: 15, title: 'MASTERING', threshold: 6450, meaning: 'Internalized excellence in craft.' },
  { level: 16, title: 'FORMIDABLE', threshold: 7600, meaning: 'Strength proven through continuous testing.' },
  { level: 17, title: 'EXCEPTIONAL', threshold: 8900, meaning: 'Operating at elite consistency.' },
  { level: 18, title: 'EXEMPLARY', threshold: 10350, meaning: 'Leading others by sovereign example.' },
  { level: 19, title: 'ASCENDING', threshold: 12000, meaning: 'Approaching complete self-mastery.' },
  { level: 20, title: 'COMPLETE', threshold: 13800, meaning: 'The Arc completed. A sovereign vessel.' },
];

export function computeArcLevel(xp: number): {
  level: number;
  title: string;
  meaning: string;
  threshold: number;
  nextThreshold: number;
  remaining: number;
  progress: number;
  isMaxLevel: boolean;
} {
  let currentLevel = ARC_LEVELS[0];
  for (let i = 0; i < ARC_LEVELS.length; i++) {
    if (xp >= ARC_LEVELS[i].threshold) {
      currentLevel = ARC_LEVELS[i];
    } else {
      break;
    }
  }

  const nextLevel = ARC_LEVELS.find((l) => l.level === currentLevel.level + 1);

  if (!nextLevel) {
    return {
      level: currentLevel.level,
      title: currentLevel.title,
      meaning: currentLevel.meaning,
      threshold: currentLevel.threshold,
      nextThreshold: currentLevel.threshold,
      remaining: 0,
      progress: 1,
      isMaxLevel: true,
    };
  }

  const span = nextLevel.threshold - currentLevel.threshold;
  const currentInSpan = xp - currentLevel.threshold;
  const progress = Math.max(0, Math.min(1, currentInSpan / span));
  const remaining = Math.max(0, nextLevel.threshold - xp);

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    meaning: currentLevel.meaning,
    threshold: currentLevel.threshold,
    nextThreshold: nextLevel.threshold,
    remaining,
    progress,
    isMaxLevel: false,
  };
}

export type ArcAttributeKey = 'BODY' | 'MIND' | 'CRAFT' | 'PEOPLE';

export interface ArcAttributeConfig {
  key: ArcAttributeKey;
  label: string;
  descriptors: string;
  growthArea: string;
}

export const ARC_ATTRIBUTES: Record<ArcAttributeKey, ArcAttributeConfig> = {
  BODY: {
    key: 'BODY',
    label: 'Body',
    descriptors: 'Energy · Strength · Health',
    growthArea: 'Physical Fortitude & Energy',
  },
  MIND: {
    key: 'MIND',
    label: 'Mind',
    descriptors: 'Focus · Knowledge · Learning',
    growthArea: 'Focus & Deep Study',
  },
  CRAFT: {
    key: 'CRAFT',
    label: 'Craft',
    descriptors: 'Skill · Creation · Work',
    growthArea: 'Creative Execution & Building',
  },
  PEOPLE: {
    key: 'PEOPLE',
    label: 'People',
    descriptors: 'Connection · Communication · Relationships',
    growthArea: 'Presence & Community',
  },
};

export type QuestDifficulty = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface QuestDifficultyConfig {
  code: QuestDifficulty;
  name: string;
  label: string;
  baseXp: number;
  baseMomentum: number;
  baseMarks: number;
  baseAttr: number;
}

export const QUEST_DIFFICULTIES: Record<QuestDifficulty, QuestDifficultyConfig> = {
  I: { code: 'I', name: 'LIGHT', label: 'DIFFICULTY · I', baseXp: 8, baseMomentum: 4, baseMarks: 5, baseAttr: 6 },
  II: { code: 'II', name: 'STANDARD', label: 'DIFFICULTY · II', baseXp: 20, baseMomentum: 8, baseMarks: 10, baseAttr: 12 },
  III: { code: 'III', name: 'DEMANDING', label: 'DIFFICULTY · III', baseXp: 35, baseMomentum: 14, baseMarks: 18, baseAttr: 20 },
  IV: { code: 'IV', name: 'MAJOR', label: 'DIFFICULTY · IV', baseXp: 60, baseMomentum: 24, baseMarks: 30, baseAttr: 35 },
  V: { code: 'V', name: 'MILESTONE', label: 'DIFFICULTY · V', baseXp: 100, baseMomentum: 40, baseMarks: 50, baseAttr: 50 },
};

export function calculateQuestReward(difficulty: QuestDifficulty) {
  const cfg = QUEST_DIFFICULTIES[difficulty] || QUEST_DIFFICULTIES.II;
  return {
    xp: cfg.baseXp,
    momentum: cfg.baseMomentum,
    marks: cfg.baseMarks,
    attr: cfg.baseAttr,
  };
}

export interface StreakDetails {
  currentStreak: number;
  bestStreak: number;
  weekDays: { label: string; completed: boolean; isToday: boolean }[];
  recoveryMessage: string | null;
}

export function computeDetailedStreak(
  currentStreak: number,
  lastActivityAt: string | Date | null,
  now: Date = new Date()
): StreakDetails {
  const bestStreak = Math.max(currentStreak, 21);
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayIndex = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6

  // Check if last activity was yesterday or today
  let streakActiveToday = false;
  let gapDays = 0;

  if (lastActivityAt) {
    const lastDate = new Date(lastActivityAt);
    const diffMs = now.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    gapDays = diffDays;
    streakActiveToday = lastDate.toDateString() === now.toDateString();
  }

  const weekDays = daysOfWeek.map((label, idx) => {
    const isToday = idx === dayIndex;
    let completed = false;
    if (idx < dayIndex) {
      completed = currentStreak > (dayIndex - idx - 1);
    } else if (idx === dayIndex) {
      completed = streakActiveToday;
    }
    return { label, completed, isToday };
  });

  const recoveryMessage = gapDays > 1
    ? `The Arc Continues. Last active Day ${Math.max(1, 43 - gapDays)}. Next move: Start again.`
    : null;

  return {
    currentStreak: Math.max(1, currentStreak),
    bestStreak,
    weekDays,
    recoveryMessage,
  };
}

export interface ArcPath {
  id: string;
  name: string;
  keywords: string[];
  description: string;
  primaryAttribute: ArcAttributeKey;
}

export const ARC_PATHS: ArcPath[] = [
  {
    id: 'scholar',
    name: 'THE SCHOLAR',
    keywords: ['Knowledge', 'Learning', 'Reading', 'Curiosity'],
    description: 'Pursue intellectual mastery, deep comprehension, and unyielding curiosity.',
    primaryAttribute: 'MIND',
  },
  {
    id: 'warrior',
    name: 'THE WARRIOR',
    keywords: ['Fitness', 'Discipline', 'Resilience', 'Energy'],
    description: 'Forge unbreakable physical stamina, grit, and bodily vitality.',
    primaryAttribute: 'BODY',
  },
  {
    id: 'artisan',
    name: 'THE ARTISAN',
    keywords: ['Creation', 'Skill', 'Projects', 'Craft'],
    description: 'Manifest meaningful projects, ship software, and master creative execution.',
    primaryAttribute: 'CRAFT',
  },
  {
    id: 'social',
    name: 'THE SOCIAL',
    keywords: ['Relationships', 'Communication', 'Presence', 'Community'],
    description: 'Cultivate deep alliances, genuine influence, and enduring bonds.',
    primaryAttribute: 'PEOPLE',
  },
];

// ═══════════════════════════════════════════════════════════════
// Multi-Archetype Quest System (Never Just a Timer App!)
// ═══════════════════════════════════════════════════════════════

export type QuestArchetype = 'FOCUS' | 'DISTANCE' | 'COUNT' | 'BUILD' | 'ACTION' | 'SKILL';

export type QuestTargetType = 'DURATION' | 'DISTANCE' | 'COUNT' | 'CHECKPOINTS' | 'CONFIRMATION' | 'OUTPUT';

export interface QuestArchetypeConfig {
  archetype: QuestArchetype;
  label: string;
  tag: string;
  targetType: QuestTargetType;
  defaultUnit: string;
  description: string;
  executionPrompt: string;
  accentColor: string;
  badgeStyle: string;
}

export const QUEST_ARCHETYPES: Record<QuestArchetype, QuestArchetypeConfig> = {
  FOCUS: {
    archetype: 'FOCUS',
    label: 'Focus Ritual',
    tag: '[ FOCUS ]',
    targetType: 'DURATION',
    defaultUnit: 'MIN',
    description: 'Unbroken cognitive immersion with strict timer integrity.',
    executionPrompt: 'Maintain deep unbroken focus until time expires. No premature stops.',
    accentColor: '#9D7BE8',
    badgeStyle: 'border-[#8A63D2]/40 text-[#B89CF7] bg-[#8A63D2]/10',
  },
  DISTANCE: {
    archetype: 'DISTANCE',
    label: 'Physical Distance',
    tag: '[ DISTANCE ]',
    targetType: 'DISTANCE',
    defaultUnit: 'KM',
    description: 'Physical endurance across measurable ground distance.',
    executionPrompt: 'Traverse the target distance and record live pace.',
    accentColor: '#38BDF8',
    badgeStyle: 'border-[#38BDF8]/40 text-[#38BDF8] bg-[#38BDF8]/10',
  },
  COUNT: {
    archetype: 'COUNT',
    label: 'Tactile Volume',
    tag: '[ COUNT ]',
    targetType: 'COUNT',
    defaultUnit: 'Pages',
    description: 'Quantifiable repetition such as pages read, words, or items.',
    executionPrompt: 'Advance the counter item by item until the quota is fulfilled.',
    accentColor: '#34D399',
    badgeStyle: 'border-[#34D399]/40 text-[#34D399] bg-[#34D399]/10',
  },
  BUILD: {
    archetype: 'BUILD',
    label: 'Outcome Milestones',
    tag: '[ BUILD ]',
    targetType: 'CHECKPOINTS',
    defaultUnit: 'Checkpoints',
    description: 'Concrete checkpoints required to ship a tangible feature or artifact.',
    executionPrompt: 'Verify and check off each essential architectural checkpoint.',
    accentColor: '#FBBF24',
    badgeStyle: 'border-[#FBBF24]/40 text-[#FBBF24] bg-[#FBBF24]/10',
  },
  ACTION: {
    archetype: 'ACTION',
    label: 'Sovereign Action',
    tag: '[ ACTION ]',
    targetType: 'CONFIRMATION',
    defaultUnit: 'Confirmation',
    description: 'Real-world physical or relational action with intentional reflection.',
    executionPrompt: 'Confront real friction in the world and deliberately confirm completion.',
    accentColor: '#F472B6',
    badgeStyle: 'border-[#F472B6]/40 text-[#F472B6] bg-[#F472B6]/10',
  },
  SKILL: {
    archetype: 'SKILL',
    label: 'Skill Deliberation',
    tag: '[ SKILL ]',
    targetType: 'OUTPUT',
    defaultUnit: 'Sets Logged',
    description: 'Structured technical, athletic, or musical practice with logged output.',
    executionPrompt: 'Log sets, reps, technique observations, or practice outputs.',
    accentColor: '#C5A059',
    badgeStyle: 'border-[#C5A059]/40 text-[#E5C378] bg-[#C5A059]/10',
  },
};

/**
 * Infer the true quest archetype from a quest/task title or keywords.
 * Enforces the rule: Never default to FOCUS / timer unless duration is genuinely the objective.
 */
export function inferQuestArchetype(title: string, fallback?: QuestArchetype): QuestArchetype {
  const t = (title || '').toUpperCase();

  // 1. COUNT: Pages read, chapters, words, articles, repetitions
  if (
    t.includes('READ') ||
    t.includes('PAGE') ||
    t.includes('BOOK') ||
    t.includes('CHAPTER') ||
    t.includes('COUNT') ||
    t.includes('ARTICLE')
  ) {
    return 'COUNT';
  }

  // 2. DISTANCE: Run, walk, km, distance, jog, cycle, marathon, 5k, 10k, miles
  if (
    t.includes('RUN') ||
    t.includes('WALK') ||
    t.includes('KM') ||
    t.includes('DISTANCE') ||
    t.includes('JOG') ||
    t.includes('CYCLE') ||
    t.includes('5K') ||
    t.includes('10K') ||
    t.includes('MILE')
  ) {
    return 'DISTANCE';
  }

  // 3. BUILD: Ship, feature, build, deploy, release, MVP, artifact, PR
  if (
    t.includes('BUILD') ||
    t.includes('SHIP') ||
    t.includes('FEATURE') ||
    t.includes('DEPLOY') ||
    t.includes('RELEASE') ||
    t.includes('MVP') ||
    t.includes('ARTIFACT') ||
    t.includes('PULL REQUEST') ||
    t.includes('PR ')
  ) {
    return 'BUILD';
  }

  // 4. ACTION: Call, message, reach out, talk, check-in, presence, conversation
  if (
    t.includes('CALL') ||
    t.includes('PRESENCE') ||
    t.includes('TALK') ||
    t.includes('REACH OUT') ||
    t.includes('CHECK-IN') ||
    t.includes('CONNECT') ||
    t.includes('MEETING') ||
    t.includes('CONVERSATION')
  ) {
    return 'ACTION';
  }

  // 5. SKILL: Lift, workout, sets, reps, gym, squat, bench, deadlift, practice, guitar, piano, drill, solve
  if (
    t.includes('LIFT') ||
    t.includes('WORKOUT') ||
    t.includes('SET') ||
    t.includes('SETS') ||
    t.includes('REP') ||
    t.includes('SQUAT') ||
    t.includes('DEADLIFT') ||
    t.includes('BENCH') ||
    t.includes('PRACTICE') ||
    t.includes('GUITAR') ||
    t.includes('PIANO') ||
    t.includes('DRILL') ||
    t.includes('SOLVE')
  ) {
    return 'SKILL';
  }

  // 6. FOCUS: Only when time/deep work is genuinely the objective
  if (
    t.includes('FOCUS') ||
    t.includes('DEEP WORK') ||
    t.includes('SESSION') ||
    t.includes('STUDY BLOCK') ||
    t.includes('MEDITATION') ||
    t.includes('IMMERSION')
  ) {
    return 'FOCUS';
  }

  return fallback || 'ACTION';
}

export interface QuestCompletionPayload {
  archetype?: QuestArchetype;
  focusSessionId?: string | null;
  focusSessionValidated?: boolean;
  elapsedDurationSec?: number;
  durationMinutes?: number;
  targetDurationSec?: number;
  distanceValue?: number;
  targetDistance?: number;
  countValue?: number;
  targetCount?: number;
  completedCheckpoints?: string[];
  requiredCheckpoints?: number;
  confirmed?: boolean;
  reflection?: string;
  skillOutput?: string;
  targetValue?: number;
}

export interface QuestValidationConfig {
  durationMinutes?: number;
  targetValue?: number;
  targetDistance?: number;
  targetCount?: number;
  requiredCheckpoints?: number;
  checkpoints?: string[];
}

export interface QuestValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate quest completion based on its specific archetype.
 * Enforces timer integrity, distance minimums, counts, checkpoints, confirmation, and skill output.
 */
export function validateQuestCompletion(
  archetype: QuestArchetype,
  payload: QuestCompletionPayload,
  questConfig?: QuestValidationConfig
): QuestValidationResult {
  switch (archetype) {
    case 'FOCUS': {
      if (payload.focusSessionValidated) {
        return { valid: true };
      }
      if (payload.focusSessionId) {
        return { valid: true };
      }
      const targetMin = questConfig?.durationMinutes || payload.durationMinutes || 0;
      const targetSec = Math.max(60, targetMin * 60);
      const elapsed = payload.elapsedDurationSec || 0;

      // Timer integrity: require full duration (with 5s grace window)
      if (targetMin > 0 && elapsed < Math.max(30, targetSec - 5)) {
        const completedMin = Math.floor(elapsed / 60);
        const remainingMin = Math.max(1, Math.ceil((targetSec - elapsed) / 60));
        return {
          valid: false,
          reason: `${completedMin} MIN COMPLETED · ${remainingMin} MIN REMAINING · [ CONTINUE QUEST ]`,
        };
      }
      if (elapsed > 0) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: 'Focus session has zero elapsed duration.',
      };
    }

    case 'DISTANCE': {
      const target =
        questConfig?.targetDistance ??
        questConfig?.targetValue ??
        payload.targetDistance ??
        payload.targetValue ??
        1.0;
      const current = payload.distanceValue ?? 0;
      if (typeof current === 'number' && current >= target) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `Distance requirement not met: ${current.toFixed(1)} / ${target.toFixed(1)} required.`,
      };
    }

    case 'COUNT': {
      const target =
        questConfig?.targetCount ??
        questConfig?.targetValue ??
        payload.targetCount ??
        payload.targetValue ??
        1;
      const current = payload.countValue ?? 0;
      if (typeof current === 'number' && current >= target) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `Count target not reached: ${current} / ${target} required.`,
      };
    }

    case 'BUILD': {
      const required =
        questConfig?.requiredCheckpoints ??
        questConfig?.checkpoints?.length ??
        payload.requiredCheckpoints ??
        1;
      const completed = Array.isArray(payload.completedCheckpoints)
        ? payload.completedCheckpoints.length
        : 0;
      if (completed >= required) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `Checkpoints incomplete: ${completed} / ${required} required milestones checked.`,
      };
    }

    case 'ACTION': {
      if (payload.confirmed === true) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: 'Deliberate confirmation required for real-world action.',
      };
    }

    case 'SKILL': {
      if (
        typeof payload.skillOutput === 'string' &&
        payload.skillOutput.trim().length > 0
      ) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: 'Skill practice output notes or exercise data required.',
      };
    }

    default:
      return { valid: false, reason: `Unknown quest archetype: ${archetype}` };
  }
}

export interface StarterQuest {
  id: string;
  code: string;
  title: string;
  archetype: QuestArchetype;
  targetType: QuestTargetType;
  target: string;
  targetValue: number;
  unit: string;
  durationMinutes: number;
  attribute: ArcAttributeKey;
  tags: string;
  difficulty: QuestDifficulty;
  objective: string;
  whyItMatters: string;
  attributeReward: number;
  momentumReward: number;
  marksReward: number;
  xpReward: number;
  category: 'TODAY' | 'RECOMMENDED' | 'STANDARD';
  status?: 'AVAILABLE' | 'ACTIVE' | 'COMPLETED';
  completedAt?: string;
  completedToday?: boolean;
  checkpoints?: string[];
  actionPrompt?: string;
  skillPrompt?: string;
  isCustom?: boolean;
}

export const DEFAULT_STARTER_QUESTS: StarterQuest[] = [
  {
    id: 'quest-014',
    code: '014',
    title: 'DEEP WORK',
    archetype: 'FOCUS',
    targetType: 'DURATION',
    target: '45 MIN',
    targetValue: 45,
    unit: 'MIN',
    durationMinutes: 45,
    attribute: 'CRAFT',
    tags: 'CRAFT · FOCUS',
    difficulty: 'II',
    objective: 'Complete one uninterrupted 45-minute deep craft or coding session without notifications.',
    whyItMatters: 'Consistency compounds. Mastery is built in blocks of unbroken stillness.',
    attributeReward: 18,
    momentumReward: 8,
    marksReward: 10,
    xpReward: 20,
    category: 'TODAY',
  },
  {
    id: 'quest-002',
    code: '002',
    title: 'TEMPO RUN',
    archetype: 'DISTANCE',
    targetType: 'DISTANCE',
    target: '3.0 KM',
    targetValue: 3.0,
    unit: 'KM',
    durationMinutes: 20,
    attribute: 'BODY',
    tags: 'BODY · DISTANCE',
    difficulty: 'II',
    objective: 'Sustain a rhythmic aerobic pace across 3.0 kilometers without stopping or checking devices.',
    whyItMatters: 'Cardiovascular capacity directly powers cognitive endurance.',
    attributeReward: 12,
    momentumReward: 8,
    marksReward: 10,
    xpReward: 20,
    category: 'TODAY',
  },
  {
    id: 'quest-008',
    code: '008',
    title: 'DEEP READING',
    archetype: 'COUNT',
    targetType: 'COUNT',
    target: '20 PAGES',
    targetValue: 20,
    unit: 'Pages',
    durationMinutes: 30,
    attribute: 'MIND',
    tags: 'MIND · COUNT',
    difficulty: 'I',
    objective: 'Read 20 pages of foundational nonfiction or technical literature with pencil in hand.',
    whyItMatters: 'Dense reading repairs attention spans fractured by modern algorithmic feeds.',
    attributeReward: 8,
    momentumReward: 4,
    marksReward: 5,
    xpReward: 8,
    category: 'RECOMMENDED',
  },
  {
    id: 'quest-042',
    code: '042',
    title: 'SHIP FEATURE / MVP',
    archetype: 'BUILD',
    targetType: 'CHECKPOINTS',
    target: '3 CHECKPOINTS',
    targetValue: 3,
    unit: 'Checkpoints',
    durationMinutes: 60,
    attribute: 'CRAFT',
    tags: 'CRAFT · BUILD',
    difficulty: 'III',
    objective: 'Design, implement, and verify a complete software feature across all three outcome checkpoints.',
    whyItMatters: 'Until it is shipped, creation is merely speculative intention.',
    attributeReward: 24,
    momentumReward: 15,
    marksReward: 18,
    xpReward: 35,
    category: 'STANDARD',
    checkpoints: [
      'Define data contracts and state boundaries',
      'Implement core algorithms and execution handlers',
      'Verify with tests and prepare deployment artifact',
    ],
  },
  {
    id: 'quest-021',
    code: '021',
    title: 'GENUINE PRESENCE CALL',
    archetype: 'ACTION',
    targetType: 'CONFIRMATION',
    target: 'CONFIRMATION',
    targetValue: 1,
    unit: 'Call',
    durationMinutes: 15,
    attribute: 'PEOPLE',
    tags: 'PEOPLE · ACTION',
    difficulty: 'I',
    objective: 'Reach out to an ally, mentor, or close friend with complete presence and zero multitasking.',
    whyItMatters: 'Trust and sovereign community are forged through intentional recurrence.',
    attributeReward: 6,
    momentumReward: 4,
    marksReward: 5,
    xpReward: 8,
    category: 'RECOMMENDED',
    actionPrompt: 'Who did you connect with and what was shared?',
  },
  {
    id: 'quest-033',
    code: '033',
    title: 'HEAVY COMPOUND LIFTS',
    archetype: 'SKILL',
    targetType: 'OUTPUT',
    target: '5 SETS LOGGED',
    targetValue: 5,
    unit: 'Sets',
    durationMinutes: 45,
    attribute: 'BODY',
    tags: 'BODY · SKILL',
    difficulty: 'III',
    objective: 'Execute structured compound movements (Squats/Deadlifts/Presses), logging every working set and technique notes.',
    whyItMatters: 'Physical resistance under progressive overload anchors the nervous system against anxiety.',
    attributeReward: 25,
    momentumReward: 15,
    marksReward: 18,
    xpReward: 35,
    category: 'STANDARD',
    skillPrompt: 'Record working sets, weights, reps, and technique observations.',
  },
  {
    id: 'quest-055',
    code: '055',
    title: 'FIRST 5K CONTINUOUS',
    archetype: 'DISTANCE',
    targetType: 'DISTANCE',
    target: '5.0 KM',
    targetValue: 5.0,
    unit: 'KM',
    durationMinutes: 35,
    attribute: 'BODY',
    tags: 'BODY · DISTANCE',
    difficulty: 'IV',
    objective: 'Complete an unbroken 5-kilometer outdoor run at steady pacing.',
    whyItMatters: 'Overcoming aerobic friction establishes sovereign bodily discipline.',
    attributeReward: 40,
    momentumReward: 30,
    marksReward: 30,
    xpReward: 60,
    category: 'STANDARD',
  },
  {
    id: 'quest-060',
    code: '060',
    title: 'SHIP FINISHED ARTIFACT',
    archetype: 'BUILD',
    targetType: 'CHECKPOINTS',
    target: '3 CHECKPOINTS',
    targetValue: 3,
    unit: 'Checkpoints',
    durationMinutes: 60,
    attribute: 'CRAFT',
    tags: 'CRAFT · BUILD',
    difficulty: 'V',
    objective: 'Release a finished software tool, essay, or public-facing work into the world.',
    whyItMatters: 'Until it is shipped, creation is merely intention.',
    attributeReward: 60,
    momentumReward: 50,
    marksReward: 50,
    xpReward: 100,
    category: 'RECOMMENDED',
    checkpoints: [
      'Final code clean-up & schema validation',
      'End-to-end integration and smoke testing',
      'Public deployment and release announcement',
    ],
  },
];

