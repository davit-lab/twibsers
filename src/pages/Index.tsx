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
import { Loader2, Sparkles, ArrowRight, Camera, Heart, MessageCircle, Users, Play, BookOpen, Zap, Shield } from 'lucide-react';
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
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
        </div>
      </div>
    );
  }

  // Logged in - show feed with glassmorphism design
  if (user) {
    return (
      <MainLayout>
        {/* Ambient Background Effects */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="orb orb-primary top-20 right-0" />
          <div className="orb orb-accent bottom-40 left-0" />
        </div>

        <PullToRefresh
          ref={containerRef}
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
          shouldRefresh={shouldRefresh}
        >
          <div className="max-w-xl mx-auto pb-24 lg:pb-8">
            {/* Stories Section */}
            <div className="border-b border-border/30 bg-card/30 backdrop-blur-sm">
              <StoriesBar />
            </div>
            
            {/* Post Composer - Glass Card */}
            <div className="p-4 border-b border-border/30">
              <div className="glass-card p-4">
                <PostComposer onPostCreated={handlePostCreated} />
              </div>
            </div>
            
            {/* Feed */}
            <Feed 
              refreshTrigger={refreshTrigger} 
              onRefreshComplete={() => setIsRefreshingFeed(false)}
            />
          </div>
        </PullToRefresh>
      </MainLayout>
    );
  }

  // Not logged in - Premium Landing Page
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 blur-[200px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/10 blur-[150px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/30">
        <div className="flex items-center justify-between h-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">Twibsers</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="rounded-full" asChild>
              <Link to="/auth">Log In</Link>
            </Button>
            <Button className="btn-gradient rounded-full px-6 shadow-lg shadow-primary/30" asChild>
              <Link to="/auth?mode=signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            The next generation social platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            Connect. Create.
            <br />
            <span className="gradient-text">Inspire.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Join a community of creators, share your stories, and discover amazing content. 
            Build meaningful connections that matter.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" className="btn-gradient rounded-full h-14 px-8 text-lg gap-2 shadow-lg shadow-primary/30" asChild>
              <Link to="/auth?mode=signup">
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg border-border/50 hover:bg-muted/50" asChild>
              <Link to="/auth">
                I already have an account
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 md:gap-20">
            {[
              { icon: Users, value: '10K+', label: 'Active Users' },
              { icon: Heart, value: '1M+', label: 'Interactions' },
              { icon: Play, value: '50K+', label: 'Stories Shared' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Everything you need</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              A complete platform designed for creators who want to make an impact.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MessageCircle,
                title: 'Real-Time Messaging',
                desc: 'Stay connected with instant messaging, voice & video calls, and group chats.',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: BookOpen,
                title: 'Digital Library',
                desc: 'Publish your books, share PDFs, and monetize your content with ease.',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                icon: Shield,
                title: 'Privacy First',
                desc: 'Control who sees your content with granular privacy settings and secure data.',
                gradient: 'from-green-500 to-emerald-500',
              },
            ].map((feature, i) => (
              <div key={i} className="p-8 bg-card/50 rounded-3xl border border-border/50 hover:bg-card transition-all group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Loved by creators worldwide</p>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary/80 to-accent/80 -ml-3 first:ml-0 border-2 border-background flex items-center justify-center text-white text-xs font-bold`}
                >
                  {String.fromCharCode(65 + i - 1)}
                </div>
              ))}
              <span className="ml-4 text-sm text-muted-foreground">+10,000 creators</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-border/30 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/30">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join thousands of creators who are already building their community on Twibsers.
          </p>
          <Button size="lg" className="btn-gradient rounded-full h-14 px-10 text-lg gap-2 shadow-lg shadow-primary/30" asChild>
            <Link to="/auth?mode=signup">
              Create Your Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold gradient-text">Twibsers</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 Twibsers. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
