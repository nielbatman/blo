import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Initial session fetch
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };
    init();

    // Auth state changes after initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      return { error };
    }

    toast.success('Welcome back!');
    navigate('/');
    return { error: null };
  };

  const signOut = async () => {
    try {
      // Proactively clear local state so UI reacts immediately.
      setUser(null);
      setSession(null);
      setLoading(true);

      // Try global sign-out first (server).
      const { error } = await supabase.auth.signOut();
      // Always clear local persisted session to be safe.
      await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        const msg = String(error.message || '').toLowerCase();
        if (!(msg.includes('session') && msg.includes('missing'))) {
          toast.error(error.message);
        } else {
          toast.success('Logged out successfully');
        }
      } else {
        toast.success('Logged out successfully');
      }
    } catch (e: any) {
      // Do not block navigation on unexpected errors.
    } finally {
      // Ensure we land on login and cannot go "Back" into a protected page snapshot.
      navigate('/login', { replace: true });
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
