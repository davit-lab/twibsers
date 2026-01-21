import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useReels, useReelComments } from '@/hooks/useReels';
import { useStories } from '@/hooks/useStories';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Music2,
  Send,
  X,
  ChevronUp,
  ChevronDown,
  Plus,
  Loader2,
  Home,
  BadgeCheck,
  BookmarkCheck,
  Copy,
  Flag,
  Sparkles,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export default function Reels() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { reels, loading, refreshing, error, refetch, currentIndex, setCurrentIndex, likeReel, incrementView } = useReels();
  const { uploadStory } = useStories();
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [sharingToStory, setSharingToStory] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState<string | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const currentReel = reels[currentIndex];
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle scroll/swipe to navigate with debounce
  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (isTransitioning) return;
    
    if (direction === 'down' && currentIndex < reels.length - 1) {
      setIsTransitioning(true);
      setCurrentIndex(currentIndex + 1);
      setTimeout(() => setIsTransitioning(false), 600);
    } else if (direction === 'up' && currentIndex > 0) {
      setIsTransitioning(true);
      setCurrentIndex(currentIndex - 1);
      setTimeout(() => setIsTransitioning(false), 600);
    }
  }, [currentIndex, reels.length, setCurrentIndex, isTransitioning]);

  // Wheel event for desktop - smoother with threshold
  useEffect(() => {
    let accumulatedDelta = 0;
    const threshold = 80;
    let lastScrollTime = 0;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const now = Date.now();
      if (now - lastScrollTime < 600) return; // Debounce
      
      accumulatedDelta += e.deltaY;
      
      if (Math.abs(accumulatedDelta) > threshold) {
        handleScroll(accumulatedDelta > 0 ? 'down' : 'up');
        accumulatedDelta = 0;
        lastScrollTime = now;
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [handleScroll]);

  // Touch events for mobile - smoother with velocity
  const touchStartRef = useRef<{ y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      y: e.touches[0].clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isTransitioning) return;
    
    const deltaY = touchStartRef.current.y - e.changedTouches[0].clientY;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(deltaY) / deltaTime;
    
    // Trigger with either sufficient distance or velocity
    if (Math.abs(deltaY) > 60 || velocity > 0.3) {
      handleScroll(deltaY > 0 ? 'down' : 'up');
    }
    touchStartRef.current = null;
  };

  // Manage video playback
  useEffect(() => {
    videoRefs.current.forEach((video, id) => {
      if (reels[currentIndex]?.id === id) {
        video.play().catch(() => {});
        incrementView(id);
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, reels, incrementView]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') handleScroll('down');
      if (e.key === 'ArrowUp') handleScroll('up');
      if (e.key === ' ') {
        e.preventDefault();
        setPaused(p => !p);
      }
      if (e.key === 'm') setMuted(m => !m);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScroll]);

  // Toggle play/pause
  useEffect(() => {
    const video = videoRefs.current.get(currentReel?.id || '');
    if (video) {
      if (paused) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    }
  }, [paused, currentReel?.id]);

  const handleDoubleTap = (reelId: string) => {
    likeReel(reelId);
    setLikeAnimation(reelId);
    setTimeout(() => setLikeAnimation(null), 1000);
  };

  const handleSaveReel = (reelId: string) => {
    setSavedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reelId)) {
        newSet.delete(reelId);
        toast({ title: 'Removed from saved' });
      } else {
        newSet.add(reelId);
        toast({ title: 'Saved to collection ✨' });
      }
      return newSet;
    });
  };

  const handleShareToStory = async (reel: typeof reels[0]) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to share to your story.' });
      return;
    }
    
    setSharingToStory(true);
    try {
      // Get the video thumbnail or first frame as story
      const response = await fetch(reel.thumbnail_url || reel.video_url);
      const blob = await response.blob();
      const file = new File([blob], 'reel-share.jpg', { type: 'image/jpeg' });
      
      await uploadStory(file, `Check out this reel by @${reel.profile?.username}! 🎬`);
      toast({ title: 'Shared to your story! 🎉', description: 'Your followers can now see this reel.' });
    } catch (error) {
      console.error('Failed to share to story:', error);
      toast({ variant: 'destructive', title: 'Failed to share', description: 'Could not share this reel to your story.' });
    } finally {
      setSharingToStory(false);
    }
  };

  const handleCopyLink = (reelId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/reels/${reelId}`);
    toast({ title: 'Link copied! 📋' });
  };

  const openComments = (reelId: string) => {
    setSelectedReelId(reelId);
    setShowComments(true);
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white px-6 text-center">
        <h2 className="text-2xl font-display font-bold mb-2">Reels not loading</h2>
        <p className="text-white/70 mb-6 max-w-md">{error}</p>
        <Button className="btn-gradient" onClick={() => refetch()} disabled={refreshing}>
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Try again'
          )}
        </Button>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 flex flex-col items-center justify-center text-white">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative z-10 text-center px-6">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/30">
              <Music2 className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-sm animate-bounce">
              ✨
            </div>
          </div>
          
          <h2 className="text-3xl font-display font-bold mb-3 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            No Reels Yet 🎬
          </h2>
          <p className="text-white/70 mb-8 max-w-sm mx-auto">
            Be the first to share amazing short videos with the community!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="btn-gradient gap-2 px-6" 
              onClick={() => {
                refetch();
              }}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              Refresh
            </Button>
            <Link to="/">
              <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen w-full bg-black overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Reels Container - Smoother transition */}
      <div 
        className="h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{ transform: `translateY(-${currentIndex * 100}%)` }}
      >
        {reels.map((reel, index) => (
          <div 
            key={reel.id} 
            className="h-screen w-full relative flex items-center justify-center"
          >
            {/* Video */}
            <video
              ref={el => {
                if (el) videoRefs.current.set(reel.id, el);
              }}
              src={reel.video_url}
              className="h-full w-full object-cover"
              loop
              muted={muted}
              playsInline
              onClick={() => setPaused(p => !p)}
              onDoubleClick={() => handleDoubleTap(reel.id)}
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/30 via-transparent to-black/60" />

            {/* Play/Pause indicator */}
            {paused && index === currentIndex && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center animate-scale-in">
                  <Play className="h-10 w-10 text-white ml-1" />
                </div>
              </div>
            )}

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-16 p-4 pb-8">
              {/* User info */}
              <div className="flex items-center gap-3 mb-3">
                <Link to={`/profile/${reel.profile?.username}`}>
                  <Avatar className="h-10 w-10 ring-2 ring-white/30">
                    <AvatarImage src={reel.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
                      {getInitials(reel.profile?.display_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Link to={`/profile/${reel.profile?.username}`} className="text-white font-semibold text-sm hover:underline">
                      {reel.profile?.display_name}
                    </Link>
                    {reel.profile?.is_verified && (
                      <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
                    )}
                  </div>
                  <p className="text-white/60 text-xs">@{reel.profile?.username}</p>
                </div>
                {user && user.id !== reel.user_id && (
                  <Button size="sm" variant="outline" className="rounded-full border-white/30 text-white bg-transparent hover:bg-white/10">
                    Follow
                  </Button>
                )}
              </div>

              {/* Caption */}
              {reel.caption && (
                <p className="text-white text-sm mb-3 line-clamp-2">{reel.caption}</p>
              )}

              {/* Audio */}
              {reel.audio_name && (
                <div className="flex items-center gap-2 text-white/80 text-xs">
                  <Music2 className="h-3 w-3" />
                  <span className="truncate">{reel.audio_name}</span>
                </div>
              )}
            </div>

            {/* Right side actions - Enhanced */}
            <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
              {/* Like */}
              <button 
                onClick={() => likeReel(reel.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm",
                  reel.is_liked 
                    ? "bg-gradient-to-br from-rose-500/30 to-pink-500/30 shadow-lg shadow-rose-500/20" 
                    : "bg-white/10 hover:bg-white/20 hover:scale-110"
                )}>
                  <Heart className={cn(
                    "h-6 w-6 transition-all duration-300",
                    reel.is_liked ? "text-rose-500 fill-rose-500 scale-110" : "text-white group-hover:scale-110"
                  )} />
                </div>
                <span className={cn(
                  "text-xs font-semibold transition-colors",
                  reel.is_liked ? "text-rose-400" : "text-white"
                )}>{reel.like_count}</span>
              </button>

              {/* Comment */}
              <button 
                onClick={() => openComments(reel.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <MessageCircle className="h-6 w-6 text-white group-hover:text-primary transition-colors" />
                </div>
                <span className="text-white text-xs font-semibold">{reel.comment_count}</span>
              </button>

              {/* Share Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110">
                      <Share2 className="h-6 w-6 text-white group-hover:text-accent transition-colors" />
                    </div>
                    <span className="text-white text-xs font-semibold">{reel.share_count}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 glass-premium">
                  <DropdownMenuItem 
                    onClick={() => handleShareToStory(reel)}
                    disabled={sharingToStory}
                    className="gap-3"
                  >
                    {sharingToStory ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-primary" />
                    )}
                    Share to Story
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopyLink(reel.id)} className="gap-3">
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Bookmark */}
              <button 
                onClick={() => handleSaveReel(reel.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110",
                  savedReels.has(reel.id) 
                    ? "bg-gradient-to-br from-amber-500/30 to-orange-500/30" 
                    : "bg-white/10 hover:bg-white/20"
                )}>
                  {savedReels.has(reel.id) ? (
                    <BookmarkCheck className="h-5 w-5 text-amber-400 fill-amber-400" />
                  ) : (
                    <Bookmark className="h-5 w-5 text-white group-hover:text-amber-300 transition-colors" />
                  )}
                </div>
              </button>

              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group">
                    <div className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110">
                      <MoreHorizontal className="h-5 w-5 text-white" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 glass-premium">
                  <DropdownMenuItem className="gap-3">
                    <Flag className="h-4 w-4" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Audio disc */}
              {reel.audio_name && (
                <div className="mt-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent p-0.5 animate-spin-slow">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                      <Music2 className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Double-tap like animation */}
            {likeAnimation === reel.id && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <Heart className="h-32 w-32 text-rose-500 fill-rose-500 animate-ping-once" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Top navigation - Enhanced */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border border-white/10">
            <X className="h-5 w-5" />
          </Button>
        </Link>
        
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
          <Zap className="h-4 w-4 text-primary" />
          <h1 className="text-white font-display font-bold">Reels</h1>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          className="rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border border-white/10"
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
        </Button>
      </div>

      {/* Volume control - Enhanced */}
      <button 
        onClick={() => setMuted(!muted)}
        className="absolute top-20 right-4 z-10 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/60 transition-all"
      >
        {muted ? (
          <VolumeX className="h-5 w-5 text-white/70" />
        ) : (
          <Volume2 className="h-5 w-5 text-white" />
        )}
      </button>

      {/* Navigation arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleScroll('up')}
          disabled={currentIndex === 0}
          className="rounded-full bg-black/30 text-white hover:bg-black/50 disabled:opacity-30"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleScroll('down')}
          disabled={currentIndex === reels.length - 1}
          className="rounded-full bg-black/30 text-white hover:bg-black/50 disabled:opacity-30"
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress indicators */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        {reels.slice(Math.max(0, currentIndex - 2), Math.min(reels.length, currentIndex + 3)).map((reel, i) => (
          <div 
            key={reel.id}
            className={cn(
              "h-1 rounded-full transition-all",
              reels.indexOf(reel) === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
            )}
          />
        ))}
      </div>

      {/* Comments Sheet */}
      <Sheet open={showComments} onOpenChange={setShowComments}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Comments</SheetTitle>
          </SheetHeader>
          {selectedReelId && (
            <CommentsSection reelId={selectedReelId} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CommentsSection({ reelId }: { reelId: string }) {
  const { user } = useAuth();
  const { comments, loading, addComment } = useReelComments(reelId);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSending(true);
    try {
      await addComment(newComment);
      setNewComment('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to post comment',
      });
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 py-4">
        {comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4 px-1">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={comment.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                    {getInitials(comment.profile?.display_name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.profile?.display_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'MMM d')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {comment.like_count > 0 && comment.like_count}
                    </button>
                    <button className="text-xs text-muted-foreground hover:text-foreground">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Comment input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border-t">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 rounded-full"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newComment.trim() || sending}
            className="rounded-full btn-gradient"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      ) : (
        <div className="p-4 border-t text-center">
          <Link to="/auth">
            <Button variant="outline" className="rounded-full">
              Sign in to comment
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
