-- 1. Confirm all EXISTING users
-- Removing 'confirmed_at' as it is a generated column in newer Supabase versions
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    last_sign_in_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. Create a function to auto-confirm FUTURE users
CREATE OR REPLACE FUNCTION public.handle_new_user_confirmation() 
RETURNS TRIGGER AS $$
BEGIN
  -- We only set email_confirmed_at; 'confirmed_at' handles itself
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Set the trigger to run automatically for every new sign-up
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_confirmation();

-- Manual Alternative:
-- Supabase Dashboard -> Authentication -> Settings -> Email Auth -> Toggle "Confirm Email" to OFF.
