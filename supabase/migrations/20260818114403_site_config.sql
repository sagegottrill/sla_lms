-- Public landing CMS. Deadlock-safe: new table only, no FKs, no CHECK.
-- After running: Dashboard → Settings → API → Reload schema (or wait ~10s).

SET lock_timeout = '8s';
SET statement_timeout = '30s';

CREATE TABLE IF NOT EXISTS public.site_config (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.site_config TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.site_config TO authenticated;

DROP POLICY IF EXISTS "site_config_select_public" ON public.site_config;
CREATE POLICY "site_config_select_public"
  ON public.site_config FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "site_config_write_staff" ON public.site_config;
CREATE POLICY "site_config_write_staff"
  ON public.site_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'program_manager')
    )
  );

DROP POLICY IF EXISTS "site_config_update_staff" ON public.site_config;
CREATE POLICY "site_config_update_staff"
  ON public.site_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'program_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'program_manager')
    )
  );

DROP POLICY IF EXISTS "site_config_delete_staff" ON public.site_config;
CREATE POLICY "site_config_delete_staff"
  ON public.site_config FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'program_manager')
    )
  );

INSERT INTO public.site_config (id, data)
VALUES ('landing_page', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
