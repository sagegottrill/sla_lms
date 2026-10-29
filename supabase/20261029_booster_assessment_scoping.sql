-- ============================================================
-- Booster readiness: required post-assessment + program-scoped courses
-- Run order: this file is idempotent — safe to re-run.
--
-- 1. Courses can carry a required post-assessment (Google Form) that gates
--    the certificate. Programs carry a program-level default so every
--    course in a program (e.g. Booster) can share one form.
-- 2. Enrollments record when the learner opened the assessment through the
--    platform — issueCertificate refuses to issue before that.
-- 3. courses.program_id is now the real program↔course link (the program
--    builder writes it). Backfill from the legacy programs.courses jsonb
--    list of titles so existing programs keep working.
-- ============================================================

alter table public.courses
  add column if not exists post_assessment_url text;
alter table public.courses
  add column if not exists post_assessment_title text default 'Post-Assessment';

alter table public.programs
  add column if not exists post_assessment_url text;
alter table public.programs
  add column if not exists post_assessment_title text default 'Post-Assessment';

alter table public.enrollments
  add column if not exists assessment_opened_at timestamptz;

-- Backfill courses.program_id from the legacy programs.courses title list.
-- Only fills NULLs; a course already linked keeps its link.
update public.courses c
set program_id = p.id
from public.programs p
where c.program_id is null
  and exists (
    select 1
    from jsonb_array_elements_text(p.courses) as t(title)
    where t.title = c.title
  );
