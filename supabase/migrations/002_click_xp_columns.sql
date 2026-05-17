-- Add click system & XP columns for the campus clicker feature
-- These columns track accumulated click earnings, XP, and PC upgrade level.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS total_clicks  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp            integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pc_level      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_frozen_until date,
  ADD COLUMN IF NOT EXISTS streak_milestone_reached integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_purchase_done boolean NOT NULL DEFAULT false;
