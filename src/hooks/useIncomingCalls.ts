import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { showIncomingCallNotification } from '@/lib/pushNotifications';
import { CallSession } from '@/hooks/useWebRTC';

interface CallerProfile {
  display_name: string;
  username: string;
  avatar_url: string | null;
}

interface QueuedCall {
  session: CallSession;
  callerProfile: CallerProfile | null;
}

export function useIncomingCalls() {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [callerProfile, setCallerProfile] = useState<CallerProfile | null>(null);
  const [callQueue, setCallQueue] = useState<QueuedCall[]>([]);
  const [isOnActiveCall, setIsOnActiveCall] = useState(false);
  const notificationRef = useRef<Notification | null>(null);

  // Create missed call notification
  const createMissedCallNotification = useCallback(async (
    callerId: string,
    callType: 'audio' | 'video',
    conversationId: string
  ) => {
    if (!user) return;

    try {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'missed_call',
        title: `Missed ${callType} call`,
        body: `You missed a ${callType} call`,
        actor_id: callerId,
        target_type: 'conversation',
        target_id: conversationId,
        is_read: false,
      });
    } catch (error) {
      console.error('[IncomingCalls] Failed to create missed call notification:', error);
    }
  }, [user]);

  // Handle when a call times out or is declined
  const handleCallMissed = useCallback(async (session: CallSession) => {
    await createMissedCallNotification(
      session.caller_id,
      session.call_type,
      session.conversation_id
    );
  }, [createMissedCallNotification]);

  useEffect(() => {
    if (!user) return;

    console.log('[IncomingCalls] Listening for incoming calls for user:', user.id);

    const channel = supabase
      .channel('incoming-calls-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_sessions',
        },
        async (payload) => {
          const session = payload.new as CallSession;
          
          if (session.receiver_id === user.id && session.status === 'ringing') {
            console.log('[IncomingCalls] Incoming call:', session);
            
            // Fetch caller profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, username, avatar_url')
              .eq('user_id', session.caller_id)
              .single();

            // If already on a call, add to queue
            if (isOnActiveCall || incomingCall) {
              console.log('[IncomingCalls] Adding call to queue (already on call)');
              setCallQueue(prev => [...prev, { session, callerProfile: profile }]);
              
              // Show push notification for queued call
              if (profile) {
                await showIncomingCallNotification(
                  profile.display_name,
                  session.call_type,
                  session.conversation_id,
                  profile.avatar_url
                );
              }
            } else {
              setCallerProfile(profile);
              setIncomingCall(session);

              // Show push notification
              if (profile) {
                const notification = await showIncomingCallNotification(
                  profile.display_name,
                  session.call_type,
                  session.conversation_id,
                  profile.avatar_url
                );
                notificationRef.current = notification;
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
        },
        async (payload) => {
          const session = payload.new as CallSession;
          const oldSession = payload.old as CallSession;
          
          // Handle current incoming call status change
          if (incomingCall?.id === session.id && session.status !== 'ringing') {
            // If call timed out (auto-declined after 30s), create missed notification
            if (session.status === 'declined' && session.receiver_id === user.id) {
              // Check if it was a timeout vs manual decline - timeout calls have very short duration
              const declinedAt = session.ended_at ? new Date(session.ended_at) : new Date();
              const createdAt = new Date(session.created_at);
              const duration = (declinedAt.getTime() - createdAt.getTime()) / 1000;
              
              if (duration >= 28) {
                await handleCallMissed(session);
              }
            }
            
            setIncomingCall(null);
            setCallerProfile(null);
            
            if (notificationRef.current) {
              notificationRef.current.close();
              notificationRef.current = null;
            }

            // Process next call in queue
            if (callQueue.length > 0) {
              const [nextCall, ...rest] = callQueue;
              setIncomingCall(nextCall.session);
              setCallerProfile(nextCall.callerProfile);
              setCallQueue(rest);
            }
          }
          
          // Handle queued call status changes
          if (session.status !== 'ringing') {
            setCallQueue(prev => prev.filter(c => c.session.id !== session.id));
            
            // Create missed call notification for declined queued calls
            if (session.status === 'declined' && session.receiver_id === user.id) {
              const declinedAt = session.ended_at ? new Date(session.ended_at) : new Date();
              const createdAt = new Date(session.created_at);
              const duration = (declinedAt.getTime() - createdAt.getTime()) / 1000;
              
              if (duration >= 28) {
                await handleCallMissed(session);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, incomingCall?.id, isOnActiveCall, callQueue, handleCallMissed]);

  const clearIncomingCall = useCallback(() => {
    setIncomingCall(null);
    setCallerProfile(null);
    
    if (notificationRef.current) {
      notificationRef.current.close();
      notificationRef.current = null;
    }

    // Process next call in queue
    if (callQueue.length > 0) {
      const [nextCall, ...rest] = callQueue;
      setIncomingCall(nextCall.session);
      setCallerProfile(nextCall.callerProfile);
      setCallQueue(rest);
    }
  }, [callQueue]);

  const setActiveCall = useCallback((active: boolean) => {
    setIsOnActiveCall(active);
  }, []);

  const declineQueuedCall = useCallback(async (sessionId: string) => {
    const queuedCall = callQueue.find(c => c.session.id === sessionId);
    if (!queuedCall) return;

    try {
      await supabase
        .from('call_sessions')
        .update({
          status: 'declined',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('[IncomingCalls] Failed to decline queued call:', error);
    }
    
    setCallQueue(prev => prev.filter(c => c.session.id !== sessionId));
  }, [callQueue]);

  const switchToQueuedCall = useCallback((sessionId: string) => {
    const queuedCall = callQueue.find(c => c.session.id === sessionId);
    if (!queuedCall) return null;

    // Put current call on hold (we'll handle this in the component)
    const currentCall = incomingCall;
    const currentProfile = callerProfile;

    // Switch to queued call
    setIncomingCall(queuedCall.session);
    setCallerProfile(queuedCall.callerProfile);
    setCallQueue(prev => prev.filter(c => c.session.id !== sessionId));

    return { session: currentCall, callerProfile: currentProfile };
  }, [incomingCall, callerProfile, callQueue]);

  return {
    incomingCall,
    callerProfile,
    callQueue,
    isOnActiveCall,
    clearIncomingCall,
    setActiveCall,
    declineQueuedCall,
    switchToQueuedCall,
  };
}
