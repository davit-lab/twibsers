import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/');
  };

  return (
    <>
      {/* Top bar - premium glass */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-[60] pointer-events-none">
        <Button 
          variant="glass" 
          size="icon" 
          className="h-11 w-11 rounded-xl bg-black/50 backdrop-blur-xl border border-white/10 pointer-events-auto hover:bg-black/70"
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
        </Button>
        
        {/* Brand logo - gradient pill */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-xl rounded-xl px-5 py-2.5 border border-white/10">
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-black text-sm tracking-wide">REELS</span>
        </div>
        
        <Button
          variant="glass"
          size="icon"
          onClick={onRefresh}
          className="h-11 w-11 rounded-xl bg-black/50 backdrop-blur-xl border border-white/10 pointer-events-auto hover:bg-black/70"
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
          "absolute top-20 right-4 z-20 w-11 h-11 rounded-xl",
          "bg-black/50 backdrop-blur-xl flex items-center justify-center",
          "border border-white/10 hover:bg-black/70 transition-all",
          "active:scale-95"
        )}
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5 text-white/60" />
        ) : (
          <Volume2 className="h-5 w-5 text-white" />
        )}
      </button>
      
      {/* Navigation indicator - gradient dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2">
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
                  ? "w-6 h-2 bg-gradient-to-r from-primary to-accent" 
                  : "w-2 h-2 bg-white/30"
              )}
            />
          );
        })}
      </div>
    </>
  );
}