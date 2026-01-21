import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useReels, ReelsFeedType } from '@/hooks/useReels';
import { useStories } from '@/hooks/useStories';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReelCard from '@/components/reels/ReelCard';
import ReelControls from '@/components/reels/ReelControls';
import ReelCommentsSheet from '@/components/reels/ReelComments';
import ReelEmptyState from '@/components/reels/ReelEmptyState';
import FeedTabs from '@/components/reels/FeedTabs';

export default function Reels() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedType, setFeedType] = useState<ReelsFeedType>('foryou');
  
  const { 
    reels, 
    loading, 
    refreshing, 
    error, 
    refetch, 
    currentIndex, 
    setCurrentIndex, 
    likeReel, 
    incrementView 
  } = useReels(feedType);
  const { uploadStory } = useStories();
  
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [likeAnimation, setLikeAnimation] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ y: number; time: number } | null>(null);

  // Smooth scroll navigation with spring-like feel
  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (isTransitioning) return;
    
    if (direction === 'down' && currentIndex < reels.length - 1) {
      setIsTransitioning(true);
      setCurrentIndex(currentIndex + 1);
      setPaused(false);
      setTimeout(() => setIsTransitioning(false), 400);
    } else if (direction === 'up' && currentIndex > 0) {
      setIsTransitioning(true);
      setCurrentIndex(currentIndex - 1);
      setPaused(false);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  }, [currentIndex, reels.length, setCurrentIndex, isTransitioning]);

  // Wheel event for desktop - smoother
  useEffect(() => {
    let accumulatedDelta = 0;
    const threshold = 80;
    let lastScrollTime = 0;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const now = Date.now();
      if (now - lastScrollTime < 400) return;
      
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

  // Touch events for mobile - smoother
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
    
    if (Math.abs(deltaY) > 60 || velocity > 0.3) {
      handleScroll(deltaY > 0 ? 'down' : 'up');
    }
    touchStartRef.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') handleScroll('down');
      if (e.key === 'ArrowUp' || e.key === 'k') handleScroll('up');
      if (e.key === ' ') {
        e.preventDefault();
        setPaused(p => !p);
      }
      if (e.key === 'm') setMuted(m => !m);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScroll]);

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
        toast({ title: 'Saved ⭐' });
      }
      return newSet;
    });
  };

  const handleShareToStory = async (reel: typeof reels[0]) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to share.' });
      return;
    }
    
    try {
      const response = await fetch(reel.thumbnail_url || reel.video_url);
      const blob = await response.blob();
      const file = new File([blob], 'reel-share.jpg', { type: 'image/jpeg' });
      
      await uploadStory(file, `Check out this reel by @${reel.profile?.username}!`);
      toast({ title: 'Shared to your story!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to share' });
    }
  };

  const handleCopyLink = (reelId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/reels/${reelId}`);
    toast({ title: 'Link copied!' });
  };

  const openComments = (reelId: string) => {
    setSelectedReelId(reelId);
    setShowComments(true);
  };

  // Loading state - clean spinner
  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-white/50 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-white/50 mb-6 text-sm">{error}</p>
        <button 
          onClick={() => refetch()}
          disabled={refreshing}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium flex items-center gap-2"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Try again'}
        </button>
      </div>
    );
  }

  // Empty state
  if (reels.length === 0) {
    return (
      <div className="h-screen w-full bg-black relative">
        <FeedTabs feedType={feedType} onFeedTypeChange={setFeedType} />
        <ReelEmptyState 
          isRefreshing={refreshing} 
          onRefresh={() => refetch()} 
          isFollowingFeed={feedType === 'following'}
        />
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
      {/* Feed type tabs */}
      <FeedTabs feedType={feedType} onFeedTypeChange={setFeedType} />
      
      {/* Reels container with smooth spring transition */}
      <div 
        className="h-full w-full"
        style={{ 
          transform: `translateY(-${currentIndex * 100}%)`,
          transition: isTransitioning 
            ? 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)' 
            : 'transform 0.2s ease-out'
        }}
      >
        {reels.map((reel, index) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            isActive={index === currentIndex}
            isMuted={muted}
            isPaused={paused}
            isSaved={savedReels.has(reel.id)}
            showLikeAnimation={likeAnimation === reel.id}
            onTogglePause={() => setPaused(p => !p)}
            onDoubleTap={() => handleDoubleTap(reel.id)}
            onLike={() => likeReel(reel.id)}
            onComment={() => openComments(reel.id)}
            onShareToStory={() => handleShareToStory(reel)}
            onCopyLink={() => handleCopyLink(reel.id)}
            onSave={() => handleSaveReel(reel.id)}
            onViewIncrement={() => incrementView(reel.id)}
          />
        ))}
      </div>

      {/* Controls overlay */}
      <ReelControls
        currentIndex={currentIndex}
        totalReels={reels.length}
        isMuted={muted}
        isRefreshing={refreshing}
        onMuteToggle={() => setMuted(!muted)}
        onRefresh={() => refetch()}
      />

      {/* Comments sheet */}
      <ReelCommentsSheet
        reelId={selectedReelId}
        open={showComments}
        onOpenChange={setShowComments}
      />
    </div>
  );
}