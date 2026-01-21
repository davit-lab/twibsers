import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown,
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
  onNavigate: (direction: 'up' | 'down') => void;
  onRefresh: () => void;
}

export default function ReelControls({
  currentIndex,
  totalReels,
  isMuted,
  isRefreshing,
  onMuteToggle,
  onNavigate,
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
      
      {/* Navigation dots */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
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
                  ? "w-1.5 h-6 bg-white" 
                  : "w-1.5 h-1.5 bg-white/40"
              )}
            />
          );
        })}
      </div>
      
      {/* Navigation arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate('up')}
          disabled={currentIndex === 0}
          className={cn(
            "rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/10",
            "hover:bg-black/60 disabled:opacity-30 h-10 w-10 transition-all",
            "hover:scale-105 active:scale-95"
          )}
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate('down')}
          disabled={currentIndex === totalReels - 1}
          className={cn(
            "rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/10",
            "hover:bg-black/60 disabled:opacity-30 h-10 w-10 transition-all",
            "hover:scale-105 active:scale-95"
          )}
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      </div>
    </>
  );
}
