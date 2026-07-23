-- Prefer client-side sendCertificateEmail (correct app URL + newly_issued guard).
-- Drop the DB trigger so first certificate insert does not send a duplicate email.
DROP TRIGGER IF EXISTS on_certificate_created ON public.certificates;
DROP FUNCTION IF EXISTS public.send_certificate_email();
