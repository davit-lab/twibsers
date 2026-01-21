import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Share2, 
  Copy, 
  Sparkles, 
  MessageCircle, 
  Loader2,
  ExternalLink,
  Send,
  Twitter,
  Facebook
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ReelShareMenuProps {
  reelId: string;
  shareCount: number;
  creatorUsername: string;
  onShareToStory: () => Promise<void>;
  onCopyLink: () => void;
}

export default function ReelShareMenu({ 
  reelId, 
  shareCount,
  creatorUsername,
  onShareToStory, 
  onCopyLink 
}: ReelShareMenuProps) {
  const [sharing, setSharing] = useState(false);
  const { toast } = useToast();
  
  const reelUrl = `${window.location.origin}/reels/${reelId}`;
  const shareText = `Check out this amazing reel by @${creatorUsername}!`;
  
  const handleShareToStory = async () => {
    setSharing(true);
    try {
      await onShareToStory();
    } finally {
      setSharing(false);
    }
  };
  
  const handleShareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(reelUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    toast({ title: 'Opening Twitter...' });
  };
  
  const handleShareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reelUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    toast({ title: 'Opening Facebook...' });
  };
  
  const handleShareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${reelUrl}`)}`;
    window.open(url, '_blank');
    toast({ title: 'Opening WhatsApp...' });
  };
  
  const handleSendInChat = () => {
    // Navigate to messages with the reel link pre-filled
    // For now, copy link and show toast
    navigator.clipboard.writeText(reelUrl);
    toast({ 
      title: 'Link copied!', 
      description: 'Paste it in any chat to share this reel.' 
    });
  };
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this reel!',
          text: shareText,
          url: reelUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      onCopyLink();
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
        className="w-56 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl"
      >
        {/* Share to Story */}
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
        
        {/* Send in Chat */}
        <DropdownMenuItem 
          onClick={handleSendInChat} 
          className="gap-3 py-3 cursor-pointer"
        >
          <Send className="h-4 w-4 text-blue-400" />
          <span>Send in Chat</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* External platforms */}
        <DropdownMenuItem 
          onClick={handleShareToTwitter} 
          className="gap-3 py-3 cursor-pointer"
        >
          <Twitter className="h-4 w-4 text-sky-400" />
          <span>Share to X (Twitter)</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleShareToFacebook} 
          className="gap-3 py-3 cursor-pointer"
        >
          <Facebook className="h-4 w-4 text-blue-500" />
          <span>Share to Facebook</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleShareToWhatsApp} 
          className="gap-3 py-3 cursor-pointer"
        >
          <MessageCircle className="h-4 w-4 text-green-500" />
          <span>Share to WhatsApp</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Copy link */}
        <DropdownMenuItem 
          onClick={onCopyLink} 
          className="gap-3 py-3 cursor-pointer"
        >
          <Copy className="h-4 w-4" />
          <span>Copy Link</span>
        </DropdownMenuItem>
        
        {/* Native share (mobile) */}
        <DropdownMenuItem 
          onClick={handleNativeShare} 
          className="gap-3 py-3 cursor-pointer"
        >
          <ExternalLink className="h-4 w-4" />
          <span>More Options...</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
