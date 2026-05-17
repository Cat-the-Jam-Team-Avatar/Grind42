-- Migration: Add streak tracking columns for consecutive-day streak system
-- last_claim_date: tracks when the user last claimed, used for consecutive day checks
-- streak_started_at: tracks when the current streak began

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_claim_date date,
  ADD COLUMN IF NOT EXISTS streak_started_at date;

-- Update reset_weekly to NOT reset current_streak anymore.
-- Streak is now based on consecutive claim days, not weekly cycle.
CREATE OR REPLACE FUNCTION reset_weekly()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users SET
    weekly_coins   = 0,
    claimed_today  = false;
END;
$$;
