import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import ConversationList from '@/components/messaging/ConversationList';
import MessageThread from '@/components/messaging/MessageThread';
import CallHistory from '@/components/messaging/CallHistory';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Phone } from 'lucide-react';
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
  const answerCallId = searchParams.get('answer');
  const [activeTab, setActiveTab] = useState<string>('messages');
  
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [pendingAnswerCall, setPendingAnswerCall] = useState<any>(null);

  // Handle answering call from global provider via URL param
  useEffect(() => {
    if (answerCallId && selectedConvId) {
      // Fetch the call session to pass to MessageThread
      const fetchCallSession = async () => {
        const { data } = await supabase
          .from('call_sessions')
          .select('*')
          .eq('id', answerCallId)
          .single();
        
        if (data) {
          setPendingAnswerCall(data);
        }
        
        // Clear the answer param from URL
        setSearchParams({ conv: selectedConvId });
      };
      fetchCallSession();
    }
  }, [answerCallId, selectedConvId]);

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
      setOtherUserId(null);
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
        setOtherUserId(other.user_id);
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
      <div className="h-[calc(100vh-48px)] lg:h-screen flex">
        {/* Conversation List */}
        <div className={cn(
          'w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-background',
          selectedConvId ? 'hidden md:flex' : 'flex'
        )}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-border">
              <TabsList className="w-full grid grid-cols-2 h-9">
                <TabsTrigger value="messages" className="text-sm">
                  Chats
                </TabsTrigger>
                <TabsTrigger value="calls" className="text-sm">
                  Calls
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="messages" className="flex-1 overflow-y-auto m-0">
              <ConversationList
                conversations={conversations}
                loading={convsLoading}
                selectedId={selectedConvId || undefined}
                onSelect={handleSelectConversation}
              />
            </TabsContent>
            
            <TabsContent value="calls" className="flex-1 overflow-y-auto m-0">
              <CallHistory />
            </TabsContent>
          </Tabs>
        </div>

        {/* Message Thread */}
        <div className={cn(
          'flex-1 flex flex-col bg-background',
          !selectedConvId ? 'hidden md:flex' : 'flex'
        )}>
          {selectedConvId && otherUser && otherUserId ? (
            <MessageThread
              conversationId={selectedConvId}
              otherUser={otherUser}
              otherUserId={otherUserId}
              onBack={handleBack}
              lastReadAt={lastReadAt}
              pendingAnswerCall={pendingAnswerCall}
              onCallAnswered={() => setPendingAnswerCall(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <MessageSquare className="h-12 w-12 mb-4" strokeWidth={1} />
              <p className="text-lg font-medium">Your messages</p>
              <p className="text-sm text-center mt-1">
                Send private messages to a friend
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
