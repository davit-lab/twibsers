import { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  MessageCircle, 
  Bookmark, 
  BookmarkCheck,
  Music2,
  BadgeCheck,
  Play,
  Pause,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reel } from '@/hooks/useReels';
import ReelShareMenu from './ReelShareMenu';
import ReelLikersModal from './ReelLikersModal';
import defaultAvatar from '@/assets/default-avatar.png';

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
  onShareToStory: () => Promise<void>;
  onCopyLink: () => void;
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
  onShareToStory,
  onCopyLink,
  onSave,
  onViewIncrement,
}: ReelCardProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [showLikersModal, setShowLikersModal] = useState(false);
  
  // Swipe detection refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);
  
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
  
  // Swipe left gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
    isSwipingRef.current = false;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const deltaX = touchStartRef.current.x - e.touches[0].clientX;
    const deltaY = Math.abs(touchStartRef.current.y - e.touches[0].clientY);
    
    // Only track horizontal swipes
    if (deltaX > 20 && deltaX > deltaY) {
      isSwipingRef.current = true;
      setSwipeOffset(Math.min(deltaX, 150));
      setShowSwipeHint(deltaX > 50);
    }
  };
  
  const handleTouchEnd = () => {
    if (!touchStartRef.current) return;
    
    if (swipeOffset > 100 && reel.profile?.username) {
      navigate(`/profile/${reel.profile.username}`);
    }
    
    setSwipeOffset(0);
    setShowSwipeHint(false);
    touchStartRef.current = null;
    isSwipingRef.current = false;
  };
  
  const handleClick = () => {
    if (isSwipingRef.current) return;
    
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 600);
    onTogglePause();
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };
  
  return (
    <div 
      className="h-screen w-full relative flex items-center justify-center bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video container with swipe animation */}
      <div 
        className="h-full w-full transition-transform duration-200"
        style={{ transform: `translateX(-${swipeOffset * 0.3}px)` }}
      >
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
      </div>
      
      {/* Swipe hint overlay */}
      {showSwipeHint && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-primary/30 to-transparent flex items-center justify-end pr-4 pointer-events-none z-30 animate-fade-in"
        >
          <div className="flex items-center gap-2 text-white">
            <span className="text-sm font-medium">Profile</span>
            <ChevronRight className="h-5 w-5 animate-pulse" />
          </div>
        </div>
      )}
      
      {/* Profile preview on swipe */}
      {swipeOffset > 50 && (
        <div 
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 pointer-events-none animate-scale-in"
          style={{ opacity: Math.min(swipeOffset / 100, 1) }}
        >
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex flex-col items-center gap-3">
            <Avatar className="h-16 w-16 ring-2 ring-primary/50">
              <AvatarImage src={reel.profile?.avatar_url || defaultAvatar} className="object-cover" />
              <AvatarFallback className="bg-muted">
                <img src={defaultAvatar} alt="" className="h-full w-full object-cover" />
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">{reel.profile?.display_name}</p>
              <p className="text-white/60 text-xs">@{reel.profile?.username}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>
      
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Play/Pause indicator */}
      {showPlayIcon && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center animate-scale-in">
            {isPaused ? (
              <Play className="h-10 w-10 text-white ml-1" />
            ) : (
              <Pause className="h-8 w-8 text-white" />
            )}
          </div>
        </div>
      )}
      
      {/* Double-tap star animation - UNIQUE: Star instead of heart */}
      {showLikeAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Star className="h-32 w-32 text-amber-400 fill-amber-400 animate-ping-once drop-shadow-2xl" />
        </div>
      )}
      
      {/* Creator info */}
      <div className="absolute bottom-0 left-0 right-16 p-4 pb-8">
        {/* User info row */}
        <div className="flex items-center gap-3 mb-3">
          <Link to={`/profile/${reel.profile?.username}`}>
            <Avatar className="h-11 w-11 ring-2 ring-white/30">
              <AvatarImage src={reel.profile?.avatar_url || defaultAvatar} className="object-cover" />
              <AvatarFallback className="bg-muted">
                <img src={defaultAvatar} alt="" className="h-full w-full object-cover" />
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${reel.profile?.username}`} className="flex items-center gap-1.5 group">
              <span className="text-white font-semibold text-sm group-hover:underline">
                {reel.profile?.display_name}
              </span>
              {reel.profile?.is_verified && (
                <BadgeCheck className="h-4 w-4 text-primary" />
              )}
            </Link>
            <p className="text-white/50 text-xs">@{reel.profile?.username}</p>
          </div>
          
          <Button 
            size="sm" 
            variant="pill"
            className="gap-1.5 px-4 h-8 text-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Follow
          </Button>
        </div>
        
        {/* Caption */}
        {reel.caption && (
          <p className="text-white/90 text-sm mb-3 line-clamp-2 leading-relaxed">
            {reel.caption}
          </p>
        )}
        
        {/* Audio pill */}
        {reel.audio_name && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Music2 className="h-3.5 w-3.5 text-white animate-pulse" />
              <span className="text-white/80 text-xs font-medium truncate max-w-[160px]">
                {reel.audio_name}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Action buttons - Right side - UNIQUE design */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
        {/* Star (like) - UNIQUE: Using star instead of heart */}
        <ActionButton
          icon={Star}
          count={formatCount(reel.like_count)}
          isActive={reel.is_liked}
          activeColor="amber"
          onClick={onLike}
          onCountClick={() => setShowLikersModal(true)}
        />
        
        {/* Comment */}
        <ActionButton
          icon={MessageCircle}
          count={formatCount(reel.comment_count)}
          onClick={onComment}
        />
        
        {/* Share */}
        <ReelShareMenu
          reelId={reel.id}
          shareCount={reel.share_count}
          creatorUsername={reel.profile?.username || ''}
          onShareToStory={onShareToStory}
          onCopyLink={onCopyLink}
        />
        
        {/* Save */}
        <ActionButton
          icon={isSaved ? BookmarkCheck : Bookmark}
          isActive={isSaved}
          activeColor="primary"
          onClick={onSave}
        />
        
        {/* Audio disc */}
        {reel.audio_name && (
          <div className="mt-1">
            <div className={cn(
              "w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 p-[2px]",
              isActive && !isPaused && "animate-spin-slow"
            )}>
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={reel.profile?.avatar_url || defaultAvatar} className="object-cover" />
                  <AvatarFallback className="bg-muted text-[8px]">♪</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Likers Modal */}
      <ReelLikersModal
        reelId={reel.id}
        open={showLikersModal}
        onOpenChange={setShowLikersModal}
      />
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  count?: string;
  isActive?: boolean;
  activeColor?: 'amber' | 'primary';
  onClick: () => void;
  onCountClick?: () => void;
}

function ActionButton({ icon: Icon, count, isActive, activeColor = 'primary', onClick, onCountClick }: ActionButtonProps) {
  const activeStyles = {
    amber: 'bg-amber-500/20 text-amber-400',
    primary: 'bg-primary/20 text-primary',
  };
  
  return (
    <div className="flex flex-col items-center gap-1">
      <button 
        onClick={onClick} 
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200",
          "bg-white/10 backdrop-blur-sm hover:bg-white/20 active:scale-95",
          isActive && activeStyles[activeColor]
        )}
      >
        <Icon className={cn(
          "h-6 w-6 transition-all",
          isActive && activeColor === 'amber' && "fill-amber-400 text-amber-400",
          isActive && activeColor === 'primary' && "fill-primary text-primary",
          !isActive && "text-white"
        )} />
      </button>
      {count && (
        <button 
          onClick={onCountClick}
          className={cn(
            "text-xs font-medium transition-colors",
            isActive && activeColor === 'amber' && "text-amber-400",
            isActive && activeColor === 'primary' && "text-primary",
            !isActive && "text-white/80"
          )}
        >
          {count}
        </button>
      )}
    </div>
  );
}