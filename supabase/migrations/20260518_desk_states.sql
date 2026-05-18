-- Masa (bilgisayar) durumlarını saklamak için JSONB kolonu
-- Format: {"12.5-37": {"hasComputer": true, "level": 1}, ...}

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS desk_states JSONB NOT NULL DEFAULT '{}';
