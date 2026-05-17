// Streak system — based on consecutive claim days, not day-of-week.
// Streak resets after 7 consecutive days (full cycle).
// A day counts if the player logged at least 1 hour.

const MIN_HOURS_FOR_STREAK = 1;
const STREAK_CYCLE_LENGTH = 7;

/**
 * Calculate the next streak value based on consecutive days.
 *
 * @param {number}      currentStreak  - Player's current streak count (0-7)
 * @param {number}      logtimeHours   - Yesterday's logtime in hours
 * @param {string|null} lastClaimDate  - ISO date string of last claim (e.g. "2026-05-16")
 * @param {string}      today          - Today's ISO date string (e.g. "2026-05-17")
 * @returns {number} New streak value
 */
export function getNextStreak(currentStreak, logtimeHours, lastClaimDate, today) {
  // No campus time → streak resets
  if (logtimeHours < MIN_HOURS_FOR_STREAK) return 0;

  // Check if the last claim was yesterday (consecutive)
  const isConsecutive = isStreakConsecutive(lastClaimDate, today);

  if (!isConsecutive) {
    // Not consecutive (first claim ever, or gap > 1 day) → start fresh
    return 1;
  }

  // Consecutive: increment, but reset after completing a full 7-day cycle
  const nextStreak = currentStreak + 1;
  if (nextStreak > STREAK_CYCLE_LENGTH) {
    // Completed full cycle → restart from day 1
    return 1;
  }
  return nextStreak;
}

/**
 * Check if lastClaimDate is exactly 1 day before today.
 *
 * @param {string|null} lastClaimDate - ISO date string (e.g. "2026-05-16")
 * @param {string}      today         - ISO date string (e.g. "2026-05-17")
 * @returns {boolean}
 */
export function isStreakConsecutive(lastClaimDate, today) {
  if (!lastClaimDate) return false;

  const last = new Date(lastClaimDate + "T00:00:00Z");
  const now = new Date(today + "T00:00:00Z");
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays === 1;
}

/**
 * Returns the streak-based multiplier.
 * Day 1 = 1.0x, Day 2 = 1.3x, ..., Day 7 = 2.0x
 * Index 0 means no active streak (0 days).
 *
 * @param {number} streakDays - Current streak count (0-7)
 * @returns {number} Multiplier value
 */
export function getMultiplier(streakDays) {
  //              0     1     2     3     4     5     6     7
  const table = [1.0, 1.0, 1.3, 1.4, 1.5, 1.6, 1.7, 2.0];
  const index = Math.min(Math.max(streakDays, 0), table.length - 1);
  return table[index];
}

/**
 * Returns a streak-based day label (e.g. "Gün 3").
 *
 * @param {number} streakDays - Current streak count (0-7)
 * @returns {string} Label like "Gün 1", "Gün 2", etc.
 */
export function streakDayLabel(streakDays) {
  if (streakDays <= 0) return "Gün 0";
  return `Gün ${Math.min(streakDays, STREAK_CYCLE_LENGTH)}`;
}

/**
 * Check if the player's streak freeze is active for today.
 *
 * @param {string|null} streakFrozenUntil - ISO date string or null
 * @param {string}      today             - Today's ISO date string
 * @returns {boolean}
 */
export function isStreakFrozen(streakFrozenUntil, today) {
  if (!streakFrozenUntil) return false;
  return streakFrozenUntil >= today;
}

export { STREAK_CYCLE_LENGTH, MIN_HOURS_FOR_STREAK };
