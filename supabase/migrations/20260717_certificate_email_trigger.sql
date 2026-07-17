-- ============================================================
-- AUTOMATIC CERTIFICATE EMAIL NOTIFICATION
-- Date: 2026-07-17
-- Description: Send email automatically when a certificate is issued
-- ============================================================

-- Create function to send certificate email via Edge Function
CREATE OR REPLACE FUNCTION public.send_certificate_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile RECORD;
  service_role_key TEXT;
  supabase_url TEXT;
  email_payload JSONB;
  http_response JSONB;
BEGIN
  -- Get user profile with email
  SELECT p.name, p.email
  INTO user_profile
  FROM public.profiles p
  WHERE p.id = NEW.user_id;

  -- Skip if no email found
  IF user_profile.email IS NULL OR user_profile.email = '' THEN
    RETURN NEW;
  END IF;

  -- Get environment variables (these must be set in Supabase Dashboard → Project Settings → API)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Build email HTML content
  email_payload := jsonb_build_object(
    'to', user_profile.email,
    'subject', '🎉 Your Certificate is Ready!',
    'html', format(
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Congratulations, %s! 🎓</h1>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            You''ve successfully completed <strong>%s</strong>!
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Your certificate is now available in your dashboard. You can view and download it anytime.
          </p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;"><strong>Certificate ID:</strong> %s</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;"><strong>Issued:</strong> %s</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="%s/dashboard/certificates" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
              View Certificate
            </a>
          </div>
          <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 30px;">
            Share your achievement on LinkedIn and inspire others in the She Leads Africa community!
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            She Leads Africa | Empowering African Women Through Education
          </p>
        </div>
      </div>',
      user_profile.name,
      NEW.course_title,
      NEW.credential_id,
      to_char(NEW.completed_at, 'Month DD, YYYY'),
      COALESCE(supabase_url, 'https://app.sheleadsafrica.org')
    ),
    'text', format(
      'Congratulations, %s!

You''ve successfully completed %s!

Your certificate is now available in your dashboard.

Certificate ID: %s
Issued: %s

View your certificate: %s/dashboard/certificates

Share your achievement on LinkedIn and inspire others!

---
She Leads Africa | Empowering African Women Through Education',
      user_profile.name,
      NEW.course_title,
      NEW.credential_id,
      to_char(NEW.completed_at, 'Month DD, YYYY'),
      COALESCE(supabase_url, 'https://app.sheleadsafrica.org')
    )
  );

  -- Call send-email Edge Function using pg_net (if available)
  -- Note: This requires pg_net extension and proper configuration
  -- If pg_net is not available, this will fail silently
  BEGIN
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := email_payload
    ) INTO http_response;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the certificate creation
    RAISE NOTICE 'Failed to send certificate email: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Create trigger to fire after certificate insert
DROP TRIGGER IF EXISTS on_certificate_created ON public.certificates;

CREATE TRIGGER on_certificate_created
  AFTER INSERT ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.send_certificate_email();

-- ============================================================
-- SETUP INSTRUCTIONS
-- ============================================================
-- 1. Ensure pg_net extension is enabled:
--    Enable in Supabase Dashboard → Database → Extensions → pg_net
--
-- 2. Set configuration variables in Supabase Dashboard → SQL Editor:
--    ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
--    ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
--
-- 3. Ensure send-email Edge Function is deployed
--
-- 4. Test by completing a course - certificate email should arrive automatically
