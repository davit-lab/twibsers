import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// STUN + TURN servers for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
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
  connectionState: RTCPeerConnectionState | null;
  iceState: RTCIceConnectionState | null;
  isFailed: boolean;
}

const initialCallState: CallState = {
  session: null,
  localStream: null,
  remoteStream: null,
  screenStream: null,
  isConnecting: false,
  isConnected: false,
  isScreenSharing: false,
  error: null,
  connectionState: null,
  iceState: null,
  isFailed: false,
};

export function useWebRTC(conversationId: string | null, otherUserId: string | null) {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>(initialCallState);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const isCleaningUpRef = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;
    
    console.log('[WebRTC] Cleaning up...');
    
    try {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('[WebRTC] Stopped track:', track.kind);
        });
        localStreamRef.current = null;
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
      setCallState(initialCallState);
    } finally {
      isCleaningUpRef.current = false;
    }
  }, []);

  // Get user media
  const getUserMedia = async (type: 'audio' | 'video'): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: type === 'video' ? { 
        width: { ideal: 1280, max: 1920 }, 
        height: { ideal: 720, max: 1080 },
        facingMode: 'user',
      } : false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[WebRTC] Got local stream:', stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
      return stream;
    } catch (error: any) {
      console.error('[WebRTC] Failed to get media:', error);
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera/microphone access denied. Please allow permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera or microphone found. Please connect a device and try again.');
      }
      throw new Error('Could not access camera/microphone. Please check permissions.');
    }
  };

  // Store ICE candidate in database
  const storeIceCandidate = async (sessionId: string, candidate: RTCIceCandidate, isCaller: boolean) => {
    const candidateField = isCaller ? 'caller_ice_candidates' : 'receiver_ice_candidates';
    
    try {
      const { data: currentSession } = await supabase
        .from('call_sessions')
        .select(candidateField)
        .eq('id', sessionId)
        .single();

      if (currentSession) {
        const currentCandidates = (currentSession as any)[candidateField] || [];
        const updatedCandidates = [...currentCandidates, candidate.toJSON()];
        
        await supabase
          .from('call_sessions')
          .update({ [candidateField]: updatedCandidates } as never)
          .eq('id', sessionId);
      }
    } catch (error) {
      console.error('[WebRTC] Failed to store ICE candidate:', error);
    }
  };

  // Create peer connection
  const createPeerConnection = (sessionId: string, isCaller: boolean): RTCPeerConnection => {
    console.log('[WebRTC] Creating peer connection, isCaller:', isCaller);
    
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] New ICE candidate:', event.candidate.type);
        storeIceCandidate(sessionId, event.candidate, isCaller);
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track.kind, event.streams.length);
      if (event.streams[0]) {
        setCallState(prev => ({
          ...prev,
          remoteStream: event.streams[0],
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      
      setCallState(prev => ({
        ...prev,
        connectionState: pc.connectionState,
        isConnecting: pc.connectionState === 'connecting' || pc.connectionState === 'new',
        isConnected: pc.connectionState === 'connected',
        isFailed: pc.connectionState === 'failed' || pc.connectionState === 'disconnected',
        error: pc.connectionState === 'failed' ? 'Connection failed. Please try again.' : 
               pc.connectionState === 'disconnected' ? 'Connection lost.' : prev.error,
      }));
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', pc.iceConnectionState);
      setCallState(prev => ({
        ...prev,
        iceState: pc.iceConnectionState,
        isFailed: prev.isFailed || pc.iceConnectionState === 'failed',
        error: pc.iceConnectionState === 'failed' ? 'Network connection failed.' : prev.error,
      }));
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
          console.log('[WebRTC] Queued ICE candidate (no remote description yet)');
        }
      } catch (error) {
        console.error('[WebRTC] Failed to add ICE candidate:', error);
      }
    }
  };

  // Process pending ICE candidates after setting remote description
  const processPendingIceCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc?.remoteDescription) return;

    console.log('[WebRTC] Processing', pendingIceCandidatesRef.current.length, 'pending ICE candidates');
    
    for (const candidate of pendingIceCandidatesRef.current) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.error('[WebRTC] Failed to add pending ICE candidate:', error);
      }
    }
    pendingIceCandidatesRef.current = [];
  };

  // Subscribe to session updates for signaling
  const subscribeToSession = (sessionId: string, isCaller: boolean) => {
    console.log('[WebRTC] Subscribing to session:', sessionId);

    const channel = supabase
      .channel(`call-signaling-${sessionId}`)
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

          // Handle call ended/declined
          if (updated.status === 'declined' || updated.status === 'ended') {
            console.log('[WebRTC] Call ended by remote');
            cleanup();
            return;
          }

          const pc = peerConnectionRef.current;
          if (!pc) return;

          // Caller: handle answer from receiver
          if (isCaller && updated.sdp_answer && !pc.remoteDescription) {
            try {
              console.log('[WebRTC] Setting remote answer');
              const answer = JSON.parse(updated.sdp_answer);
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              await processPendingIceCandidates();
              
              // Process receiver's ICE candidates
              if (updated.receiver_ice_candidates?.length) {
                await addIceCandidates(updated.receiver_ice_candidates);
              }
            } catch (error) {
              console.error('[WebRTC] Failed to set remote answer:', error);
              setCallState(prev => ({ ...prev, error: 'Failed to establish connection.' }));
            }
          }

          // Process new ICE candidates from the other party
          const candidatesField = isCaller ? 'receiver_ice_candidates' : 'caller_ice_candidates';
          const candidates = (updated as any)[candidatesField] || [];
          if (candidates.length > 0 && pc.remoteDescription) {
            await addIceCandidates(candidates);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  // Start a call (caller)
  const startCall = async (type: 'audio' | 'video') => {
    if (!user || !conversationId || !otherUserId) {
      console.error('[WebRTC] Missing required data for call');
      setCallState(prev => ({ ...prev, error: 'Missing conversation data.' }));
      return null;
    }

    // Prevent starting while already in a call
    if (callState.session) {
      console.warn('[WebRTC] Already in a call');
      return null;
    }

    try {
      setCallState(prev => ({ ...prev, isConnecting: true, error: null, isFailed: false }));

      // Get local media first
      const localStream = await getUserMedia(type);
      localStreamRef.current = localStream;
      setCallState(prev => ({ ...prev, localStream }));

      // Create call session
      const { data: session, error } = await supabase
        .from('call_sessions')
        .insert({
          conversation_id: conversationId,
          caller_id: user.id,
          receiver_id: otherUserId,
          call_type: type,
          status: 'ringing',
          caller_ice_candidates: [],
          receiver_ice_candidates: [],
        })
        .select()
        .single();

      if (error || !session) {
        throw new Error('Failed to create call. Please try again.');
      }

      console.log('[WebRTC] Call session created:', session.id);
      setCallState(prev => ({ ...prev, session: session as CallSession }));

      // Create peer connection
      const pc = createPeerConnection(session.id, true);
      peerConnectionRef.current = pc;

      // Add local tracks
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
        console.log('[WebRTC] Added local track:', track.kind);
      });

      // Create and set offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video',
      });
      await pc.setLocalDescription(offer);
      console.log('[WebRTC] Created offer');

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
        error: error.message || 'Failed to start call.',
      }));
      cleanup();
      return null;
    }
  };

  // Answer a call (receiver)
  const answerCall = async (session: CallSession) => {
    if (!user) return;

    try {
      console.log('[WebRTC] Answering call:', session.id);
      setCallState(prev => ({ ...prev, isConnecting: true, error: null, isFailed: false, session }));

      // Wait for SDP offer if not present (polling with timeout)
      let latestSession = session;
      let attempts = 0;
      const maxAttempts = 20;
      
      while (!latestSession.sdp_offer && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 250));
        const { data } = await supabase
          .from('call_sessions')
          .select('*')
          .eq('id', session.id)
          .single();

        if (data) {
          latestSession = data as CallSession;
          if (latestSession.status !== 'ringing') {
            console.warn('[WebRTC] Call no longer ringing:', latestSession.status);
            cleanup();
            return;
          }
        }
        attempts++;
      }

      if (!latestSession.sdp_offer) {
        throw new Error('Call connection timed out. Please try again.');
      }

      // Get local media
      const localStream = await getUserMedia(latestSession.call_type);
      localStreamRef.current = localStream;
      setCallState(prev => ({ ...prev, localStream }));

      // Create peer connection
      const pc = createPeerConnection(session.id, false);
      peerConnectionRef.current = pc;

      // Add local tracks
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
        console.log('[WebRTC] Added local track:', track.kind);
      });

      // Set remote description (the offer)
      const offer = JSON.parse(latestSession.sdp_offer);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('[WebRTC] Set remote offer');

      // Process any pending and existing ICE candidates
      await processPendingIceCandidates();
      if (latestSession.caller_ice_candidates?.length) {
        await addIceCandidates(latestSession.caller_ice_candidates);
      }

      // Create and set answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('[WebRTC] Created answer');

      // Update session with answer and status
      const now = new Date().toISOString();
      await supabase
        .from('call_sessions')
        .update({
          sdp_answer: JSON.stringify(answer),
          status: 'accepted',
          started_at: now,
        })
        .eq('id', session.id);

      setCallState(prev => ({
        ...prev,
        session: { ...latestSession, status: 'accepted', started_at: now },
      }));

      // Subscribe to session updates
      subscribeToSession(session.id, false);
    } catch (error: any) {
      console.error('[WebRTC] Failed to answer call:', error);
      setCallState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to answer call.',
      }));
      cleanup();
    }
  };

  // End the call
  const endCall = async () => {
    const session = callState.session;
    
    if (session) {
      try {
        const now = new Date().toISOString();
        await supabase
          .from('call_sessions')
          .update({
            status: 'ended',
            ended_at: now,
          })
          .eq('id', session.id);
        console.log('[WebRTC] Call ended:', session.id);
      } catch (error) {
        console.error('[WebRTC] Failed to update call status:', error);
      }
    }

    cleanup();
  };

  // Decline a call
  const declineCall = async (sessionId: string) => {
    try {
      const now = new Date().toISOString();
      await supabase
        .from('call_sessions')
        .update({ 
          status: 'declined',
          ended_at: now,
        })
        .eq('id', sessionId);
      console.log('[WebRTC] Call declined:', sessionId);
    } catch (error) {
      console.error('[WebRTC] Failed to decline call:', error);
    }
  };

  // Toggle audio mute
  const toggleAudio = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      console.log('[WebRTC] Audio muted:', !audioTrack.enabled);
      return !audioTrack.enabled;
    }
    return false;
  };

  // Toggle video
  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      console.log('[WebRTC] Video off:', !videoTrack.enabled);
      return !videoTrack.enabled;
    }
    return false;
  };

  // Screen sharing
  const toggleScreenShare = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return false;

    if (callState.isScreenSharing) {
      // Stop screen share
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Restore camera track
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');

      if (videoSender && cameraTrack) {
        await videoSender.replaceTrack(cameraTrack);
      }

      screenStreamRef.current = null;
      setCallState(prev => ({ ...prev, screenStream: null, isScreenSharing: false }));
      console.log('[WebRTC] Screen sharing stopped');
      return false;
    } else {
      // Start screen share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');

        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        // Handle browser stop
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setCallState(prev => ({ ...prev, screenStream, isScreenSharing: true }));
        console.log('[WebRTC] Screen sharing started');
        return true;
      } catch (error) {
        console.error('[WebRTC] Failed to start screen share:', error);
        return false;
      }
    }
  };

  // Retry failed call
  const retryCall = async () => {
    const session = callState.session;
    if (!session) return;
    
    const callType = session.call_type;
    cleanup();
    
    // Small delay before retry
    await new Promise(r => setTimeout(r, 500));
    await startCall(callType);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    callState,
    startCall,
    answerCall,
    endCall,
    declineCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    retryCall,
  };
}
