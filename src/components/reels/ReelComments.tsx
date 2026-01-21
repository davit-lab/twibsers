import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useReelComments } from '@/hooks/useReels';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send, Loader2, X, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import defaultAvatar from '@/assets/default-avatar.png';

interface ReelCommentsSheetProps {
  reelId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReelCommentsSheet({ reelId, open, onOpenChange }: ReelCommentsSheetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartRef = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle drag to close
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStartRef.current) return;
    const delta = e.touches[0].clientY - dragStartRef.current;
    if (delta > 0) {
      setDragOffset(delta);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 100) {
      onOpenChange(false);
    }
    setDragOffset(0);
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Reset drag when closed
  useEffect(() => {
    if (!open) {
      setDragOffset(0);
      setIsDragging(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 h-[80vh] bg-gradient-to-b from-zinc-900 to-black rounded-t-[2rem] shadow-2xl",
          "transition-transform duration-500 ease-out",
          !isDragging && "transform-gpu"
        )}
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)'
        }}
      >
        {/* Drag handle */}
        <div 
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-white/20 mb-3" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-white/10">
          <div className="w-10" /> {/* Spacer */}
          <h2 className="text-white font-semibold text-base">Comments</h2>
          <button 
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        {reelId && <CommentsContent reelId={reelId} />}
      </div>
    </>
  );
}

function CommentsContent({ reelId }: { reelId: string }) {
  const { user } = useAuth();
  const { comments, loading, addComment, likeComment } = useReelComments(reelId);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [animatingHearts, setAnimatingHearts] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSending(true);
    try {
      await addComment(newComment);
      setNewComment('');
      // Scroll to bottom after posting
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to post comment',
      });
    } finally {
      setSending(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like comments',
      });
      return;
    }

    // Trigger animation
    setAnimatingHearts(prev => new Set(prev).add(commentId));
    setTimeout(() => {
      setAnimatingHearts(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }, 400);

    await likeComment(commentId);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
          <p className="text-white/40 text-sm">Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(80vh-80px)]">
      {/* Scrollable comments area with smooth momentum */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain px-5 py-4"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-5">
              <MessageCircle className="h-12 w-12 text-white/20" />
            </div>
            <p className="text-white font-medium text-lg mb-1">No comments yet</p>
            <p className="text-white/40 text-sm">Be the first to share your thoughts</p>
          </div>
        ) : (
          <div className="space-y-5">
            {comments.map((comment, index) => (
              <div 
                key={comment.id} 
                className="flex gap-3 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link to={`/profile/${comment.profile?.username}`} className="flex-shrink-0">
                  <Avatar className="h-11 w-11 ring-2 ring-white/10">
                    <AvatarImage src={comment.profile?.avatar_url || defaultAvatar} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-accent/80 text-white text-sm">
                      {comment.profile?.display_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link 
                      to={`/profile/${comment.profile?.username}`}
                      className="font-semibold text-white text-sm hover:underline"
                    >
                      {comment.profile?.display_name}
                    </Link>
                    <span className="text-white/30 text-xs">
                      {format(new Date(comment.created_at), 'MMM d')}
                    </span>
                  </div>
                  <p className="text-white/80 text-[15px] leading-relaxed">{comment.content}</p>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-5 mt-2">
                    <button 
                      onClick={() => handleLike(comment.id)}
                      className="flex items-center gap-1.5 group"
                    >
                      <span className="relative">
                        <Heart 
                          className={cn(
                            "h-4 w-4 transition-all duration-200",
                            comment.is_liked 
                              ? "text-red-500 fill-red-500" 
                              : "text-white/40 group-hover:text-red-400",
                            animatingHearts.has(comment.id) && "animate-like-pop"
                          )}
                        />
                        {/* Particle burst effect */}
                        {animatingHearts.has(comment.id) && (
                          <>
                            <span className="absolute w-1.5 h-1.5 bg-red-500 rounded-full animate-burst-1" style={{ top: '50%', left: '50%' }} />
                            <span className="absolute w-1.5 h-1.5 bg-red-500 rounded-full animate-burst-2" style={{ top: '50%', left: '50%' }} />
                            <span className="absolute w-1 h-1 bg-red-400 rounded-full animate-burst-3" style={{ top: '50%', left: '50%' }} />
                            <span className="absolute w-1 h-1 bg-red-400 rounded-full animate-burst-4" style={{ top: '50%', left: '50%' }} />
                          </>
                        )}
                      </span>
                      {comment.like_count > 0 && (
                        <span className={cn(
                          "text-xs tabular-nums transition-colors",
                          comment.is_liked ? "text-red-400" : "text-white/40"
                        )}>
                          {comment.like_count}
                        </span>
                      )}
                    </button>
                    <button className="text-xs text-white/40 hover:text-white/70 transition-colors font-medium">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input area with frosted glass effect */}
      {user ? (
        <form 
          onSubmit={handleSubmit} 
          className="flex items-center gap-3 p-4 border-t border-white/10 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-xl"
        >
          <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-white/10">
            <AvatarImage src={user.user_metadata?.avatar_url || defaultAvatar} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-accent/80 text-white text-xs">
              {user.user_metadata?.display_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-white/10 text-white placeholder:text-white/30 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
          </div>
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newComment.trim() || sending}
            className={cn(
              "rounded-full h-10 w-10 flex-shrink-0 transition-all",
              newComment.trim() 
                ? "bg-primary hover:bg-primary/90 text-white" 
                : "bg-white/10 text-white/30"
            )}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      ) : (
        <div className="p-4 border-t border-white/10 text-center bg-gradient-to-t from-black/80 to-transparent">
          <Link to="/auth">
            <Button variant="outline" className="rounded-full px-8 border-white/20 text-white hover:bg-white/10">
              Sign in to comment
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
