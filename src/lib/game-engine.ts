// ═══════════════════════════════════════════════════════════════
// Entropy Engine — Core Game Logic (Deterministic, Server-Safe)
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

/** Base XP for completing a task (quick completion, no focus session). */
export const BASE_TASK_XP = 25;

/** XP per minute of focus-session-verified work. */
export const FOCUS_XP_PER_MINUTE = 2;

/** Grit (currency) awarded for quick task completion. */
export const BASE_TASK_GRIT = 5;

/** Grit per minute of focus-session-verified work. */
export const FOCUS_GRIT_PER_MINUTE = 1;

/** XP boost multiplier when post-Shadow-defeat boost is active. */
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

// ── Shadow Steal ────────────────────────────────────────────────

/**
 * Apply Shadow's XP steal: returns actual XP the user receives
 * and the amount stolen. stolenXp is simply lost (not added to Shadow HP).
 */
export function applyShadowSteal(
  xpEarned: number,
  stealRate: number
): { actualXp: number; stolenXp: number } {
  const stolenXp = Math.floor(xpEarned * stealRate);
  return {
    actualXp: xpEarned - stolenXp,
    stolenXp,
  };
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

/** Initial Shadow HP on manifestation. */
export const SHADOW_INITIAL_HP = 10;

/** Shadow HP growth per day of neglect. */
export const SHADOW_HP_PER_DAY = 10;

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
    // Already active today — no change
    return currentStreak;
  } else if (diffDays === 1) {
    // Consecutive day — increment
    return currentStreak + 1;
  } else {
    // Gap — reset
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
 * Validate a focus session based on heartbeat count.
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

/** Attribute decay status for UI rendering. */
export type DecayStatus = 'stable' | 'vulnerable' | 'decaying';

/** Determine visual decay status of an attribute. */
export function getDecayStatus(lastActivityAt: Date, now: Date = new Date()): DecayStatus {
  const hoursElapsed = (now.getTime() - lastActivityAt.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed <= 24) return 'stable';
  if (hoursElapsed <= DECAY_GRACE_HOURS) return 'vulnerable';
  return 'decaying';
}

/** Human-readable level title based on level ranges. */
export function getLevelTitle(level: number): string {
  if (level <= 3) return 'Novice';
  if (level <= 6) return 'Apprentice';
  if (level <= 10) return 'Journeyman';
  if (level <= 15) return 'Adept';
  if (level <= 20) return 'Expert';
  if (level <= 30) return 'Master';
  if (level <= 50) return 'Grandmaster';
  return 'Ascendant';
}
