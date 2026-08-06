import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/request-otp')({
  component: RequestOtpLanding,
});

function RequestOtpLanding() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const emailParam = searchParams.get('email');

    if (!emailParam) {
      setStatus('error');
      setMessage('Missing email parameter in request link.');
      return;
    }

    const cleanEmail = emailParam.trim().toLowerCase();
    setEmail(cleanEmail);

    const triggerRequest = async () => {
      try {
        // 1. Try edge function request
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
        setMessage('Your request for verification code has been submitted! Your system administrator has been notified to generate your 4-digit OTP.');
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
            {status === 'success' && 'OTP Request Submitted'}
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
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-4 text-xs text-blue-800 dark:text-blue-200 text-left space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" /> Next Steps:
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Contact your System Administrator personally or via call.</li>
              <li>Ask your Admin to click <strong>"User Verification Process"</strong> in their Admin portal.</li>
              <li>Admin will click <strong>"Send OTP to User"</strong> to dispatch your 4-digit code.</li>
              <li>Provide the 4-digit OTP code received in your inbox to your Admin for instant approval.</li>
            </ol>
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
