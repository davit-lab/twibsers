import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import PostComposer from '@/components/feed/PostComposer';
import Feed from '@/components/feed/Feed';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, ArrowRight, Sparkles, Users, MessageCircle, BookOpen } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Logged in - show feed
  if (user) {
    return (
      <MainLayout>
        <div className="container max-w-2xl py-6 px-4 pb-24 lg:pb-8">
          {/* Post Composer */}
          <PostComposer onPostCreated={handlePostCreated} />
          
          {/* Feed */}
          <div className="mt-6">
            <Feed refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Not logged in - show landing
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        {/* Header */}
        <header className="container flex items-center justify-between h-20 px-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl">NexusLink</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Log In</Link>
            </Button>
            <Button className="btn-gradient" asChild>
              <Link to="/auth?mode=signup">Sign Up</Link>
            </Button>
          </div>
        </header>

        {/* Hero Content */}
        <div className="container px-4 py-24 md:py-32 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            The next-generation social platform
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold max-w-4xl mx-auto leading-tight">
            Connect with the world like{' '}
            <span className="gradient-text">never before</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto">
            Join NexusLink — where creators, thinkers, and communities come together to share ideas, spark conversations, and build connections that matter.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Button size="lg" className="btn-gradient text-lg px-8 h-14" asChild>
              <Link to="/auth?mode=signup">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 h-14" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Everything you need to thrive
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Powerful features designed for modern creators and communities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-card border border-border hover:shadow-card-hover transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Build Your Community</h3>
              <p className="text-muted-foreground">
                Connect with like-minded individuals, grow your following, and create meaningful relationships.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border hover:shadow-card-hover transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center mb-6">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Real-Time Messaging</h3>
              <p className="text-muted-foreground">
                Stay connected with instant messaging, typing indicators, and read receipts.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border hover:shadow-card-hover transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-star to-star/50 flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Digital Library</h3>
              <p className="text-muted-foreground">
                Publish and discover amazing content from verified creators worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-primary to-accent relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white blur-2xl" />
              <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-white blur-3xl" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Ready to join the conversation?
              </h2>
              <p className="text-white/80 text-lg mb-8">
                Create your free account today and start connecting.
              </p>
              <Button size="lg" variant="secondary" className="text-lg px-8 h-14" asChild>
                <Link to="/auth?mode=signup">
                  Create Your Account <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-semibold">NexusLink</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 NexusLink. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}