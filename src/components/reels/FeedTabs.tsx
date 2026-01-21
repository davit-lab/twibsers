import { cn } from '@/lib/utils';
import { ReelsFeedType } from '@/hooks/useReels';

interface FeedTabsProps {
  feedType: ReelsFeedType;
  onFeedTypeChange: (type: ReelsFeedType) => void;
}

export default function FeedTabs({ feedType, onFeedTypeChange }: FeedTabsProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-14 pb-4">
      <div className="flex items-center gap-4 bg-black/40 backdrop-blur-sm rounded-full px-1 py-1">
        <button
          onClick={() => onFeedTypeChange('following')}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
            feedType === 'following'
              ? "bg-white text-black"
              : "text-white/60 hover:text-white"
          )}
        >
          Following
        </button>
        
        <button
          onClick={() => onFeedTypeChange('foryou')}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
            feedType === 'foryou'
              ? "bg-white text-black"
              : "text-white/60 hover:text-white"
          )}
        >
          For You
        </button>
      </div>
    </div>
  );
}