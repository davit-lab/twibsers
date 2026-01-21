import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIncomingCalls } from '@/hooks/useIncomingCalls';
import { supabase } from '@/integrations/supabase/client';
import IncomingCallModal from '@/components/messaging/IncomingCallModal';
import CallWaitingIndicator from '@/components/calling/CallWaitingIndicator';

export default function GlobalCallProvider() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    incomingCall, 
    callerProfile, 
    callQueue,
    clearIncomingCall,
    declineQueuedCall,
  } = useIncomingCalls();

  // Check if we're already on the messages page with this conversation
  const isOnMessagesPage = location.pathname === '/messages';
  const currentConvId = new URLSearchParams(location.search).get('conv');
  const isAlreadyInConversation = isOnMessagesPage && currentConvId === incomingCall?.conversation_id;

  const handleAnswerCall = useCallback(async () => {
    if (!incomingCall) return;
    
    // Navigate to messages with the conversation and a flag to answer the call
    navigate(`/messages?conv=${incomingCall.conversation_id}&answer=${incomingCall.id}`);
    clearIncomingCall();
  }, [incomingCall, navigate, clearIncomingCall]);

  const handleDeclineCall = useCallback(async () => {
    if (!incomingCall) return;
    
    try {
      await supabase
        .from('call_sessions')
        .update({
          status: 'declined',
          ended_at: new Date().toISOString(),
        })
        .eq('id', incomingCall.id);
    } catch (error) {
      console.error('[GlobalCall] Failed to decline call:', error);
    }
    
    clearIncomingCall();
  }, [incomingCall, clearIncomingCall]);

  const handleAnswerQueuedCall = useCallback(async (sessionId: string) => {
    const queuedCall = callQueue.find(c => c.session.id === sessionId);
    if (!queuedCall) return;

    // Navigate to answer the queued call
    navigate(`/messages?conv=${queuedCall.session.conversation_id}&answer=${sessionId}`);
  }, [callQueue, navigate]);

  const handleDeclineQueuedCall = useCallback(async (sessionId: string) => {
    await declineQueuedCall(sessionId);
  }, [declineQueuedCall]);

  return (
    <>
      {/* Call waiting indicator for queued calls */}
      <CallWaitingIndicator
        queuedCalls={callQueue}
        onAnswer={handleAnswerQueuedCall}
        onDecline={handleDeclineQueuedCall}
      />

      {/* Main incoming call modal */}
      {incomingCall && !isAlreadyInConversation && (
        <IncomingCallModal
          session={incomingCall}
          callerProfile={callerProfile}
          onAnswer={handleAnswerCall}
          onDecline={handleDeclineCall}
        />
      )}
    </>
  );
}
