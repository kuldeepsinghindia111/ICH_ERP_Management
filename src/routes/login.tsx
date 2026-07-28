import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.navigate({ to: '/', replace: true });
    }
    
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
          Welcome Back
        </h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Sign in to access the management suite.
        </p>
        
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
          {success && <p className="text-sm text-green-600">{success}</p>}
          <button
            type="submit"
            disabled={loading || (isResetMode && cooldownTime > 0)}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading 
              ? 'Processing...' 
              : (isResetMode 
                  ? (cooldownTime > 0 ? `Wait ${cooldownTime}s` : 'Send Reset Email') 
                  : 'Sign In')}
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
      </div>
    </div>
  );
}
