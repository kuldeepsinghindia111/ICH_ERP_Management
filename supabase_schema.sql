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

-- 4. Create Fee Charges Table
CREATE TABLE public.fee_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    head TEXT NOT NULL,
    label TEXT,
    amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Fee Adjustments Table
CREATE TABLE public.fee_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    type TEXT NOT NULL,
    label TEXT,
    amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Fee Payments Table
CREATE TABLE public.fee_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    method TEXT NOT NULL,
    reference TEXT,
    note TEXT,
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    voided BOOLEAN DEFAULT FALSE,
    voided_at TIMESTAMPTZ,
    void_reason TEXT
);

-- Enable RLS for all three tables
ALTER TABLE public.fee_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- Policies for fee_charges (requires 'fees' permission)
CREATE POLICY "Users with fees view permission can read fee_charges" ON public.fee_charges
    FOR SELECT TO authenticated USING (public.has_permission('fees', 'view'));

CREATE POLICY "Users with fees edit permission can insert fee_charges" ON public.fee_charges
    FOR INSERT TO authenticated WITH CHECK (public.has_permission('fees', 'edit'));

CREATE POLICY "Users with fees edit permission can update fee_charges" ON public.fee_charges
    FOR UPDATE TO authenticated USING (public.has_permission('fees', 'edit'));

CREATE POLICY "Users with fees edit permission can delete fee_charges" ON public.fee_charges
    FOR DELETE TO authenticated USING (public.has_permission('fees', 'edit'));


-- Policies for fee_adjustments (requires 'fees' permission)
CREATE POLICY "Users with fees view permission can read fee_adjustments" ON public.fee_adjustments
    FOR SELECT TO authenticated USING (public.has_permission('fees', 'view'));

CREATE POLICY "Users with fees edit permission can insert fee_adjustments" ON public.fee_adjustments
    FOR INSERT TO authenticated WITH CHECK (public.has_permission('fees', 'edit'));

CREATE POLICY "Users with fees edit permission can update fee_adjustments" ON public.fee_adjustments
    FOR UPDATE TO authenticated USING (public.has_permission('fees', 'edit'));

CREATE POLICY "Users with fees edit permission can delete fee_adjustments" ON public.fee_adjustments
    FOR DELETE TO authenticated USING (public.has_permission('fees', 'edit'));


-- Policies for fee_payments (requires 'payments' permission)
CREATE POLICY "Users with payments view permission can read fee_payments" ON public.fee_payments
    FOR SELECT TO authenticated USING (public.has_permission('payments', 'view'));

CREATE POLICY "Users with payments edit permission can insert fee_payments" ON public.fee_payments
    FOR INSERT TO authenticated WITH CHECK (public.has_permission('payments', 'edit'));

CREATE POLICY "Users with payments edit permission can update fee_payments" ON public.fee_payments
    FOR UPDATE TO authenticated USING (public.has_permission('payments', 'edit'));

CREATE POLICY "Users with payments edit permission can delete fee_payments" ON public.fee_payments
    FOR DELETE TO authenticated USING (public.has_permission('payments', 'edit'));


-- 7. Create Courses Table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    credits INTEGER NOT NULL
);

-- 8. Create Faculty Table
CREATE TABLE public.faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    phone TEXT
);

-- 9. Create Sessions Table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- 10. Create College Settings Table
CREATE TABLE public.college_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ifsc TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    branch TEXT NOT NULL,
    upi_id TEXT NOT NULL,
    upi_name TEXT NOT NULL,
    support_email TEXT NOT NULL,
    support_phone TEXT NOT NULL,
    receipt_prefix TEXT NOT NULL DEFAULT 'RCPT',
    receipt_date_pattern TEXT NOT NULL DEFAULT 'YYYYMMDD',
    receipt_counter_start INTEGER NOT NULL DEFAULT 1
);

-- 11. Create Fee Structures Table
CREATE TABLE public.fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    fee_head TEXT NOT NULL,
    amount NUMERIC NOT NULL
);

-- Enable RLS for all new tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

-- Policies for courses (requires 'courses' permission)
CREATE POLICY "Users with courses view permission can read courses" ON public.courses
    FOR SELECT TO authenticated USING (public.has_permission('courses', 'view'));
