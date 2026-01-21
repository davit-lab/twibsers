import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Copy, Sparkles, MessageCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReelShareMenuProps {
  reelId: string;
  shareCount: number;
  onShareToStory: () => Promise<void>;
  onCopyLink: () => void;
}

export default function ReelShareMenu({ 
  reelId, 
  shareCount, 
  onShareToStory, 
  onCopyLink 
}: ReelShareMenuProps) {
  const [sharing, setSharing] = useState(false);
  
  const handleShareToStory = async () => {
    setSharing(true);
    try {
      await onShareToStory();
    } finally {
      setSharing(false);
    }
  };
  
  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex flex-col items-center gap-1.5 group">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
            "backdrop-blur-md border border-white/10 bg-white/10",
            "hover:bg-white/20 hover:scale-110 active:scale-95"
          )}>
            <Share2 className="h-6 w-6 text-white group-hover:text-accent transition-colors" />
          </div>
          <span className="text-white text-xs font-semibold">{formatCount(shareCount)}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-52 glass-premium border-white/10 bg-background/95 backdrop-blur-xl"
      >
        <DropdownMenuItem 
          onClick={handleShareToStory}
          disabled={sharing}
          className="gap-3 py-3 cursor-pointer"
        >
          {sharing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" />
          )}
          <span>Share to Story</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onCopyLink} 
          className="gap-3 py-3 cursor-pointer"
        >
          <Copy className="h-4 w-4" />
          <span>Copy Link</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
          <MessageCircle className="h-4 w-4" />
          <span>Send to Chat</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
