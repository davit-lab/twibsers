import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useReelComments, ReelComment } from '@/hooks/useReels';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send, Loader2, X, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react';
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

interface CommentItemProps {
  comment: ReelComment;
  onLike: (commentId: string) => void;
  onReply: (parentId: string, username: string) => void;
  animatingHearts: Set<string>;
  isReply?: boolean;
}

function CommentItem({ comment, onLike, onReply, animatingHearts, isReply = false }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={cn("animate-fade-in", isReply && "ml-10 mt-3")}>
      <div className="flex gap-3">
        <Link to={`/profile/${comment.profile?.username}`} className="flex-shrink-0">
          <Avatar className={cn("ring-2 ring-white/10", isReply ? "h-8 w-8" : "h-11 w-11")}>
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
              className={cn("font-semibold text-white hover:underline", isReply ? "text-xs" : "text-sm")}
            >
              {comment.profile?.display_name}
            </Link>
            <span className="text-white/30 text-xs">
              {format(new Date(comment.created_at), 'MMM d')}
            </span>
          </div>
          <p className={cn("text-white/80 leading-relaxed", isReply ? "text-sm" : "text-[15px]")}>
            {comment.content}
          </p>
          
          {/* Actions */}
          <div className="flex items-center gap-5 mt-2">
            <button 
              onClick={() => onLike(comment.id)}
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
            <button 
              onClick={() => onReply(comment.id, comment.profile?.username || 'User')}
              className="text-xs text-white/40 hover:text-white/70 transition-colors font-medium"
            >
              Reply
            </button>
          </div>

          {/* Show/Hide replies toggle */}
          {hasReplies && !isReply && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1.5 mt-3 text-xs text-primary/80 hover:text-primary transition-colors font-medium"
            >
              <div className="w-6 h-px bg-white/20" />
              {showReplies ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Hide replies
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  View {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {hasReplies && showReplies && (
        <div className="space-y-3 mt-3">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReply={onReply}
              animatingHearts={animatingHearts}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentsContent({ reelId }: { reelId: string }) {
  const { user } = useAuth();
  const { comments, loading, addComment, likeComment, refetch } = useReelComments(reelId);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [animatingHearts, setAnimatingHearts] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const pullStartY = useRef(0);
  const threshold = 60;
  const maxPull = 100;

  const handlePullStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handlePullMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    if (scrollRef.current && scrollRef.current.scrollTop > 0) {
      setPullDistance(0);
      return;
    }

    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0) {
      const resistance = 0.4;
      const pull = Math.min(delta * resistance, maxPull);
      setPullDistance(pull);
    }
  }, [isPulling, isRefreshing]);

  const handlePullEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await refetch();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, isRefreshing, refetch]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldRefresh = pullDistance >= threshold;

  const handleReply = (parentId: string, username: string) => {
    setReplyingTo({ id: parentId, username });
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSending(true);
    try {
      await addComment(newComment, replyingTo?.id);
      setNewComment('');
      setReplyingTo(null);
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
        className="flex-1 overflow-y-auto overscroll-contain relative"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
        onTouchStart={handlePullStart}
        onTouchMove={handlePullMove}
        onTouchEnd={handlePullEnd}
      >
        {/* Pull-to-refresh indicator */}
        <div
          className={cn(
            "absolute left-0 right-0 flex items-center justify-center transition-opacity duration-300 z-10 pointer-events-none",
            pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0"
          )}
          style={{
            top: 0,
            height: 60,
            transform: `translateY(${Math.min(pullDistance - 60, 0)}px)`,
          }}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
              shouldRefresh || isRefreshing
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-white/10 text-white/60"
            )}
            style={{
              transform: `scale(${0.5 + progress * 0.5}) rotate(${progress * 180}deg)`,
            }}
          >
            {isRefreshing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowDown
                className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  shouldRefresh && "rotate-180"
                )}
              />
            )}
          </div>
        </div>

        {/* Content with pull transform */}
        <div 
          className="px-5 py-4"
          style={{
            transform: `translateY(${pullDistance}px)`,
            transition: pullDistance === 0 ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
          }}
        >
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-5">
                <MessageCircle className="h-12 w-12 text-white/20" />
              </div>
              <p className="text-white font-medium text-lg mb-1">No comments yet</p>
              <p className="text-white/40 text-sm">Be the first to share your thoughts</p>
            </div>
          ) : (
            <div className="space-y-5">
              {comments.map((comment, index) => (
                <div key={comment.id} style={{ animationDelay: `${index * 50}ms` }}>
                  <CommentItem
                    comment={comment}
                    onLike={handleLike}
                    onReply={handleReply}
                    animatingHearts={animatingHearts}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input area with frosted glass effect */}
      {user ? (
        <div className="border-t border-white/10 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-xl">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
              <span className="text-xs text-white/60">
                Replying to <span className="text-primary font-medium">@{replyingTo.username}</span>
              </span>
              <button 
                onClick={cancelReply}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <form 
            onSubmit={handleSubmit} 
            className="flex items-center gap-3 p-4"
          >
            <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-white/10">
              <AvatarImage src={user.user_metadata?.avatar_url || defaultAvatar} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-accent/80 text-white text-xs">
                {user.user_metadata?.display_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
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
        </div>
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