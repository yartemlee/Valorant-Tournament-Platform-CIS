import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { SignInCredentials, SignUpCredentials } from '@/types/common.types';
import {
  ValorantGameStatus,
  ValorantLobbyInfo,
  DesktopHeartbeatData,
  DesktopStatusData,
  LFGPartyInfo
} from '@/types/electron.types';

// Declare types for Electron APIs exposed via preload
declare global {
  interface Window {
    lfgApi?: {
      startSync: (supabaseToken: string, supabaseUrl?: string) => Promise<{ success: boolean }>;
      stopSync: () => Promise<{ success: boolean }>;
      getPartyInfo: () => Promise<LFGPartyInfo | null>;
      generatePartyCode: () => Promise<{ success: boolean; code?: string; error?: string }>;
      joinPartyByCode: (code: string) => Promise<{ success: boolean; partyId?: string; error?: string }>;
      inviteToParty: (gameName: string, tagLine: string) => Promise<{ success: boolean; error?: string }>;
      onPartyCodeGenerated: (callback: (data: { partyId: string; code: string }) => void) => () => void;
      onPartyJoinResult: (callback: (data: { success: boolean; partyId?: string; error?: string }) => void) => () => void;
      onHeartbeat: (callback: (data: DesktopHeartbeatData) => void) => () => void;
      onStatusChanged: (callback: (data: DesktopStatusData) => void) => () => void;
    };
    valorantApi?: {
      getGameStatus: () => Promise<ValorantGameStatus>;
      getLobbyInfo: () => Promise<ValorantLobbyInfo | null>;
      syncToSupabase: (force?: boolean) => Promise<{ success: boolean; synced: number; failed: number }>;
    };
    appApi?: {
      getVersion: () => Promise<string>;
      quit: () => Promise<void>;
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
    };
  }
}

// Helper to check if running in Electron
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && !!window.lfgApi;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authLoading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<{ data: { user: User | null; session: Session | null }; error: AuthError | null }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ data: { user: User | null; session: Session | null }; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: 'google' | 'discord') => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Start/stop desktop sync based on session
  useEffect(() => {
    const syncDesktop = async () => {
      if (!isElectron()) return;

      if (session?.access_token) {
        // User logged in - start syncing
        try {
          // Pass access token, URL, and anon key to desktop
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
          await window.lfgApi!.startSync(session.access_token, supabaseUrl, supabaseAnonKey);
        } catch {
        }
      } else {
        // User logged out - stop syncing
        try {
          await window.lfgApi!.stopSync();
        } catch {
        }
      }
    };

    syncDesktop();
  }, [session?.access_token]);

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch {
      } finally {
        setAuthLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async ({ email, password }: SignInCredentials) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async ({ email, password, options }: SignUpCredentials) => {
    return await supabase.auth.signUp({ email, password, options });
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  const signInWithOAuth = async (provider: 'google' | 'discord') => {
    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, authLoading, signIn, signUp, signOut, signInWithOAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
}
