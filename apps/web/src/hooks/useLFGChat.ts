import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type LFGMessage = Database['public']['Tables']['lfg_messages']['Row'];

export interface ChatMessage extends LFGMessage {
  sender_profile: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export interface TypingUser {
  userId: string;
  username: string;
}

/**
 * Hook для работы с чатом LFG лобби
 * Использует Postgres Changes для сообщений и Broadcast для typing indicators
 */
export function useLFGChat(lobbyId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Fetch initial messages
  const {
    data: messages,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['lfg-chat', lobbyId],
    queryFn: async () => {
      if (!lobbyId) return [];

      const { data, error } = await supabase
        .from('lfg_messages')
        .select(`
          *,
          sender_profile:profiles!lfg_messages_sender_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('lobby_id', lobbyId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        throw error;
      }

      return data as ChatMessage[];
    },
    enabled: !!lobbyId,
    staleTime: 0, // Always fresh for chat
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!lobbyId || !user?.id) return;

    const channelName = `lfg-chat:${lobbyId}`;

    // Store ref value for cleanup
    const timeoutsMap = typingTimeoutRef.current;

    const channel = supabase
      .channel(channelName)
      // Postgres changes for new messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lfg_messages',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        async (payload) => {
          // Fetch the complete message with profile
          const { data: newMessage } = await supabase
            .from('lfg_messages')
            .select(`
              *,
              sender_profile:profiles!lfg_messages_sender_id_fkey (
                id,
                username,
                avatar_url
              )
            `)
            .eq('id', (payload.new as LFGMessage).id)
            .single();

          if (newMessage) {
            queryClient.setQueryData<ChatMessage[]>(
              ['lfg-chat', lobbyId],
              (old) => [...(old ?? []), newMessage as ChatMessage]
            );
          }
        }
      )
      // Broadcast for typing indicators
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, username } = payload.payload as TypingUser;

        if (userId === user.id) return; // Ignore own typing

        // Clear existing timeout for this user
        const existingTimeout = typingTimeoutRef.current.get(userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Add to typing users
        setTypingUsers((prev) => {
          const exists = prev.some((u) => u.userId === userId);
          if (exists) return prev;
          return [...prev, { userId, username }];
        });

        // Remove after 3 seconds of no typing
        const timeout = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
          typingTimeoutRef.current.delete(userId);
        }, 3000);

        typingTimeoutRef.current.set(userId, timeout);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;

      // Clear all timeouts
      timeoutsMap.forEach((timeout) => clearTimeout(timeout));
      timeoutsMap.clear();
    };
  }, [lobbyId, user?.id, queryClient]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!lobbyId || !user?.id) {
        throw new Error('Not authenticated or no lobby');
      }

      const { error } = await supabase.from('lfg_messages').insert({
        lobby_id: lobbyId,
        sender_id: user.id,
        content: content.trim(),
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    onError: () => {},
  });

  // Send typing indicator
  const sendTyping = useCallback(async () => {
    if (!channelRef.current || !user?.id) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: user.id,
        username: profile?.username || 'Пользователь',
      },
    });
  }, [user?.id]);

  // Get typing indicator text
  const getTypingText = useCallback(() => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} печатает...`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].username} и ${typingUsers[1].username} печатают...`;
    }
    return `${typingUsers.length} человек печатают...`;
  }, [typingUsers]);

  return {
    messages: messages ?? [],
    isLoading,
    error,
    sendMessage,
    sendTyping,
    typingUsers,
    typingText: getTypingText(),
  };
}
