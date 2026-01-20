import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Participant {
  user_id: string;
  last_read_at: string | null;
  is_typing: boolean;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

interface LastMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  updated_at: string;
  participants: Participant[];
  last_message: LastMessage | null;
  unread_count: number;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      // Get all conversations for the current user
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      const conversationIds = participantData?.map(p => p.conversation_id) || [];

      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get conversations with participants
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          updated_at,
          conversation_participants (
            user_id,
            last_read_at,
            is_typing,
            profiles (
              username,
              display_name,
              avatar_url,
              is_verified
            )
          )
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Get last message for each conversation
      const conversationsWithMessages = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('id, content, sender_id, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Get unread count
          const myParticipant = conv.conversation_participants.find(
            (p: any) => p.user_id === user.id
          );
          
          let unreadCount = 0;
          if (myParticipant?.last_read_at) {
            const { count } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', user.id)
              .gt('created_at', myParticipant.last_read_at);
            unreadCount = count || 0;
          }

          return {
            id: conv.id,
            updated_at: conv.updated_at,
            participants: conv.conversation_participants
              .filter((p: any) => p.user_id !== user.id)
              .map((p: any) => ({
                ...p,
                profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
              })),
            last_message: messages?.[0] || null,
            unread_count: unreadCount,
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('conversations-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  const startConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('get_or_create_dm_conversation', {
        other_user_id: otherUserId,
      });

      if (error) throw error;
      
      await fetchConversations();
      return data;
    } catch (error) {
      console.error('Error starting conversation:', error);
      return null;
    }
  };

  return { conversations, loading, fetchConversations, startConversation };
}
