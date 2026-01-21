import { cn } from '@/lib/utils';
import { ReelsFeedType } from '@/hooks/useReels';

interface FeedTabsProps {
  feedType: ReelsFeedType;
  onFeedTypeChange: (type: ReelsFeedType) => void;
}

export default function FeedTabs({ feedType, onFeedTypeChange }: FeedTabsProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-12 pb-4">
      <div className="flex items-center gap-6">
        <button
          onClick={() => onFeedTypeChange('following')}
          className={cn(
            "text-base font-semibold transition-all duration-300",
            feedType === 'following'
              ? "text-white scale-105"
              : "text-white/50 hover:text-white/70"
          )}
        >
          Following
        </button>
        
        <div className="w-px h-5 bg-white/30" />
        
        <button
          onClick={() => onFeedTypeChange('foryou')}
          className={cn(
            "text-base font-semibold transition-all duration-300",
            feedType === 'foryou'
              ? "text-white scale-105"
              : "text-white/50 hover:text-white/70"
          )}
        >
          For You
        </button>
      </div>
      
      {/* Active indicator */}
      <div 
        className={cn(
          "absolute bottom-2 h-0.5 w-16 bg-white rounded-full transition-all duration-300",
          feedType === 'following' ? "left-[calc(50%-60px)]" : "left-[calc(50%+12px)]"
        )}
      />
    </div>
  );
}
