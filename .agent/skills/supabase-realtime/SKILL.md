---
name: supabase-realtime
description: Supabase Realtime patterns for ValoHub. Use when implementing live updates, notifications, presence, messaging, or any real-time features. Covers channels, broadcast, presence, and postgres_changes.
metadata:
  author: valohub-team
  version: "1.0"
---

# Supabase Realtime Guide

Comprehensive guide for implementing Supabase Realtime features in ValoHub.

## When to Use

- Live tournament bracket updates
- Team chat and messaging
- Player presence (online/offline status)
- Real-time notifications
- Match score updates
- Lobby systems

## Channel Types

| Type | Use Case | Example |
|------|----------|---------|
| `broadcast` | Ephemeral messages between clients | Chat, cursor positions |
| `presence` | Track online users | Who's in lobby, typing indicators |
| `postgres_changes` | Database change notifications | New tournament, team updates |

## Basic Setup

```typescript
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeChannel(channelName: string) {
  useEffect(() => {
    const channel: RealtimeChannel = supabase.channel(channelName);

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Connected to ${channelName}`);
      }
    });

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName]);
}
```

## Postgres Changes (Database Events)

Listen to INSERT, UPDATE, DELETE events:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type Tournament = Database['public']['Tables']['tournaments']['Row'];

export function useTournamentUpdates(tournamentId: string) {
  const [tournament, setTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`tournament:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setTournament(payload.new as Tournament);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  return tournament;
}
```

## Broadcast (Client-to-Client)

For ephemeral messages that don't need persistence:

```typescript
export function useTeamChat(teamId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`team-chat:${teamId}`);

    channel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        setMessages((prev) => [...prev, payload as ChatMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const sendMessage = async (content: string, userId: string) => {
    const channel = supabase.channel(`team-chat:${teamId}`);
    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: { content, userId, timestamp: new Date().toISOString() },
    });
  };

  return { messages, sendMessage };
}
```

## Presence (Online Status)

Track who's online:

```typescript
import type { RealtimePresenceState } from '@supabase/supabase-js';

interface UserPresence {
  oderId: string;
  odername: string;
  online_at: string;
}

export function useLobbyPresence(lobbyId: string, currentUser: UserPresence) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`lobby:${lobbyId}`, {
      config: { presence: { key: currentUser.user_id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state: RealtimePresenceState<UserPresence> = channel.presenceState();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(currentUser);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobbyId, currentUser]);

  return onlineUsers;
}
```

## Best Practices

### Channel Naming Convention

```
{resource}:{id}:{optional-subresource}

Examples:
- tournament:123
- team:456:chat
- match:789:scores
- lobby:abc:presence
```

### Performance Tips

1. **Unsubscribe on unmount** — Always clean up channels
2. **Use filters** — Don't listen to entire tables
3. **Debounce updates** — For high-frequency changes
4. **Limit channels** — Max ~100 concurrent channels per client

### Error Handling

```typescript
channel.subscribe((status, error) => {
  if (status === 'CHANNEL_ERROR') {
    console.error('Realtime error:', error);
    // Implement retry logic
  }
  if (status === 'TIMED_OUT') {
    console.warn('Connection timed out, retrying...');
  }
});
```

## RLS Considerations

Realtime respects Row Level Security. Ensure your policies allow:

```sql
-- Example: Allow team members to receive team updates
CREATE POLICY "Team members can receive realtime updates"
ON teams FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);
```
