import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import PostComposer from '@/components/feed/PostComposer';
import Feed from '@/components/feed/Feed';
import StoriesBar from '@/components/stories/StoriesBar';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ArrowRight, Users, MessageCircle, BookOpen, Play, Star } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
        </div>
      </div>
    );
  }

  // Logged in - show feed
  if (user) {
    return (
      <MainLayout>
        <div className="container max-w-2xl py-6 px-4 pb-24 lg:pb-8">
          {/* Stories Bar */}
          <div className="-mx-4 mb-4">
            <StoriesBar />
          </div>
          
          <PostComposer onPostCreated={handlePostCreated} />
          <div className="mt-6">
            <Feed refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Not logged in - show landing
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[180px]" />
        </div>
        
        {/* Header */}
        <header className="relative z-10">
          <div className="container flex items-center justify-between h-20 px-4">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-glow-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-2xl gradient-text">Twibsers</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="rounded-full">
                <Link to="/auth">Log In</Link>
              </Button>
              <Button className="btn-gradient rounded-full px-6" asChild>
                <Link to="/auth?mode=signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="flex-1 flex items-center relative z-10">
          <div className="container px-4 py-12">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-premium text-sm font-medium mb-8 animate-fade-in">
                <Star className="h-4 w-4 text-star fill-star" />
                <span className="gradient-text">The next-generation social platform</span>
              </div>
              
              {/* Headline */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.1] mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                Connect with the world{' '}
                <span className="relative">
                  <span className="gradient-text">like never before</span>
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 blur-2xl -z-10" />
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '200ms' }}>
                Join Twibsers — where creators, thinkers, and communities come together to share ideas, spark conversations, and build connections that matter.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '300ms' }}>
                <Button size="lg" className="btn-gradient text-lg px-8 h-14 rounded-full gap-2 shadow-glow" asChild>
                  <Link to="/auth?mode=signup">
                    Get Started Free 
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-full gap-2 glass-premium border-border/50 hover:bg-primary/5" asChild>
                  <Link to="/auth">
                    <Play className="h-5 w-5" />
                    Watch Demo
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 mt-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
                {[
                  { value: '10K+', label: 'Active Users' },
                  { value: '50K+', label: 'Posts Daily' },
                  { value: '99.9%', label: 'Uptime' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-3xl font-display font-bold gradient-text">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Everything you need to <span className="gradient-text">thrive</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Powerful features designed for modern creators and communities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: 'Build Your Community',
                description: 'Connect with like-minded individuals, grow your following, and create meaningful relationships.',
                gradient: 'from-primary to-primary/50',
              },
              {
                icon: MessageCircle,
                title: 'Real-Time Messaging',
                description: 'Stay connected with instant messaging, video calls, and voice notes.',
                gradient: 'from-accent to-accent/50',
              },
              {
                icon: BookOpen,
                title: 'Digital Library',
                description: 'Publish and discover amazing content from verified creators worldwide.',
                gradient: 'from-star to-star/50',
              },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group glass-premium p-8 rounded-3xl hover-glow transition-all duration-500 hover:-translate-y-2"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg transition-transform duration-300 group-hover:scale-110",
                  feature.gradient
                )}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center glass-premium p-12 md:p-16 rounded-[2rem] relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/15 rounded-full blur-[80px]" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
                Ready to join the conversation?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                Create your free account today and start connecting with people who matter.
              </p>
              <Button size="lg" className="btn-gradient text-lg px-10 h-14 rounded-full gap-2 shadow-glow" asChild>
                <Link to="/auth?mode=signup">
                  Create Your Account
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30 relative">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-semibold gradient-text">Twibsers</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Twibsers. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
