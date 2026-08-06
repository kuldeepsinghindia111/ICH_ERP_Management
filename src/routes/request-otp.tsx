import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/request-otp')({
  component: RequestOtpLanding,
});

function RequestOtpLanding() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // 1. Force sign out immediately so user is NOT signed in or redirected to dashboard
    supabase.auth.signOut();

    const searchParams = new URLSearchParams(window.location.search);
    let emailParam = searchParams.get('email');

    // If email is not in query params, try parsing from hash or localStorage
    if (!emailParam) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      emailParam = hashParams.get('email');
    }

    if (!emailParam) {
      setStatus('error');
      setMessage('Missing email parameter in request link. Please check your invitation email.');
      return;
    }

    const cleanEmail = emailParam.trim().toLowerCase();
    setEmail(cleanEmail);

    const triggerRequest = async () => {
      try {
        // 2. Trigger edge function request to set user_roles.status = 'otp_requested'
        const { data, error } = await supabase.functions.invoke('request-otp-event', {
          body: { email: cleanEmail }
        });

        if (error || data?.error) {
          // Fallback: direct database update of status to 'otp_requested'
          const { error: dbError } = await supabase
            .from('user_roles')
            .update({ status: 'otp_requested' })
            .ilike('email', cleanEmail);

          if (dbError) throw dbError;
        }

        setStatus('success');
        setMessage('Your OTP request has been submitted to the Admin. Your Admin will now send the 4-digit verification code to your email inbox.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Failed to submit OTP request to administrator.');
      }
    };

    triggerRequest();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            {status === 'loading' && <Loader2 className="h-8 w-8 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />}
            {status === 'error' && <AlertCircle className="h-8 w-8 text-destructive" />}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {status === 'loading' && 'Submitting OTP Request...'}
            {status === 'success' && 'OTP Request Registered'}
            {status === 'error' && 'Request Error'}
          </h1>
          {email && (
            <p className="text-xs font-mono bg-muted py-1 px-3 rounded-full inline-block text-muted-foreground">
              {email}
            </p>
          )}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {message}
        </p>

        {status === 'success' && (
          <div className="space-y-4 pt-2">
            {/* INACTIVE / DISABLED BUTTON showing Request Has Been Sent */}
            <div className="w-full">
              <Button
                disabled={true}
                className="w-full h-11 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold cursor-not-allowed opacity-100 flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4 text-emerald-600" />
                Request Has Been Sent
              </Button>
              <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
                Button is inactive as your request is now queued in Admin Pending Approvals.
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-4 text-xs text-blue-800 dark:text-blue-200 text-left space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" /> What Happens Next:
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                <li>Your Admin will see <strong>"OTP Request by User"</strong> badge in Admin portal.</li>
                <li>Admin will click <strong>"User Verification Process"</strong> and click <strong>"Send OTP"</strong>.</li>
                <li>You will receive a 4-digit code in your email inbox.</li>
                <li>Communicate the 4-digit OTP to your Admin to complete verification.</li>
              </ol>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-medium text-primary hover:underline"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
