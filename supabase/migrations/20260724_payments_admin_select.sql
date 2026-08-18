-- Staff (admin / program manager) can read the full payments ledger for dashboards.
-- Deadlock-safe: policy-only, no ALTER TABLE.

SET lock_timeout = '8s';
SET statement_timeout = '30s';

DROP POLICY IF EXISTS "baseline_payments_select" ON public.payments;
CREATE POLICY "baseline_payments_select"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin_or_pm()
  );
