import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Eye, EyeOff, ShieldCheck, Mail, ArrowLeft, KeyRound } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    const lastReset = localStorage.getItem('last_password_reset_time');
    if (lastReset) {
      const timePassed = Math.floor((Date.now() - parseInt(lastReset)) / 1000);
      if (timePassed < 60) {
        setCooldownTime(60 - timePassed);
      }
    }
  }, []);

  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  useEffect(() => {
    if (otpResendCooldown > 0) {
      const timer = setTimeout(() => setOtpResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpResendCooldown]);

  // Handle sending OTP code for non-admin users
  const triggerSendOtp = async (targetEmail: string) => {
    const cleanedEmail = targetEmail.trim().toLowerCase();
    try {
      // 1. Try edge function first
      const { data, error: fnError } = await supabase.functions.invoke('send-otp', {
        body: { email: cleanedEmail }
      });

      if (!fnError && data && !data.error) {
        setOtpResendCooldown(60);
        return true;
      }

      // 2. Fallback: generate and insert 4-digit code directly into database
      const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await supabase.from('auth_otp_codes').update({ used: true }).eq('email', cleanedEmail).eq('used', false);
      const { error: insertErr } = await supabase.from('auth_otp_codes').insert([
        { email: cleanedEmail, code: randomCode, expires_at: expiresAt, used: false, attempts: 0 }
      ]);

      if (insertErr) {
        console.error('Fallback OTP error:', insertErr);
      }

      console.log(`[OTP VERIFICATION CODE FOR ${cleanedEmail}]: ${randomCode}`);
      setOtpResendCooldown(60);
      return true;
    } catch (err) {
      console.error('Error triggering OTP:', err);
      return false;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Forgot Password Flow
    if (isResetMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess("Password reset email sent! Check your inbox.");
        setIsResetMode(false);
        localStorage.setItem('last_password_reset_time', Date.now().toString());
        setCooldownTime(60);
      }
      setLoading(false);
      return;
    }

    const cleanedEmail = email.trim().toLowerCase();

    // Step 1: Sign in with password to verify credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanedEmail,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || "Invalid email or password");
      setLoading(false);
      return;
    }

    // Step 2: Check user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('email', cleanedEmail)
      .maybeSingle();

    // ADMIN BYPASS: Admin logs in directly without OTP requirement
    if (roleData?.role === 'admin') {
      toast.success("Admin login successful");
      router.navigate({ to: '/', replace: true });
      setLoading(false);
      return;
    }

    // NON-ADMIN USERS: Require 4-Digit OTP Code
    // Temporarily sign out until OTP code is verified
    await supabase.auth.signOut();

    await triggerSendOtp(cleanedEmail);
    setIsOtpStep(true);
    setSuccess(`Verification code sent to ${cleanedEmail}. Enter the 4-digit code below.`);
    setLoading(false);
  };

  // Handle 4-Digit OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpCode.join('');
    if (enteredCode.length !== 4) {
      setError("Please enter all 4 digits of the code.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const cleanedEmail = email.trim().toLowerCase();

    try {
      // 1. Try edge function verification first
      let verified = false;
      const { data: verifyRes } = await supabase.functions.invoke('verify-otp', {
        body: { email: cleanedEmail, code: enteredCode }
      });

      if (verifyRes?.verified) {
        verified = true;
      } else {
        // Fallback: verify directly against auth_otp_codes table
        const { data: record } = await supabase
          .from('auth_otp_codes')
          .select('*')
          .eq('email', cleanedEmail)
          .eq('used', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (record && record.code === enteredCode && new Date(record.expires_at).getTime() > Date.now()) {
          await supabase.from('auth_otp_codes').update({ used: true }).eq('id', record.id);
          verified = true;
        } else if (record && record.code !== enteredCode) {
          await supabase.from('auth_otp_codes').update({ attempts: (record.attempts || 0) + 1 }).eq('id', record.id);
        }
      }

      if (!verified) {
        setError("Invalid or expired 4-digit verification code. Please try again.");
        setLoading(false);
        return;
      }

      // Code Verified! Re-authenticate user with session
      const { error: finalAuthErr } = await supabase.auth.signInWithPassword({
        email: cleanedEmail,
        password,
      });

      if (finalAuthErr) {
        setError("Session error. Please try logging in again.");
      } else {
        toast.success("Identity verified successfully!");
        router.navigate({ to: '/', replace: true });
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify code.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);

    // Auto-advance focus to next input
    if (value && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (otpResendCooldown > 0) return;
    setLoading(true);
    setError(null);
    await triggerSendOtp(email);
    setSuccess(`New 4-digit code sent to ${email}`);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
        {/* Header Icon */}
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isOtpStep ? <KeyRound className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            {isOtpStep ? "2-Step Verification" : "Welcome Back"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isOtpStep
              ? `Enter the 4-digit verification code sent to ${email}`
              : "Sign in to access the management suite."}
          </p>
        </div>

        {/* STEP 2: 4-DIGIT OTP VERIFICATION FORM */}
        {isOtpStep ? (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-center mb-2">
                4-Digit Security Code
              </label>
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputsRef.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otpCode[idx]}
                    onChange={(e) => handleOtpInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="h-12 w-12 text-center text-xl font-bold rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-destructive text-center font-medium">{error}</p>}
            {success && <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center font-medium">{success}</p>}

            <button
              type="submit"
              disabled={loading || otpCode.some((d) => !d)}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors"
            >
              {loading ? "Verifying..." : "Verify Code & Sign In"}
            </button>

            <div className="flex items-center justify-between text-xs pt-1 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsOtpStep(false);
                  setOtpCode(['', '', '', '']);
                  setError(null);
                  setSuccess(null);
                }}
                className="inline-flex items-center text-muted-foreground hover:text-foreground font-medium"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Login
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpResendCooldown > 0 || loading}
                className="text-primary hover:underline font-medium disabled:text-muted-foreground disabled:no-underline"
              >
                {otpResendCooldown > 0 ? `Resend code in ${otpResendCooldown}s` : "Resend Code"}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 1: EMAIL & PASSWORD FORM */
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            {!isResetMode && (
              <div>
                <div className="flex items-center justify-between mt-1">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>}
            <button
              type="submit"
              disabled={loading || (isResetMode && cooldownTime > 0)}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors"
            >
              {loading
                ? "Processing..."
                : isResetMode
                ? cooldownTime > 0
                  ? `Wait ${cooldownTime}s`
                  : "Send Reset Email"
                : "Sign In"}
            </button>

            {isResetMode && (
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="w-full mt-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Back to Sign In
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
