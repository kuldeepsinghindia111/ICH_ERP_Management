import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function SupabaseStatus() {
  const [status, setStatus] = useState<'connected' | 'checking' | 'paused'>('checking');

  useEffect(() => {
    let mounted = true;
    
    const checkConnection = async () => {
      try {
        // A simple query to check if the database is responding.
        // We select from 'users' with limit 1, which is lightweight.
        // If the project is paused, the fetch will fail or return a 50x error.
        const { error } = await supabase.from('users').select('id').limit(1);
        
        if (mounted) {
          if (error && (error.code === '503' || error.message?.toLowerCase().includes('fetch'))) {
             setStatus('paused');
          } else {
             // Even if there's an RLS error (which means we reached the DB), it means it's online.
             setStatus('connected');
          }
        }
      } catch (err) {
        if (mounted) setStatus('paused');
      }
    };

    checkConnection();
    
    // Check periodically every 60 seconds
    const interval = setInterval(checkConnection, 60000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="hidden md:flex items-center gap-1.5 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking DB...</span>
      </div>
    );
  }

  if (status === 'paused') {
    return (
      <div className="hidden md:flex items-center gap-1.5 text-destructive font-medium bg-destructive/10 px-2 py-1 rounded-md">
        <WifiOff className="h-3.5 w-3.5" />
        <span>Database Paused/Offline</span>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">
      <Wifi className="h-3.5 w-3.5" />
      <span>Supabase Connected</span>
    </div>
  );
}
