-- 1. Fix: Function Search Path Mutable
-- Ensure SECURITY DEFINER functions have a set search_path to prevent search path injection attacks.
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_user_login() SET search_path = public;

-- 2. Fix: Public / Signed-In Users Can Execute SECURITY DEFINER Function
-- Trigger functions do not need to be executable by the public or API roles (anon, authenticated).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_user_login() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_user_login() FROM anon, authenticated;

-- 3. Fix: has_permission Function Permissions & Security Definer
-- The has_permission function is used in RLS policies, so it MUST be executable by authenticated users.
-- To resolve the warning, we switch it from SECURITY DEFINER to SECURITY INVOKER.
-- Since the 'authenticated' role already has SELECT permissions on public.user_roles via RLS, this will work perfectly.
-- We also set the search_path as best practice.
ALTER FUNCTION public.has_permission(text, text) SECURITY INVOKER SET search_path = public;
