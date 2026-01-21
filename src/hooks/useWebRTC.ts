import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { showIncomingCallNotification, closeNotification } from '@/lib/pushNotifications';

// Free STUN servers for ICE negotiation
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export interface CallSession {
  id: string;
  conversation_id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'audio' | 'video';
  status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed';
  sdp_offer: string | null;
  sdp_answer: string | null;
  caller_ice_candidates: any[];
  receiver_ice_candidates: any[];
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface CallState {
  session: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  isConnecting: boolean;
  isConnected: boolean;
  isScreenSharing: boolean;
  error: string | null;
}

export function useWebRTC(conversationId: string | null, otherUserId: string | null) {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>({
    session: null,
    localStream: null,
    remoteStream: null,
    screenStream: null,
    isConnecting: false,
    isConnected: false,
    isScreenSharing: false,
    error: null,
  });

  const screenStreamRef = useRef<MediaStream | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('[WebRTC] Cleaning up...');
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop());
    }

    if (callState.screenStream) {
      callState.screenStream.getTracks().forEach(track => track.stop());
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    pendingIceCandidatesRef.current = [];
    
    setCallState({
      session: null,
      localStream: null,
      remoteStream: null,
      screenStream: null,
      isConnecting: false,
      isConnected: false,
      isScreenSharing: false,
      error: null,
    });
  }, [callState.localStream, callState.screenStream]);

  // Get user media
  const getUserMedia = async (type: 'audio' | 'video'): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === 'video' ? { 
        width: { ideal: 1280 }, 
        height: { ideal: 720 } 
      } : false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[WebRTC] Got local stream:', stream.getTracks().map(t => t.kind));
      return stream;
    } catch (error) {
      console.error('[WebRTC] Failed to get media:', error);
      throw new Error('Could not access camera/microphone. Please check permissions.');
    }
  };

  // Create peer connection
  const createPeerConnection = (sessionId: string, isCaller: boolean): RTCPeerConnection => {
    console.log('[WebRTC] Creating peer connection, isCaller:', isCaller);
    
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log('[WebRTC] New ICE candidate');
        
        // Store ICE candidate in the database
        const candidateField = isCaller ? 'caller_ice_candidates' : 'receiver_ice_candidates';
        
        const { data: currentSession } = await supabase
          .from('call_sessions')
          .select(candidateField)
          .eq('id', sessionId)
          .single();

        if (currentSession) {
          const currentCandidates = (currentSession as any)[candidateField] || [];
          const updatedCandidates = [...currentCandidates, event.candidate.toJSON()];
          
          await supabase
            .from('call_sessions')
            .update({ [candidateField]: updatedCandidates })
            .eq('id', sessionId);
        }
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track.kind);
      setCallState(prev => ({
        ...prev,
        remoteStream: event.streams[0],
      }));
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        setCallState(prev => ({
          ...prev,
          isConnecting: false,
          isConnected: true,
        }));
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setCallState(prev => ({
          ...prev,
          error: 'Connection lost',
        }));
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('[WebRTC] ICE gathering state:', pc.iceGatheringState);
    };

    return pc;
  };

  // Add ICE candidates to peer connection
  const addIceCandidates = async (candidates: any[]) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    for (const candidate of candidates) {
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('[WebRTC] Added ICE candidate');
        } else {
          pendingIceCandidatesRef.current.push(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('[WebRTC] Failed to add ICE candidate:', error);
      }
    }
  };

  // Process pending ICE candidates
  const processPendingIceCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;

    for (const candidate of pendingIceCandidatesRef.current) {
      try {
        await pc.addIceCandidate(candidate);
        console.log('[WebRTC] Added pending ICE candidate');
      } catch (error) {
        console.error('[WebRTC] Failed to add pending ICE candidate:', error);
      }
    }
    pendingIceCandidatesRef.current = [];
  };

  // Start a call (caller)
  const startCall = async (type: 'audio' | 'video') => {
    if (!user || !conversationId || !otherUserId) {
      console.error('[WebRTC] Missing required data for call');
      return null;
    }

    try {
      setCallState(prev => ({ ...prev, isConnecting: true, error: null }));

      // Get local stream
      const localStream = await getUserMedia(type);
      setCallState(prev => ({ ...prev, localStream }));

      // Create call session in database
      const { data: session, error } = await supabase
        .from('call_sessions')
        .insert({
          conversation_id: conversationId,
          caller_id: user.id,
          receiver_id: otherUserId,
          call_type: type,
          status: 'ringing',
        })
        .select()
        .single();

      if (error || !session) {
        throw new Error('Failed to create call session');
      }

      console.log('[WebRTC] Call session created:', session.id);
      setCallState(prev => ({ ...prev, session: session as CallSession }));

      // Create peer connection
      const pc = createPeerConnection(session.id, true);
      peerConnectionRef.current = pc;

      // Add local tracks
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Store offer in database
      await supabase
        .from('call_sessions')
        .update({ sdp_offer: JSON.stringify(offer) })
        .eq('id', session.id);

      // Subscribe to session updates
      subscribeToSession(session.id, true);

      return session.id;
    } catch (error: any) {
      console.error('[WebRTC] Failed to start call:', error);
      setCallState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to start call',
      }));
      cleanup();
      return null;
    }
  };

  // Answer a call (receiver)
  const answerCall = async (session: CallSession) => {
    if (!user) return;

    try {
      setCallState(prev => ({ ...prev, isConnecting: true, error: null, session }));

      // Get local stream
      const localStream = await getUserMedia(session.call_type);
      setCallState(prev => ({ ...prev, localStream }));

      // Create peer connection
      const pc = createPeerConnection(session.id, false);
      peerConnectionRef.current = pc;

      // Add local tracks
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Set remote description (the offer)
      if (session.sdp_offer) {
        const offer = JSON.parse(session.sdp_offer);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('[WebRTC] Set remote offer');

        // Process any pending ICE candidates
        await processPendingIceCandidates();
        await addIceCandidates(session.caller_ice_candidates || []);
      }

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Update session with answer and status
      await supabase
        .from('call_sessions')
        .update({
          sdp_answer: JSON.stringify(answer),
          status: 'accepted',
          started_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      // Subscribe to session updates
      subscribeToSession(session.id, false);
    } catch (error: any) {
      console.error('[WebRTC] Failed to answer call:', error);
      setCallState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to answer call',
      }));
      cleanup();
    }
  };

  // Subscribe to session updates for signaling
  const subscribeToSession = (sessionId: string, isCaller: boolean) => {
    console.log('[WebRTC] Subscribing to session:', sessionId);

    const channel = supabase
      .channel(`call-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          const updated = payload.new as CallSession;
          console.log('[WebRTC] Session updated:', updated.status);

          setCallState(prev => ({ ...prev, session: updated }));

          const pc = peerConnectionRef.current;
          if (!pc) return;

          // Handle status changes
          if (updated.status === 'declined' || updated.status === 'ended') {
            cleanup();
            return;
          }

          // Caller: process answer when receiver accepts
          if (isCaller && updated.sdp_answer && !pc.remoteDescription) {
            try {
              const answer = JSON.parse(updated.sdp_answer);
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              console.log('[WebRTC] Set remote answer');
              await processPendingIceCandidates();
            } catch (error) {
              console.error('[WebRTC] Failed to set remote answer:', error);
            }
          }

          // Process new ICE candidates
          const candidatesField = isCaller ? 'receiver_ice_candidates' : 'caller_ice_candidates';
          const candidates = (updated as any)[candidatesField] || [];
          if (candidates.length > 0) {
            await addIceCandidates(candidates);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  // End the call
  const endCall = async () => {
    const session = callState.session;
    
    if (session) {
      await supabase
        .from('call_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', session.id);
    }

    cleanup();
  };

  // Decline a call
  const declineCall = async (sessionId: string) => {
    await supabase
      .from('call_sessions')
      .update({ status: 'declined' })
      .eq('id', sessionId);
  };

  // Toggle audio
  const toggleAudio = () => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // Return muted state
      }
    }
    return false;
  };

  // Toggle video
  const toggleVideo = () => {
    if (callState.localStream) {
      const videoTrack = callState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled; // Return video off state
      }
    }
    return false;
  };

  // Start screen sharing
  const startScreenShare = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return false;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      });

      screenStreamRef.current = screenStream;

      // Replace video track with screen track
      const screenTrack = screenStream.getVideoTracks()[0];
      const senders = pc.getSenders();
      const videoSender = senders.find(s => s.track?.kind === 'video');

      if (videoSender) {
        await videoSender.replaceTrack(screenTrack);
      } else {
        pc.addTrack(screenTrack, screenStream);
      }

      // Handle when user stops sharing via browser UI
      screenTrack.onended = () => {
        stopScreenShare();
      };

      setCallState(prev => ({
        ...prev,
        screenStream,
        isScreenSharing: true,
      }));

      console.log('[WebRTC] Screen sharing started');
      return true;
    } catch (error) {
      console.error('[WebRTC] Failed to start screen share:', error);
      return false;
    }
  };

  // Stop screen sharing
  const stopScreenShare = async () => {
    const pc = peerConnectionRef.current;
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Restore camera video track
    if (pc && callState.localStream) {
      const cameraTrack = callState.localStream.getVideoTracks()[0];
      const senders = pc.getSenders();
      const videoSender = senders.find(s => s.track?.kind === 'video');

      if (videoSender && cameraTrack) {
        await videoSender.replaceTrack(cameraTrack);
      }
    }

    screenStreamRef.current = null;
    setCallState(prev => ({
      ...prev,
      screenStream: null,
      isScreenSharing: false,
    }));

    console.log('[WebRTC] Screen sharing stopped');
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (callState.isScreenSharing) {
      await stopScreenShare();
      return false;
    } else {
      return await startScreenShare();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    callState,
    startCall,
    answerCall,
    endCall,
    declineCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  };
}

// Hook to listen for incoming calls
export function useIncomingCalls() {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [callerProfile, setCallerProfile] = useState<{
    display_name: string;
    username: string;
    avatar_url: string | null;
  } | null>(null);
  const notificationRef = useRef<Notification | null>(null);

  useEffect(() => {
    if (!user) return;

    console.log('[WebRTC] Listening for incoming calls for user:', user.id);

    // Subscribe to new call sessions where user is the receiver
    const channel = supabase
      .channel('incoming-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_sessions',
        },
        async (payload) => {
          const session = payload.new as CallSession;
          
          // Only show if we're the receiver and call is ringing
          if (session.receiver_id === user.id && session.status === 'ringing') {
            console.log('[WebRTC] Incoming call:', session);
            
            // Fetch caller profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, username, avatar_url')
              .eq('user_id', session.caller_id)
              .single();

            setCallerProfile(profile);
            setIncomingCall(session);

            // Show push notification for the call
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
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
        },
        (payload) => {
          const session = payload.new as CallSession;
          
          // Clear incoming call if it was answered, declined, or ended
          if (incomingCall?.id === session.id && session.status !== 'ringing') {
            setIncomingCall(null);
            setCallerProfile(null);
            
            // Close the notification
            if (notificationRef.current) {
              notificationRef.current.close();
              notificationRef.current = null;
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, incomingCall?.id]);

  const clearIncomingCall = () => {
    setIncomingCall(null);
    setCallerProfile(null);
    
    // Close notification
    if (notificationRef.current) {
      notificationRef.current.close();
      notificationRef.current = null;
    }
  };

  return { incomingCall, callerProfile, clearIncomingCall };
}
