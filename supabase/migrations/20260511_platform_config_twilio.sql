-- =====================================================
-- PLATFORM CONFIG (Admin-managed)
-- =====================================================
-- Stores sensitive platform configuration (e.g. Twilio) in DB with strict RLS.
-- Edge Functions should read using service role (bypasses RLS).

CREATE TABLE IF NOT EXISTS platform_config (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- Admins can read/write platform config from the app dashboard.
CREATE POLICY "platform_config readable by admins"
  ON platform_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "platform_config manageable by admins"
  ON platform_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seed an empty Twilio config row for convenience.
INSERT INTO platform_config (id, data)
VALUES ('twilio', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

