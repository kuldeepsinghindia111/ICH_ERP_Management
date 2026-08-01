import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { type Permissions, type Section, type UserRole, defaultPermissionsFor } from '../lib/store';

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
  refetchProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  can: () => false,
  refetchProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);

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
      currentUserIdRef.current = null;
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
        if (currentUserIdRef.current !== session.user.id) {
          currentUserIdRef.current = session.user.id;
          setIsLoading(true);
          fetchProfile(session.user.id).finally(() => setIsLoading(false));
        }
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
        if (currentUserIdRef.current !== session.user.id) {
          currentUserIdRef.current = session.user.id;
          setIsLoading(true);
          fetchProfile(session.user.id).finally(() => setIsLoading(false));
        }
      } else {
        currentUserIdRef.current = null;
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refetchProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-roles-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setProfile(payload.new as UserProfile);
          } else if (payload.eventType === 'DELETE') {
            currentUserIdRef.current = null;
            supabase.auth.signOut();
            setProfile(null);
            setUser(null);
            setSession(null);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'role-updated' },
        (payload) => {
          if (payload.payload?.userId === user.id) {
            fetchProfile(user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const can = (section: Section, action: "view" | "entry" | "edit" = "view") => {
    try {
      if (!profile) return false;
      if (profile.role === "admin") return true;
      const perms = (profile.permissions && typeof profile.permissions === "object" && !Array.isArray(profile.permissions))
        ? (profile.permissions as any)
        : {};
      let p = perms[section];
      if (!p && section === "fees") {
        p = perms.fees_complete || perms.fees_student;
      }
      if (!p && section === "fees_complete") {
        p = perms.fees;
      }
      if (!p || typeof p !== "object") return false;
      if (action === "edit") return !!p.edit;
      if (action === "entry") return p.entry !== undefined ? !!(p.entry || p.edit) : !!p.edit;
      return !!p.view;
    } catch (err) {
      console.error("Error evaluating permission:", err);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signOut, can, refetchProfile }}>
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

