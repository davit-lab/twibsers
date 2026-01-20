import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import ConversationList from '@/components/messaging/ConversationList';
import MessageThread from '@/components/messaging/MessageThread';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OtherUser {
  display_name: string;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
}

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { conversations, loading: convsLoading, startConversation } = useConversations();
  
  const selectedConvId = searchParams.get('conv');
  const newUserId = searchParams.get('new');
  
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);

  // Handle starting new conversation from profile page
  useEffect(() => {
    if (newUserId && user) {
      const initConversation = async () => {
        const convId = await startConversation(newUserId);
        if (convId) {
          setSearchParams({ conv: convId });
        }
      };
      initConversation();
    }
  }, [newUserId, user]);

  // Fetch other user info when conversation is selected
  useEffect(() => {
    if (!selectedConvId || !user) {
      setOtherUser(null);
      return;
    }

    const fetchOtherUser = async () => {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          last_read_at,
          profiles (
            display_name,
            username,
            avatar_url,
            is_verified
          )
        `)
        .eq('conversation_id', selectedConvId);

      const other = participants?.find((p: any) => p.user_id !== user.id);
      const myParticipant = participants?.find((p: any) => p.user_id === user.id);
      
      if (other) {
        const profile = Array.isArray(other.profiles) ? other.profiles[0] : other.profiles;
        setOtherUser(profile);
      }
      
      // Get other user's last_read_at to show read receipts
      if (other) {
        setLastReadAt(other.last_read_at);
      }
    };

    fetchOtherUser();

    // Subscribe to read receipt updates
    const channel = supabase
      .channel(`read-receipts-${selectedConvId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${selectedConvId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.user_id !== user.id) {
            setLastReadAt(updated.last_read_at);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvId, user]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return null;
  }

  const handleSelectConversation = (convId: string) => {
    setSearchParams({ conv: convId });
  };

  const handleBack = () => {
    setSearchParams({});
  };

  return (
    <MainLayout>
      <div className="container max-w-5xl py-0 px-0 pb-24 lg:pb-0 h-[calc(100vh-4rem)]">
        <div className="flex h-full">
          {/* Conversation List - hidden on mobile when conversation selected */}
          <Card className={cn(
            'w-full md:w-80 lg:w-96 border-r rounded-none md:rounded-l-xl overflow-hidden flex flex-col',
            selectedConvId ? 'hidden md:flex' : 'flex'
          )}>
            <div className="p-4 border-b border-border">
              <h1 className="text-xl font-display font-bold">Messages</h1>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversations}
                loading={convsLoading}
                selectedId={selectedConvId || undefined}
                onSelect={handleSelectConversation}
              />
            </div>
          </Card>

          {/* Message Thread */}
          <Card className={cn(
            'flex-1 rounded-none md:rounded-r-xl overflow-hidden',
            !selectedConvId ? 'hidden md:flex' : 'flex'
          )}>
            {selectedConvId && otherUser ? (
              <MessageThread
                conversationId={selectedConvId}
                otherUser={otherUser}
                onBack={handleBack}
                lastReadAt={lastReadAt}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                <p className="font-medium text-lg">Select a conversation</p>
                <p className="text-sm text-center mt-2">
                  Choose from your existing conversations or start a new one from someone's profile
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
