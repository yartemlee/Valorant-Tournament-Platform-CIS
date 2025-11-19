import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setAuthState({
            user: session.user,
            profile,
            session,
            loading: false,
          });
        } else {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
          });
        }
      } catch (error) {
        setAuthState({
          user: null,
          profile: null,
          session: null,
          loading: false,
        });
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setAuthState({
            user: session.user,
            profile,
            session,
            loading: false,
          });
        } else {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      
      return {
        ...data,
        email: user?.email || '',
      };
    } catch (error) {
      return null;
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      let loginEmail = email;

      if (!email.includes('@')) {
        const { data: emailData, error: emailError } = await supabase
          .rpc('get_email_by_username', { username_input: email });

        if (emailError || !emailData) {
          toast.error('Пользователь с таким никнеймом не найден');
          return false;
        }

        loginEmail = emailData;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Неверный email/никнейм или пароль');
        } else {
          toast.error(error.message);
        }
        return false;
      }

      toast.success('Добро пожаловать!');
      return true;
    } catch (error) {
      toast.error('Произошла ошибка при входе');
      return false;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    additionalData?: Record<string, unknown>
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username,
            ...additionalData,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Email уже зарегистрирован');
        } else if (error.message.includes('User already registered')) {
          toast.error('Пользователь уже зарегистрирован');
        } else {
          toast.error(error.message);
        }
        return false;
      }

      if (data.user) {
        toast.success('Аккаунт создан! Добро пожаловать в VALHUB!');
        return true;
      }

      return false;
    } catch (error) {
      toast.error('Произошла ошибка при регистрации');
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast.success('Вы вышли из аккаунта');
    } catch (error) {
      toast.error('Ошибка при выходе');
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast.error('Ошибка входа через Google');
    }
  };

  const signInWithDiscord = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast.error('Ошибка входа через Discord');
    }
  };

  return {
    user: authState.user,
    profile: authState.profile,
    session: authState.session,
    loading: authState.loading,
    isAuthenticated: !!authState.user,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithDiscord,
  };
};

