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

-- RLS Policies
ALTER TABLE public.auth_otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & authenticated users to read/insert/update
CREATE POLICY "Allow public read for OTP verification" ON public.auth_otp_codes
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert for OTP generation" ON public.auth_otp_codes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update for OTP verification" ON public.auth_otp_codes
    FOR UPDATE USING (true);
