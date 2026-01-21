import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music2, Plus, Home, Loader2, Sparkles } from 'lucide-react';

interface ReelEmptyStateProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function ReelEmptyState({ isRefreshing, onRefresh }: ReelEmptyStateProps) {
  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 flex flex-col items-center justify-center text-white overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-md">
        {/* Icon */}
        <div className="relative mb-8 inline-block">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary via-accent to-pink-500 flex items-center justify-center shadow-2xl shadow-primary/40">
            <Music2 className="h-14 w-14 text-white" />
          </div>
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
        </div>
        
        {/* Text */}
        <h2 className="text-4xl font-display font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
          No Reels Yet
        </h2>
        <p className="text-white/60 mb-10 text-lg leading-relaxed">
          Be the first to share amazing short videos with the community!
        </p>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            className="btn-gradient gap-2 px-8 h-12 text-base font-semibold" 
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            Refresh
          </Button>
          <Link to="/">
            <Button 
              variant="outline" 
              className="gap-2 border-white/20 text-white hover:bg-white/10 px-8 h-12 text-base"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
