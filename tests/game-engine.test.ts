import {
  xpForLevel,
  computeLevel,
  levelProgress,
  computeRewards,
  applyShadowSteal,
  computeStepsNeeded,
  computeDecay,
  computeStreak,
  validateFocusSession,
  getDecayStatus,
  getLevelTitle,
  BASE_TASK_XP,
  BASE_TASK_GRIT,
  FOCUS_XP_PER_MINUTE,
  FOCUS_GRIT_PER_MINUTE,
  SHADOW_INITIAL_HP,
  SHADOW_HP_PER_DAY,
  DECAY_GRACE_HOURS
} from '../src/lib/game-engine.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('--- TESTING ENTROPY ENGINE CORE ALGORITHMS ---\n');

// 1. Non-linear Leveling
console.log('1. Leveling Formula:');
assert(xpForLevel(1) === 100, 'xpForLevel(1) === 100');
assert(xpForLevel(2) === 282, `xpForLevel(2) === 282 (actual: ${xpForLevel(2)})`);
assert(xpForLevel(3) === 519, `xpForLevel(3) === 519 (actual: ${xpForLevel(3)})`);
assert(computeLevel(0) === 1, 'computeLevel(0) === 1');
assert(computeLevel(99) === 1, 'computeLevel(99) === 1');
assert(computeLevel(100) === 1, 'computeLevel(100) === 1'); // xpForLevel(2) is 282
assert(computeLevel(282) === 2, 'computeLevel(282) === 2');
assert(computeLevel(520) === 3, 'computeLevel(520) === 3');

const prog = levelProgress(191, 1); // halfway between 100 and 282
assert(prog > 0.49 && prog < 0.51, `levelProgress halfway === ~0.5 (actual: ${prog})`);

// 2. Rewards & Focus Sessions
console.log('\n2. Rewards & Focus Sessions:');
const quickReward = computeRewards({ focusVerified: false, hasXpBoost: false });
assert(quickReward.xp === BASE_TASK_XP, `Quick XP === ${BASE_TASK_XP}`);
assert(quickReward.grit === BASE_TASK_GRIT, `Quick Grit === ${BASE_TASK_GRIT}`);

const focusReward = computeRewards({ focusVerified: true, computedDurationSec: 1800, hasXpBoost: false }); // 30 min
assert(focusReward.xp === BASE_TASK_XP + (30 * FOCUS_XP_PER_MINUTE), `Focus XP for 30m === 85 (actual: ${focusReward.xp})`);
assert(focusReward.grit === BASE_TASK_GRIT + (30 * FOCUS_GRIT_PER_MINUTE), `Focus Grit for 30m === 35 (actual: ${focusReward.grit})`);

const boostedReward = computeRewards({ focusVerified: false, hasXpBoost: true });
assert(boostedReward.xp === Math.floor(BASE_TASK_XP * 1.10), `Boosted XP === 27 (actual: ${boostedReward.xp})`);

// 3. Shadow Steal & Difficulty Scaling
console.log('\n3. Shadow Steal & Difficulty:');
const stealRes = applyShadowSteal(100, 0.20);
assert(stealRes.actualXp === 80, `Actual XP with 20% steal === 80 (actual: ${stealRes.actualXp})`);
assert(stealRes.stolenXp === 20, `Stolen XP === 20 (actual: ${stealRes.stolenXp})`);

assert(computeStepsNeeded(10) === 3, `Steps for 10 HP === 3 (actual: ${computeStepsNeeded(10)})`);
assert(computeStepsNeeded(50) === 4, `Steps for 50 HP === 4 (actual: ${computeStepsNeeded(50)})`);
assert(computeStepsNeeded(150) === 6, `Steps for 150 HP capped at 6 (actual: ${computeStepsNeeded(150)})`);

// 4. Decay Calculations
console.log('\n4. Entropy Decay Engine:');
const now = new Date('2026-09-12T12:00:00Z');

// Within 24 hours: Stable, no decay
const activeYesterday = new Date('2026-09-11T18:00:00Z');
const decayNone = computeDecay(500, activeYesterday, now);
assert(decayNone.newXp === 500 && decayNone.overdueDays === 0, 'No decay within 48h');
assert(getDecayStatus(activeYesterday, now) === 'stable', 'Status within 24h === stable');

// 36 hours: Vulnerable, no decay yet
const active36h = new Date('2026-09-11T00:00:00Z');
assert(getDecayStatus(active36h, now) === 'vulnerable', 'Status 36h === vulnerable');

// 72 hours (3 days ago): Decaying, 1 day overdue
const active3d = new Date('2026-09-09T12:00:00Z');
const decay3d = computeDecay(500, active3d, now);
assert(decay3d.overdueDays === 2, `Overdue days for 3d === 2 (actual: ${decay3d.overdueDays})`);
assert(decay3d.newXp === 450, `500 XP decaying 10% (5% * 2) === 450 (actual: ${decay3d.newXp})`);
assert(getDecayStatus(active3d, now) === 'decaying', 'Status 3d === decaying');

// Clamping at zero: never negative XP
const decayFloor = computeDecay(10, new Date('2026-08-01T12:00:00Z'), now);
assert(decayFloor.newXp === 0, `Decayed XP floored at 0, never negative (actual: ${decayFloor.newXp})`);

// 5. Streaks
console.log('\n5. Streak Engine:');
// Active yesterday (1 calendar day ago): increment
const yesterday = new Date('2026-09-11T10:00:00Z');
assert(computeStreak(5, yesterday, now) === 6, 'Streak increments on consecutive day (5 -> 6)');

// Already active today: no change
const earlierToday = new Date('2026-09-12T08:00:00Z');
assert(computeStreak(5, earlierToday, now) === 5, 'Streak unchanged if already active today (5 -> 5)');

// Gap > 1 day: reset to 1
const threeDaysAgo = new Date('2026-09-09T10:00:00Z');
assert(computeStreak(5, threeDaysAgo, now) === 1, 'Streak resets to 1 after gap (5 -> 1)');

// 6. Focus Session Anti-Cheat
console.log('\n6. Focus Session Anti-Cheat:');
assert(validateFocusSession(0).validated === false, '0 heartbeats rejected');
assert(validateFocusSession(1).validated === false, '1 heartbeat rejected (<2)');
const validSession = validateFocusSession(4);
assert(validSession.validated === true, '4 heartbeats validated (>=2)');
assert(validSession.computedDurationSec === 120, '4 heartbeats === 120s server-computed duration');

console.log('\n🎉 ALL CORE GAME ENGINE TESTS PASSED PERFECTLY!\n');
