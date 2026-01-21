import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Loader2,
  Sparkles,
  Camera
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
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
        <Link to="/">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-black/50 backdrop-blur-xl text-white hover:bg-black/70 border border-white/10 h-11 w-11"
          >
            <X className="h-5 w-5" />
          </Button>
        </Link>
        
        {/* Logo */}
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-xl rounded-full px-5 py-2.5 border border-white/10">
          <Sparkles className="h-4 w-4 text-primary" />
          <h1 className="text-white font-display font-bold text-lg tracking-tight">Reels</h1>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          className="rounded-full bg-black/50 backdrop-blur-xl text-white hover:bg-black/70 border border-white/10 h-11 w-11"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {/* Volume button */}
      <button 
        onClick={onMuteToggle}
        className={cn(
          "absolute top-20 right-4 z-20 w-11 h-11 rounded-full",
          "bg-black/50 backdrop-blur-xl flex items-center justify-center",
          "border border-white/10 hover:bg-black/70 transition-all",
          "hover:scale-105 active:scale-95"
        )}
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5 text-white/70" />
        ) : (
          <Volume2 className="h-5 w-5 text-white" />
        )}
      </button>
      
      {/* Navigation dots - repositioned to bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {Array.from({ length: Math.min(totalReels, 7) }).map((_, i) => {
          const startIdx = Math.max(0, Math.min(currentIndex - 3, totalReels - 7));
          const actualIdx = startIdx + i;
          const isCurrent = actualIdx === currentIndex;
          
          return (
            <div 
              key={i}
              className={cn(
                "rounded-full transition-all duration-300",
                isCurrent 
                  ? "w-6 h-1.5 bg-white" 
                  : "w-1.5 h-1.5 bg-white/40"
              )}
            />
          );
        })}
      </div>
      
      {/* Swipe hint - shown briefly */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-14 z-20 pointer-events-none">
        <p className="text-white/40 text-xs font-medium">← Swipe left for profile</p>
      </div>
    </>
  );
}
