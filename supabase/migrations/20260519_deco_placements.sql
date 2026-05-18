-- Dekorasyon yerleştirmeleri
-- Her kullanıcı hangi deco noktasına hangi kozmetik eşyayı koyduğunu buraya kaydeder.
-- Format: {"r2": "sleeping_cat_white", "g3": "toilet_paper", ...}

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deco_placements JSONB NOT NULL DEFAULT '{}';

-- Kullanıcının kendi deco_placements sütununu güncellemesine izin ver
-- (mevcut RLS politikasına ek — zaten varsa atla)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'users'
      AND policyname = 'Users can update own deco_placements'
  ) THEN
    CREATE POLICY "Users can update own deco_placements"
      ON users
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END;
$$;
