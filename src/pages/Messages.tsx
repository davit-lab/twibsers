import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import ConversationList from '@/components/messaging/ConversationList';
import MessageThread from '@/components/messaging/MessageThread';
import CallHistory from '@/components/messaging/CallHistory';
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
  const [activeTab, setActiveTab] = useState<'messages' | 'calls'>('messages');
  
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [pendingAnswerCall, setPendingAnswerCall] = useState<any>(null);

  // Handle answering call from global provider via URL param
  useEffect(() => {
    if (answerCallId && selectedConvId) {
      const fetchCallSession = async () => {
        const { data } = await supabase
          .from('call_sessions')
          .select('*')
          .eq('id', answerCallId)
          .single();
        
        if (data) {
          setPendingAnswerCall(data);
        }
        
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
      
      if (other) {
        setLastReadAt(other.last_read_at);
      }
    };

    fetchOtherUser();

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
      {/* Ambient orbs */}
      <div className="orb orb-primary top-[15%] left-[25%]" />
      <div className="orb orb-accent bottom-[10%] right-[15%]" />

      <div className="h-[calc(100vh-48px)] lg:h-screen flex relative z-10">
        {/* Conversation List Panel */}
        <div className={cn(
          'w-full md:w-80 lg:w-96 flex flex-col',
          selectedConvId ? 'hidden md:flex' : 'flex'
        )}>
          {/* Tab switcher */}
          <div className="px-5 py-3 border-b border-border/50 bg-card">
            <div className="flex gap-1 p-1 bg-surface-2 rounded-xl">
              <button
                onClick={() => setActiveTab('messages')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'messages' 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MessageSquare className="h-4 w-4" />
                Chats
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'calls' 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Phone className="h-4 w-4" />
                Calls
              </button>
            </div>
          </div>
          
          {activeTab === 'messages' ? (
            <ConversationList
              conversations={conversations}
              loading={convsLoading}
              selectedId={selectedConvId || undefined}
              onSelect={handleSelectConversation}
            />
          ) : (
            <CallHistory />
          )}
        </div>

        {/* Message Thread Panel */}
        <div className={cn(
          'flex-1 flex flex-col',
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
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 glass-card m-4 rounded-2xl">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg">
                <MessageSquare className="h-8 w-8 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold mb-2 gradient-text">Your messages</h2>
              <p className="text-sm text-center text-muted-foreground max-w-xs">
                Send private messages to a friend. Start a conversation by visiting their profile.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
