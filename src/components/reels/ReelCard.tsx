import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  BookmarkCheck,
  Music2,
  BadgeCheck,
  Play,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reel } from '@/hooks/useReels';

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  isPaused: boolean;
  isSaved: boolean;
  showLikeAnimation: boolean;
  onTogglePause: () => void;
  onDoubleTap: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onViewIncrement: () => void;
}

export default function ReelCard({
  reel,
  isActive,
  isMuted,
  isPaused,
  isSaved,
  showLikeAnimation,
  onTogglePause,
  onDoubleTap,
  onLike,
  onComment,
  onShare,
  onSave,
  onViewIncrement,
}: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  
  // Handle video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isActive) {
      video.play().catch(() => {});
      onViewIncrement();
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive, onViewIncrement]);
  
  // Handle pause state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;
    
    if (isPaused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isPaused, isActive]);
  
  // Update progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      const percent = (video.currentTime / video.duration) * 100;
      setProgress(percent);
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);
  
  const handleClick = () => {
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 600);
    onTogglePause();
  };
  
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };
  
  return (
    <div className="h-screen w-full relative flex items-center justify-center bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video_url}
        className="h-full w-full object-cover"
        loop
        muted={isMuted}
        playsInline
        onClick={handleClick}
        onDoubleClick={onDoubleTap}
      />
      
      {/* Cinematic gradient overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>
      
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Play/Pause indicator */}
      {showPlayIcon && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-24 h-24 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center animate-scale-in border border-white/20">
            {isPaused ? (
              <Play className="h-12 w-12 text-white ml-1" />
            ) : (
              <Pause className="h-10 w-10 text-white" />
            )}
          </div>
        </div>
      )}
      
      {/* Double-tap like animation */}
      {showLikeAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart className="h-36 w-36 text-rose-500 fill-rose-500 animate-ping-once drop-shadow-2xl" />
        </div>
      )}
      
      {/* Creator info */}
      <div className="absolute bottom-0 left-0 right-20 p-5 pb-10">
        {/* User info row */}
        <div className="flex items-center gap-3 mb-4">
          <Link to={`/profile/${reel.profile?.username}`}>
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-white/40 ring-offset-2 ring-offset-black/50">
                <AvatarImage src={reel.profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                  {getInitials(reel.profile?.display_name || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-black">
                <span className="text-[10px]">+</span>
              </div>
            </div>
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${reel.profile?.username}`} className="flex items-center gap-1.5 group">
              <span className="text-white font-semibold text-base group-hover:underline">
                {reel.profile?.display_name}
              </span>
              {reel.profile?.is_verified && (
                <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
              )}
            </Link>
            <p className="text-white/60 text-sm">@{reel.profile?.username}</p>
          </div>
          
          <Button 
            size="sm" 
            className="rounded-full bg-white text-black hover:bg-white/90 font-semibold px-5 h-9"
          >
            Follow
          </Button>
        </div>
        
        {/* Caption */}
        {reel.caption && (
          <p className="text-white text-sm mb-4 line-clamp-2 leading-relaxed">
            {reel.caption}
          </p>
        )}
        
        {/* Audio pill */}
        {reel.audio_name && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
              <Music2 className="h-3.5 w-3.5 text-white animate-pulse" />
              <span className="text-white/90 text-xs font-medium truncate max-w-[180px]">
                {reel.audio_name}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Action buttons - Right side */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-6">
        {/* Like */}
        <ActionButton
          icon={Heart}
          count={formatCount(reel.like_count)}
          isActive={reel.is_liked}
          activeColor="rose"
          onClick={onLike}
        />
        
        {/* Comment */}
        <ActionButton
          icon={MessageCircle}
          count={formatCount(reel.comment_count)}
          onClick={onComment}
        />
        
        {/* Share */}
        <ActionButton
          icon={Share2}
          count={formatCount(reel.share_count)}
          onClick={onShare}
        />
        
        {/* Save */}
        <ActionButton
          icon={isSaved ? BookmarkCheck : Bookmark}
          isActive={isSaved}
          activeColor="amber"
          onClick={onSave}
        />
        
        {/* Audio disc */}
        {reel.audio_name && (
          <div className="mt-2">
            <div className={cn(
              "w-11 h-11 rounded-full bg-gradient-to-br from-primary via-accent to-primary p-[2px]",
              isActive && !isPaused && "animate-spin-slow"
            )}>
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center border-2 border-black">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={reel.profile?.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-[10px] text-white">
                    ♪
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  count?: string;
  isActive?: boolean;
  activeColor?: 'rose' | 'amber' | 'primary';
  onClick: () => void;
}

function ActionButton({ icon: Icon, count, isActive, activeColor = 'primary', onClick }: ActionButtonProps) {
  const colorClasses = {
    rose: 'from-rose-500/30 to-pink-500/30 text-rose-500 shadow-rose-500/30',
    amber: 'from-amber-500/30 to-orange-500/30 text-amber-400 shadow-amber-500/30',
    primary: 'from-primary/30 to-accent/30 text-primary shadow-primary/30',
  };
  
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group">
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
        "backdrop-blur-md border border-white/10",
        isActive 
          ? `bg-gradient-to-br ${colorClasses[activeColor]} shadow-lg` 
          : "bg-white/10 hover:bg-white/20 hover:scale-110 active:scale-95"
      )}>
        <Icon className={cn(
          "h-6 w-6 transition-all duration-300",
          isActive ? `${colorClasses[activeColor].split(' ').pop()} fill-current` : "text-white"
        )} />
      </div>
      {count && (
        <span className={cn(
          "text-xs font-semibold transition-colors",
          isActive ? colorClasses[activeColor].split(' ').pop() : "text-white"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}
