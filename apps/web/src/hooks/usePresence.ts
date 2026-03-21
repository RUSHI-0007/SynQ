import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface CursorPosition {
  lineNumber: number;
  column: number;
}

export interface UserPresence {
  userId: string;
  clerkRole: string;
  cursor: CursorPosition | null;
  online_at: string;
}

export function usePresence(projectId: string, userId: string, clerkRole: string) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [channelReady, setChannelReady] = useState(false);

  // We keep a reference to the channel so we can broadcast cursor updates
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const room = supabase.channel(`room:${projectId}`, {
      config: { presence: { key: userId } },
    });
    setChannel(room);

    room.on('presence', { event: 'sync' }, () => {
      const state = room.presenceState<UserPresence>();
      const users: UserPresence[] = [];
      
      for (const key in state) {
        // Supabase state is an array of presence objects per key
        if (state[key] && state[key].length > 0) {
          users.push(state[key][0] as UserPresence);
        }
      }
      setOnlineUsers(users);
    });

    room.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setChannelReady(true);
        await room.track({ 
          userId, 
          clerkRole, 
          cursor: null,
          online_at: new Date().toISOString() 
        } as UserPresence);
      }
    });

    return () => {
      setChannelReady(false);
      supabase.removeChannel(room);
    };
  }, [projectId, userId, clerkRole]);

  const updateCursor = useCallback(async (cursor: CursorPosition) => {
    if (channel && channelReady) {
      await channel.track({
        userId,
        clerkRole,
        cursor,
        online_at: new Date().toISOString()
      } as UserPresence);
    }
  }, [channel, channelReady, userId, clerkRole]);

  return { onlineUsers, updateCursor };
}
