import { cn } from '@/lib/utils';
import { ReelsFeedType } from '@/hooks/useReels';
import { Users, Sparkles } from 'lucide-react';

interface FeedTabsProps {
  feedType: ReelsFeedType;
  onFeedTypeChange: (type: ReelsFeedType) => void;
}

export default function FeedTabs({ feedType, onFeedTypeChange }: FeedTabsProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-14 pb-4">
      <div className="flex items-center gap-1 bg-black/60 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 shadow-xl">
        <button
          onClick={() => onFeedTypeChange('following')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
            feedType === 'following'
              ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
              : "text-white/60 hover:text-white hover:bg-white/10"
          )}
        >
          <Users className="h-4 w-4" />
          Following
        </button>
        
        <button
          onClick={() => onFeedTypeChange('foryou')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
            feedType === 'foryou'
              ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
              : "text-white/60 hover:text-white hover:bg-white/10"
          )}
        >
          <Sparkles className="h-4 w-4" />
          For You
        </button>
      </div>
    </div>
  );
}