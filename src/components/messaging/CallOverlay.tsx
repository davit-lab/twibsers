import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2,
  VolumeX,
  Maximize2,
  MoreVertical,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallOverlayProps {
  type: 'audio' | 'video';
  user: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
  onEnd: () => void;
}

export default function CallOverlay({ type, user, onEnd }: CallOverlayProps) {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [callState, setCallState] = useState<'calling' | 'connected'>('calling');

  useEffect(() => {
    // Simulate call connection after 2 seconds
    const connectTimer = setTimeout(() => {
      setCallState('connected');
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (callState !== 'connected') return;

    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#16082a] to-[#0d0618]">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
      </div>

      {/* Video preview (if video call) */}
      {type === 'video' && (
        <>
          {/* Other user's video (placeholder) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {callState === 'calling' ? (
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <Avatar className="h-32 w-32 ring-4 ring-primary/30 ring-offset-4 ring-offset-transparent">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-4xl font-display">
                      {getInitials(user.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Pulsing rings */}
                  <div className="absolute inset-0 rounded-full animate-ring-pulse border-2 border-primary/50" />
                  <div className="absolute inset-0 rounded-full animate-ring-pulse border-2 border-primary/30" style={{ animationDelay: '0.5s' }} />
                </div>
                <h2 className="text-2xl font-display font-semibold text-white mb-2">{user.display_name}</h2>
                <p className="text-white/60 animate-pulse">Calling...</p>
              </div>
            ) : (
              <div className="text-white/40 text-center">
                <Video className="h-20 w-20 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Camera preview</p>
              </div>
            )}
          </div>

          {/* Self video preview */}
          {callState === 'connected' && !isVideoOff && (
            <div className="absolute bottom-32 right-6 w-40 h-56 rounded-2xl overflow-hidden glass-premium border border-white/10 shadow-glow">
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl">
                    You
                  </AvatarFallback>
                </Avatar>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 text-white"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Audio call UI */}
      {type === 'audio' && (
        <div className="text-center z-10">
          <div className="relative inline-block mb-8">
            <Avatar className="h-40 w-40 ring-4 ring-primary/30 ring-offset-8 ring-offset-transparent shadow-glow-lg">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-5xl font-display">
                {getInitials(user.display_name)}
              </AvatarFallback>
            </Avatar>
            {callState === 'calling' && (
              <>
                <div className="absolute inset-0 rounded-full animate-ring-pulse border-2 border-primary/50" />
                <div className="absolute inset-0 rounded-full animate-ring-pulse border-2 border-primary/30" style={{ animationDelay: '0.5s' }} />
              </>
            )}
            {callState === 'connected' && (
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-online rounded-full border-4 border-[#1a0a2e] shadow-[0_0_15px_hsl(160_70%_45%/0.5)]" />
            )}
          </div>
          <h2 className="text-3xl font-display font-semibold text-white mb-2">{user.display_name}</h2>
          <p className="text-white/60 text-lg">
            {callState === 'calling' ? 'Calling...' : formatDuration(duration)}
          </p>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          {type === 'video' && callState === 'connected' && (
            <div className="flex items-center gap-3 glass-premium px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-online rounded-full animate-pulse" />
              <span className="text-white font-medium">{formatDuration(duration)}</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEnd}
          className="rounded-full h-10 w-10 bg-white/10 hover:bg-white/20 text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Call controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="glass-premium px-6 py-4 rounded-full flex items-center gap-4">
          {/* Mute */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "rounded-full h-14 w-14 transition-all duration-300",
              isMuted 
                ? "bg-white/20 text-white" 
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {/* Video toggle (only for video calls) */}
          {type === 'video' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={cn(
                "rounded-full h-14 w-14 transition-all duration-300",
                isVideoOff 
                  ? "bg-white/20 text-white" 
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </Button>
          )}

          {/* End call */}
          <Button
            onClick={onEnd}
            className="btn-call-end h-16 w-16"
          >
            <PhoneOff className="h-7 w-7 text-white" />
          </Button>

          {/* Speaker */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSpeakerOff(!isSpeakerOff)}
            className={cn(
              "rounded-full h-14 w-14 transition-all duration-300",
              isSpeakerOff 
                ? "bg-white/20 text-white" 
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {isSpeakerOff ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </Button>

          {/* More options */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-14 w-14 bg-white/10 text-white hover:bg-white/20"
          >
            <MoreVertical className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
