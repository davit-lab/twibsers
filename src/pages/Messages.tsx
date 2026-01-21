import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useWebRTC, useIncomingCalls } from '@/hooks/useWebRTC';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import ConversationList from '@/components/messaging/ConversationList';
import MessageThread from '@/components/messaging/MessageThread';
import IncomingCallModal from '@/components/messaging/IncomingCallModal';
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
  const [activeTab, setActiveTab] = useState<string>('messages');
  
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [pendingAnswerCall, setPendingAnswerCall] = useState<any>(null);
  
  // Incoming calls handler
  const { incomingCall, callerProfile, clearIncomingCall } = useIncomingCalls();
  
  // For declining calls only - we don't use answerCall here anymore
  const declineCallHandler = async (sessionId: string) => {
    await supabase
      .from('call_sessions')
      .update({ status: 'declined' })
      .eq('id', sessionId);
  };

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

  const handleAnswerCall = async () => {
    if (incomingCall) {
      // Store the call to be answered by MessageThread
      setPendingAnswerCall(incomingCall);
      // Navigate to the conversation first, so MessageThread can handle the answer
      setSearchParams({ conv: incomingCall.conversation_id });
      clearIncomingCall();
    }
  };

  const handleDeclineCall = async () => {
    if (incomingCall) {
      await declineCallHandler(incomingCall.id);
      clearIncomingCall();
    }
  };

  const handleSelectConversation = (convId: string) => {
    setSearchParams({ conv: convId });
  };

  const handleBack = () => {
    setSearchParams({});
  };

  return (
    <MainLayout>
      {/* Incoming call modal */}
      {incomingCall && callerProfile && (
        <IncomingCallModal
          session={incomingCall}
          callerProfile={callerProfile}
          onAnswer={handleAnswerCall}
          onDecline={handleDeclineCall}
        />
      )}
      <div className="container max-w-5xl py-0 px-0 pb-24 lg:pb-0 h-[calc(100vh-4rem)]">
        <div className="flex h-full">
          {/* Conversation List - hidden on mobile when conversation selected */}
          <Card className={cn(
            'w-full md:w-80 lg:w-96 border-r rounded-none md:rounded-l-xl overflow-hidden flex flex-col',
            selectedConvId ? 'hidden md:flex' : 'flex'
          )}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <div className="p-4 border-b border-border">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="messages" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chats
                  </TabsTrigger>
                  <TabsTrigger value="calls" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
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
          </Card>

          {/* Message Thread */}
          <Card className={cn(
            'flex-1 rounded-none md:rounded-r-xl overflow-hidden',
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
