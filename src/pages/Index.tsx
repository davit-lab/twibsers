import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import PostComposer from '@/components/feed/PostComposer';
import Feed from '@/components/feed/Feed';
import StoriesBar from '@/components/stories/StoriesBar';
import PullToRefresh from '@/components/feed/PullToRefresh';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ArrowRight, Camera, Heart, MessageCircle, Users, Play } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Index() {
  const { user, loading } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshingFeed(true);
    setRefreshTrigger(prev => prev + 1);
    // Wait a bit for the feed to refresh
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshingFeed(false);
  }, []);

  const {
    containerRef,
    pullDistance,
    isRefreshing,
    progress,
    shouldRefresh,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
        </div>
      </div>
    );
  }

  // Logged in - show feed with pull-to-refresh
  if (user) {
    return (
      <MainLayout>
        <PullToRefresh
          ref={containerRef}
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
          shouldRefresh={shouldRefresh}
        >
          <div className="max-w-2xl mx-auto pb-24 lg:pb-8">
            {/* Stories Bar - Full bleed on mobile */}
            <div className="border-b border-border/30">
              <StoriesBar />
            </div>
            
            {/* Post Composer */}
            <div className="p-4 border-b border-border/30">
              <PostComposer onPostCreated={handlePostCreated} />
            </div>
            
            {/* Feed */}
            <div className="px-4 py-4">
              <Feed 
                refreshTrigger={refreshTrigger} 
                onRefreshComplete={() => setIsRefreshingFeed(false)}
              />
            </div>
          </div>
        </PullToRefresh>
      </MainLayout>
    );
  }

  // Not logged in - show app-like landing
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile App Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">Twibsers</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-full text-sm" asChild>
              <Link to="/auth">Log In</Link>
            </Button>
            <Button size="sm" className="btn-gradient rounded-full text-sm px-4" asChild>
              <Link to="/auth?mode=signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Fake Stories Bar - Social proof */}
      <div className="py-4 px-4 border-b border-border/30 overflow-hidden">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
          {[
            { name: 'Alex', gradient: 'from-pink-500 to-rose-500' },
            { name: 'Jordan', gradient: 'from-blue-500 to-cyan-500' },
            { name: 'Taylor', gradient: 'from-purple-500 to-violet-500' },
            { name: 'Morgan', gradient: 'from-amber-500 to-orange-500' },
            { name: 'Casey', gradient: 'from-green-500 to-emerald-500' },
            { name: 'Riley', gradient: 'from-pink-500 to-purple-500' },
          ].map((user, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 min-w-[64px]">
              <div className={`p-0.5 rounded-full bg-gradient-to-br ${user.gradient}`}>
                <div className="p-0.5 rounded-full bg-background">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback className={`bg-gradient-to-br ${user.gradient} text-white text-sm font-medium`}>
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[64px]">
                {user.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mock Feed with CTA overlay */}
      <div className="flex-1 relative">
        {/* Mock Posts */}
        <div className="divide-y divide-border/30">
          {[
            {
              user: 'Sarah',
              handle: '@sarahcreates',
              content: 'Just dropped my new design portfolio! 🎨 Can\'t wait to hear your thoughts!',
              likes: 234,
              comments: 45,
              gradient: 'from-pink-500 to-rose-500',
              hasImage: true,
            },
            {
              user: 'Marcus',
              handle: '@marcusdev',
              content: 'Building something amazing with the Twibsers community. The support here is incredible 🚀',
              likes: 189,
              comments: 32,
              gradient: 'from-blue-500 to-cyan-500',
            },
            {
              user: 'Emma',
              handle: '@emmawrites',
              content: 'Started my morning with a 10km run and a great book. What are your morning rituals? ☀️',
              likes: 412,
              comments: 87,
              gradient: 'from-amber-500 to-orange-500',
              hasImage: true,
            },
          ].map((post, i) => (
            <div key={i} className="p-4">
              <div className="flex gap-3">
                <Avatar className="w-11 h-11">
                  <AvatarFallback className={`bg-gradient-to-br ${post.gradient} text-white text-sm font-medium`}>
                    {post.user[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm">{post.user}</span>
                    <span className="text-muted-foreground text-sm">{post.handle}</span>
                    <span className="text-muted-foreground text-xs">· 2h</span>
                  </div>
                  <p className="mt-1.5 text-[15px] leading-relaxed">{post.content}</p>
                  {post.hasImage && (
                    <div className="mt-3 rounded-2xl bg-gradient-to-br from-muted/50 to-muted h-48 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex items-center gap-6 mt-3">
                    <button className="flex items-center gap-1.5 text-muted-foreground text-sm hover:text-pink-500 transition-colors">
                      <Heart className="w-[18px] h-[18px]" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted-foreground text-sm hover:text-primary transition-colors">
                      <MessageCircle className="w-[18px] h-[18px]" />
                      <span>{post.comments}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gradient overlay with CTA */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent flex flex-col items-center justify-end pb-8 px-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">
              Join the conversation
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              Connect with creators, share your story, and discover amazing content.
            </p>
            <div className="flex flex-col gap-3">
              <Button className="w-full btn-gradient rounded-full h-12 text-base gap-2 shadow-glow" asChild>
                <Link to="/auth?mode=signup">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full rounded-full h-12 text-base glass-premium border-border/50" asChild>
                <Link to="/auth">
                  Already have an account?
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="border-t border-border/30 bg-background/80 backdrop-blur-xl py-4 px-6">
        <div className="flex justify-around text-center">
          {[
            { icon: Users, value: '10K+', label: 'Users' },
            { icon: Heart, value: '1M+', label: 'Likes' },
            { icon: Play, value: '50K+', label: 'Stories' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <stat.icon className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold gradient-text">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