CREATE POLICY "Users with courses edit permission can all courses" ON public.courses
    FOR ALL TO authenticated USING (public.has_permission('courses', 'edit'));

-- Policies for faculty (requires 'faculty' permission)
CREATE POLICY "Users with faculty view permission can read faculty" ON public.faculty
    FOR SELECT TO authenticated USING (public.has_permission('faculty', 'view'));
CREATE POLICY "Users with faculty edit permission can all faculty" ON public.faculty
    FOR ALL TO authenticated USING (public.has_permission('faculty', 'edit'));

-- Policies for sessions (requires 'settings' permission)
CREATE POLICY "Users with settings view permission can read sessions" ON public.sessions
    FOR SELECT TO authenticated USING (public.has_permission('settings', 'view'));
CREATE POLICY "Users with settings edit permission can all sessions" ON public.sessions
    FOR ALL TO authenticated USING (public.has_permission('settings', 'edit'));

-- Policies for college_settings (requires 'settings' permission)
CREATE POLICY "Users with settings view permission can read college_settings" ON public.college_settings
    FOR SELECT TO authenticated USING (public.has_permission('settings', 'view'));
CREATE POLICY "Users with settings edit permission can all college_settings" ON public.college_settings
    FOR ALL TO authenticated USING (public.has_permission('settings', 'edit'));

-- Policies for fee_structures (requires 'settings' permission)
CREATE POLICY "Users with settings view permission can read fee_structures" ON public.fee_structures
    FOR SELECT TO authenticated USING (public.has_permission('settings', 'view'));
CREATE POLICY "Users with settings edit permission can all fee_structures" ON public.fee_structures
    FOR ALL TO authenticated USING (public.has_permission('settings', 'edit'));


-- Insert default college settings
INSERT INTO public.college_settings (id, college_name, account_name, account_number, ifsc, bank_name, branch, upi_id, upi_name, support_email, support_phone)
VALUES (
    uuid_generate_v4(),
    'Imperial College Hisar',
    'Principal, Imperial College Hisar',
    '50100 2345 67890',
    'HDFC0001234',
    'HDFC Bank — Hisar Branch',
    'Hisar, Haryana, India',
    'imperial.principal@hdfcbank',
    'Imperial College Hisar',
    'accounts@imperialcollegehisar.edu',
    '+91 98100 00000'
);

-- Insert default session
INSERT INTO public.sessions (id, name, start_date, end_date)
VALUES (
    uuid_generate_v4(),
    '2026-27',
    '2026-07-01',
    '2027-06-30'
);
ALTER TABLE public.college_settings ADD COLUMN active_session_id UUID REFERENCES public.sessions(id);

-- Insert Real Faculty (as requested)
INSERT INTO public.faculty (id, name, email, department, designation, phone)
VALUES
    (uuid_generate_v4(), 'Dr. S.K. Sharma', 'sk.sharma@imperialcollegehisar.edu', 'Commerce', 'HOD', '+91 98123 45678'),
    (uuid_generate_v4(), 'Prof. Anil Gupta', 'anil.gupta@imperialcollegehisar.edu', 'Computer Applications', 'Assistant Professor', '+91 98765 43210');

-- Insert Real Courses for B.Com and BCA (as requested)
INSERT INTO public.courses (program_id, semester, code, title, credits)
SELECT id, 1, 'BC101', 'Financial Accounting I', 4 FROM public.programs WHERE name = 'B.Com';

INSERT INTO public.courses (program_id, semester, code, title, credits)
SELECT id, 1, 'BC102', 'Business Economics', 4 FROM public.programs WHERE name = 'B.Com';

INSERT INTO public.courses (program_id, semester, code, title, credits)
SELECT id, 2, 'BC201', 'Corporate Accounting', 4 FROM public.programs WHERE name = 'B.Com';

INSERT INTO public.courses (program_id, semester, code, title, credits)
SELECT id, 1, 'CA101', 'Programming in C', 4 FROM public.programs WHERE name = 'BCA';

INSERT INTO public.courses (program_id, semester, code, title, credits)
SELECT id, 2, 'CA201', 'Data Structures', 4 FROM public.programs WHERE name = 'BCA';
