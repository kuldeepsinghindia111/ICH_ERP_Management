-- Table for storing 4-digit email OTP verification codes
CREATE TABLE IF NOT EXISTS public.auth_otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by email and expiration
CREATE INDEX IF NOT EXISTS idx_auth_otp_email_expires ON public.auth_otp_codes(email, expires_at);

-- RLS Policies for auth_otp_codes
ALTER TABLE public.auth_otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for OTP verification" ON public.auth_otp_codes
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert for OTP generation" ON public.auth_otp_codes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update for OTP verification" ON public.auth_otp_codes
    FOR UPDATE USING (true);

-- Ensure user_roles status column exists and default is pending
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
