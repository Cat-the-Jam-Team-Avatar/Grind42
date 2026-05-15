// Streak resets every Monday. A day counts if the player logged at least 1 hour.

const MIN_HOURS_FOR_STREAK = 1;

export function getNextStreak(currentStreak, logtimeHours) {
  if (logtimeHours < MIN_HOURS_FOR_STREAK) return 0;
  return currentStreak + 1;
}

// Returns the day-of-week multiplier (0 = Mon baseline).
export function getMultiplier(streakDays) {
  const multipliers = [1.0, 1.3, 1.4, 1.5, 1.6, 1.7, 2.0];
  const index = Math.min(streakDays, multipliers.length - 1);
  return multipliers[index];
}

export function streakDayLabel(streakDays) {
  const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  return days[Math.min(streakDays, days.length - 1)] ?? "Pazar";
}
