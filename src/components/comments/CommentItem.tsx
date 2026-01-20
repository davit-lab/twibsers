import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronUp, 
  ChevronDown, 
  MessageCircle, 
  MoreHorizontal, 
  Trash2,
  Flag,
  BadgeCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Comment } from '@/hooks/useComments';

interface CommentItemProps {
  comment: Comment;
  onVote: (commentId: string, voteType: 'up' | 'down') => void;
  onReply: (content: string, parentId: string) => Promise<any>;
  onDelete: (commentId: string) => Promise<boolean>;
  depth?: number;
}

export default function CommentItem({ 
  comment, 
  onVote, 
  onReply, 
  onDelete,
  depth = 0 
}: CommentItemProps) {
  const { user, profile: currentUserProfile } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const isOwnComment = currentUserProfile?.user_id === comment.user_id;
  const voteScore = comment.upvote_count - comment.downvote_count;
  const maxDepth = 4;

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    const result = await onReply(replyContent.trim(), comment.id);
    if (result) {
      setReplyContent('');
      setIsReplying(false);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    await onDelete(comment.id);
  };

  return (
    <div className={cn("relative", depth > 0 && "ml-6 pl-4 border-l-2 border-border")}>
      <div className="flex gap-3 py-3">
        {/* Vote buttons */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={() => onVote(comment.id, 'up')}
            className={cn(
              "p-1 rounded hover:bg-muted transition-colors",
              comment.user_vote === 'up' && "text-primary"
            )}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <span className={cn(
            "text-xs font-medium",
            voteScore > 0 && "text-primary",
            voteScore < 0 && "text-destructive"
          )}>
            {voteScore}
          </span>
          <button
            onClick={() => onVote(comment.id, 'down')}
            className={cn(
              "p-1 rounded hover:bg-muted transition-colors",
              comment.user_vote === 'down' && "text-destructive"
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/profile/${comment.profiles.username}`}>
              <Avatar className="h-6 w-6">
                <AvatarImage src={comment.profiles.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-accent text-white">
                  {getInitials(comment.profiles.display_name)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link 
              to={`/profile/${comment.profiles.username}`}
              className="font-medium text-sm hover:underline"
            >
              {comment.profiles.display_name}
            </Link>
            {comment.profiles.is_verified && (
              <BadgeCheck className="h-3.5 w-3.5 text-verified" />
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            {depth < maxDepth && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {isOwnComment ? (
                  <DropdownMenuItem 
                    className="gap-2 text-destructive focus:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem className="gap-2">
                    <Flag className="h-4 w-4" />
                    Report
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Reply form */}
          {isReplying && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[80px] text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : 'Reply'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <>
          {depth >= maxDepth - 1 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-primary hover:underline mb-2 ml-11"
            >
              {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {showReplies && (
            <div>
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onVote={onVote}
                  onReply={onReply}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
