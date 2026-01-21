import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { CallSession } from '@/hooks/useWebRTC';
import { createRingtone } from '@/lib/ringtone';

interface IncomingCallModalProps {
  session: CallSession;
  callerProfile: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
  onAnswer: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({
  session,
  callerProfile,
  onAnswer,
  onDecline,
}: IncomingCallModalProps) {
  const [ringDuration, setRingDuration] = useState(0);
  const ringtoneRef = useRef<ReturnType<typeof createRingtone> | null>(null);

  useEffect(() => {
    ringtoneRef.current = createRingtone();
    ringtoneRef.current.start();

    // Auto-decline after 30 seconds
    const timer = setInterval(() => {
      setRingDuration(prev => {
        if (prev >= 30) {
          onDecline();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      ringtoneRef.current?.stop();
      ringtoneRef.current = null;
    };
  }, [onDecline]);

  const handleAnswer = () => {
    ringtoneRef.current?.stop();
    ringtoneRef.current = null;
    onAnswer();
  };

  const handleDecline = () => {
    ringtoneRef.current?.stop();
    ringtoneRef.current = null;
    onDecline();
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[150px] animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center p-8">
        {/* Caller avatar with ringing animation */}
        <div className="relative mb-8">
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" style={{ animationDuration: '1.5s' }} />
          <div className="absolute -inset-4 rounded-full animate-pulse border-2 border-primary/30" />
          <div className="absolute -inset-8 rounded-full animate-pulse border border-primary/20" style={{ animationDelay: '0.5s' }} />
          
          <Avatar className="h-32 w-32 ring-4 ring-primary/50 ring-offset-4 ring-offset-black/50 shadow-glow-lg">
            <AvatarImage src={callerProfile?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-4xl font-display">
              {getInitials(callerProfile?.display_name || 'User')}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Call type indicator */}
        <div className="flex items-center gap-2 mb-2">
          {session.call_type === 'video' ? (
            <Video className="h-5 w-5 text-primary" />
          ) : (
            <Phone className="h-5 w-5 text-primary" />
          )}
          <span className="text-sm text-white/60 uppercase tracking-wider font-medium">
            Incoming {session.call_type} call
          </span>
        </div>

        {/* Caller name */}
        <h2 className="text-3xl font-display font-bold text-white mb-2">
          {callerProfile?.display_name || 'Unknown'}
        </h2>
        <p className="text-white/50 mb-8">@{callerProfile?.username || 'user'}</p>

        {/* Action buttons */}
        <div className="flex items-center gap-8">
          {/* Decline */}
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={handleDecline}
              className="btn-call-end h-16 w-16"
            >
              <PhoneOff className="h-7 w-7 text-white" />
            </Button>
            <span className="text-sm text-white/60">Decline</span>
          </div>

          {/* Answer */}
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={handleAnswer}
              className="btn-call-accept h-16 w-16"
            >
              {session.call_type === 'video' ? (
                <Video className="h-7 w-7 text-white" />
              ) : (
                <Phone className="h-7 w-7 text-white" />
              )}
            </Button>
            <span className="text-sm text-white/60">Answer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
