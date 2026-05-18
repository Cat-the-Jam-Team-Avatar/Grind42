-- Powerup item efektlerini takip eden sütunlar
-- Her powerup kullanıldığında bu alanlar güncellenir.

alter table public.users
  -- Çift Shot Espresso: sonraki claim'de logtime 2x sayılır
  add column if not exists espresso_active boolean not null default false,
  -- Freeze: o günkü claim'de 0 coin kazanılır ama streak kırılmaz
  add column if not exists freeze_active boolean not null default false,
  -- Streak Kurtarma: streak kırılmadan önceki değeri sakla
  add column if not exists previous_streak integer not null default 0,
  -- Combo Shield: belirtilen zamana kadar combo decay yaşanmaz
  add column if not exists combo_shield_until timestamptz,
  -- Click Frenzy: belirtilen zamana kadar click window limiti kaldırılır
  add column if not exists click_frenzy_until timestamptz;
