import { useEffect, useState, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/database.types';

type DesktopSession = Database['public']['Tables']['desktop_sessions']['Row'];

export interface DesktopStatus {
  isOnline: boolean;
  valorantRunning: boolean;
  valorantStatus: string | null;
  partyId: string | null;
  partyCode: string | null;
  partySize: number;
  lastHeartbeat: string | null;
}

/**
 * Hook для получения статуса desktop приложения пользователя
 * Подписывается на real-time обновления из desktop_sessions
 */
export function useDesktopStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeStatus, setRealtimeStatus] = useState<DesktopStatus | null>(null);

  // Fetch initial status
  const { data: initialSession, isLoading } = useQuery({
    queryKey: ['desktop-session', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('desktop_sessions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useDesktopStatus] Error fetching session:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 10000, // 10 seconds
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channelName = `desktop-session:${user.id}`;
    console.log('[useDesktopStatus] Subscribing to:', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'desktop_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useDesktopStatus] Change:', payload.eventType);

          if (payload.eventType === 'DELETE') {
            setRealtimeStatus({
              isOnline: false,
              valorantRunning: false,
              valorantStatus: null,
              partyId: null,
              partyCode: null,
              partySize: 0,
              lastHeartbeat: null,
            });
          } else {
            const session = payload.new as DesktopSession;
            setRealtimeStatus(mapSessionToStatus(session));
          }

          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['desktop-session', user.id] });
        }
      )
      .subscribe((status) => {
        console.log('[useDesktopStatus] Subscription status:', status);
      });

    return () => {
      console.log('[useDesktopStatus] Unsubscribing from:', channelName);
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Map session to status
  const mapSessionToStatus = (session: DesktopSession): DesktopStatus => ({
    isOnline: session.is_online ?? false,
    valorantRunning: session.valorant_running ?? false,
    valorantStatus: session.valorant_status,
    partyId: session.current_party_id,
    partyCode: session.current_party_code,
    partySize: session.party_size ?? 0,
    lastHeartbeat: session.last_heartbeat,
  });

  // Get current status (prefer realtime, fallback to initial)
  const status = realtimeStatus || (initialSession ? mapSessionToStatus(initialSession) : null);

  // Check if desktop is connected (heartbeat within last 30 seconds)
  const isConnected = useCallback(() => {
    if (!status?.lastHeartbeat) return false;

    const lastHeartbeat = new Date(status.lastHeartbeat);
    const now = new Date();
    const diffSeconds = (now.getTime() - lastHeartbeat.getTime()) / 1000;

    return diffSeconds < 30;
  }, [status?.lastHeartbeat]);

  return {
    status,
    isLoading,
    isConnected: isConnected(),
    isValorantRunning: status?.valorantRunning ?? false,
    isInGame: status?.valorantStatus === 'in_game' || status?.valorantStatus === 'in_pregame',
  };
}

/**
 * Hook для получения статуса desktop другого пользователя
 * Используется для отображения статуса участников лобби
 */
export function useUserDesktopStatus(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ['desktop-session', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('desktop_sessions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return null;
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 10000,
  });

  // Subscribe to realtime
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`desktop-session-user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'desktop_sessions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['desktop-session', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const isOnline = session?.is_online ?? false;
  const isValorantRunning = session?.valorant_running ?? false;

  return {
    isLoading,
    isOnline,
    isValorantRunning,
    valorantStatus: session?.valorant_status ?? null,
    partyCode: session?.current_party_code ?? null,
  };
}
