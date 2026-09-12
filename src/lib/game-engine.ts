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
