import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { type Permissions, type Section, type UserRole } from '../lib/store';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'pending';
  permissions: Permissions;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  can: (section: Section, action?: "view" | "edit") => boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  can: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      setProfile(data as UserProfile);
    } else {
      // If the user's role/profile is missing (meaning they were deleted by admin),
      // we must forcefully terminate their session so they can't linger in the dashboard.
      await supabase.auth.signOut();
      setProfile(null);
      setUser(null);
      setSession(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsLoading(true);
        fetchProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const can = (section: Section, action: "view" | "entry" | "edit" = "view") => {
    if (!profile) return false;
    if (profile.role === "admin") return true;
    const p = profile.permissions?.[section];
    if (!p) return false;
    if (action === "edit") return !!p.edit;
    if (action === "entry") return p.entry !== undefined ? !!(p.entry || p.edit) : !!p.edit;
    return !!p.view;
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signOut, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

