-- Per-course / per-program editable certificate templates.
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS certificate_config jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS certificate_config jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.courses.certificate_config IS
  'Editable certificate template: logos, signers, body text, branding per course';
COMMENT ON COLUMN public.programs.certificate_config IS
  'Editable certificate template: logos, signers, body text, branding per program';
