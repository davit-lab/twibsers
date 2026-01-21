import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReelControlsProps {
  currentIndex: number;
  totalReels: number;
  isMuted: boolean;
  isRefreshing: boolean;
  onMuteToggle: () => void;
  onRefresh: () => void;
}

export default function ReelControls({
  currentIndex,
  totalReels,
  isMuted,
  isRefreshing,
  onMuteToggle,
  onRefresh,
}: ReelControlsProps) {
  return (
    <>
      {/* Top bar - minimal */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 pointer-events-none">
        <Link to="/" className="pointer-events-auto">
          <Button 
            variant="glass" 
            size="icon" 
            className="h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
        </Link>
        
        {/* Brand logo - simple text */}
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
          <span className="text-white font-bold text-sm tracking-wide">REELS</span>
        </div>
        
        <Button
          variant="glass"
          size="icon"
          onClick={onRefresh}
          className="h-10 w-10 pointer-events-auto"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Volume button */}
      <button 
        onClick={onMuteToggle}
        className={cn(
          "absolute top-16 right-4 z-20 w-10 h-10 rounded-xl",
          "bg-black/50 backdrop-blur-sm flex items-center justify-center",
          "border border-white/10 hover:bg-black/70 transition-all",
          "active:scale-95"
        )}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4 text-white/60" />
        ) : (
          <Volume2 className="h-4 w-4 text-white" />
        )}
      </button>
      
      {/* Navigation indicator - clean dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-20">
        {Array.from({ length: Math.min(totalReels, 5) }).map((_, i) => {
          const startIdx = Math.max(0, Math.min(currentIndex - 2, totalReels - 5));
          const actualIdx = startIdx + i;
          const isCurrent = actualIdx === currentIndex;
          
          return (
            <div 
              key={i}
              className={cn(
                "rounded-full transition-all duration-300",
                isCurrent 
                  ? "w-5 h-1.5 bg-white" 
                  : "w-1.5 h-1.5 bg-white/30"
              )}
            />
          );
        })}
      </div>
    </>
  );
}