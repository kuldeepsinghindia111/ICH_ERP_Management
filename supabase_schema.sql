-- Create an enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'management', 'accountant', 'faculty');

-- Create a table to store user roles and permissions
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'faculty',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'active'
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all user roles (so the UI can display them)
CREATE POLICY "Anyone authenticated can view user roles" ON public.user_roles
    FOR SELECT TO authenticated USING (true);

-- Policy: Only admins can insert/update/delete user roles
CREATE POLICY "Admins can insert user roles" ON public.user_roles
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT role FROM public.user_roles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can update user roles" ON public.user_roles
    FOR UPDATE TO authenticated
    USING (
        (SELECT role FROM public.user_roles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can delete user roles" ON public.user_roles
    FOR DELETE TO authenticated
    USING (
        (SELECT role FROM public.user_roles WHERE id = auth.uid()) = 'admin'
    );

-- Create a trigger to automatically create a user_roles entry when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- We set the owner as 'admin' and 'active' immediately
  INSERT INTO public.user_roles (id, email, role, status)
  VALUES (new.id, new.email, 'admin', 'active'); 
  -- NOTE: Any future invites will be handled by the Edge Function which will override these values
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to update status to active when a user logs in (last_sign_in_at is updated)
CREATE OR REPLACE FUNCTION public.handle_user_login() 
RETURNS trigger AS $$
BEGIN
  IF old.last_sign_in_at IS NULL AND new.last_sign_in_at IS NOT NULL THEN
    UPDATE public.user_roles SET status = 'active' WHERE id = new.id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_login();
