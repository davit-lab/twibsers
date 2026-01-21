import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIncomingCalls } from '@/hooks/useWebRTC';
import { supabase } from '@/integrations/supabase/client';
import IncomingCallModal from '@/components/messaging/IncomingCallModal';

export default function GlobalCallProvider() {
  const navigate = useNavigate();
  const location = useLocation();
  const { incomingCall, callerProfile, clearIncomingCall } = useIncomingCalls();

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

  // Don't show modal if we're already viewing this conversation
  if (!incomingCall || isAlreadyInConversation) {
    return null;
  }

  return (
    <IncomingCallModal
      session={incomingCall}
      callerProfile={callerProfile}
      onAnswer={handleAnswerCall}
      onDecline={handleDeclineCall}
    />
  );
}
