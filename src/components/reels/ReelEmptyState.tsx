import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Video, Plus, Home, Loader2, Users } from 'lucide-react';

interface ReelEmptyStateProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  isFollowingFeed?: boolean;
}

export default function ReelEmptyState({ isRefreshing, onRefresh, isFollowingFeed = false }: ReelEmptyStateProps) {
  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white px-6">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-muted/20 flex items-center justify-center mb-6">
        {isFollowingFeed ? (
          <Users className="h-10 w-10 text-muted-foreground" />
        ) : (
          <Video className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
      
      {/* Text */}
      <h2 className="text-2xl font-bold mb-2 text-center">
        {isFollowingFeed ? 'No reels from following' : 'No reels yet'}
      </h2>
      <p className="text-muted-foreground mb-8 text-center max-w-xs">
        {isFollowingFeed 
          ? 'Follow more creators to see their reels here' 
          : 'Be the first to share amazing short videos'}
      </p>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Refresh
        </Button>
        <Link to="/">
          <Button variant="outline" className="gap-2 w-full">
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}