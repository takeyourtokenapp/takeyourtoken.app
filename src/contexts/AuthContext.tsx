import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to get session:', err);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in:', { email });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        throw new Error(error.message || 'Failed to sign in');
      }

      console.log('Sign in successful:', { userId: data.user?.id });
      return data;
    } catch (err) {
      console.error('Sign in exception:', err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log('Attempting sign up:', { email });
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('Supabase Key present:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined
        }
      });

      if (error) {
        console.error('Sign up error:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        throw new Error(error.message || 'Failed to create account');
      }

      console.log('Sign up successful:', {
        userId: data.user?.id,
        needsConfirmation: !data.session
      });
      return data;
    } catch (err) {
      console.error('Sign up exception:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Cannot connect to Supabase. Please refresh the page and try again.');
      }
      throw err;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
