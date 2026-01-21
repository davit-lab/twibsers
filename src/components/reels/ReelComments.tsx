import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useReelComments } from '@/hooks/useReels';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Heart, MessageCircle, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ReelCommentsSheetProps {
  reelId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReelCommentsSheet({ reelId, open, onOpenChange }: ReelCommentsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl bg-background/95 backdrop-blur-xl border-t border-border/50">
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="text-center font-display">Comments</SheetTitle>
        </SheetHeader>
        {reelId && <CommentsContent reelId={reelId} />}
      </SheetContent>
    </Sheet>
  );
}

function CommentsContent({ reelId }: { reelId: string }) {
  const { user } = useAuth();
  const { comments, loading, addComment } = useReelComments(reelId);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSending(true);
    try {
      await addComment(newComment);
      setNewComment('');
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

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 py-4">
        {comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-10 w-10 opacity-50" />
            </div>
            <p className="font-medium text-lg mb-1">No comments yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-5 px-1">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-3 group">
                <Link to={`/profile/${comment.profile?.username}`}>
                  <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                    <AvatarImage src={comment.profile?.avatar_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs font-semibold">
                      {getInitials(comment.profile?.display_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link 
                      to={`/profile/${comment.profile?.username}`}
                      className="font-semibold text-sm hover:underline"
                    >
                      {comment.profile?.display_name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'MMM d')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
                  <div className="flex items-center gap-5 mt-2">
                    <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
                      <Heart className="h-3.5 w-3.5" />
                      {comment.like_count > 0 && <span>{comment.like_count}</span>}
                    </button>
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Comment input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 border-t border-border/30 bg-background/50">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={user.user_metadata?.avatar_url} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
              {getInitials(user.user_metadata?.display_name || 'U')}
            </AvatarFallback>
          </Avatar>
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 rounded-full bg-muted/50 border-border/50 focus:bg-background h-11"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newComment.trim() || sending}
            className="rounded-full btn-gradient h-11 w-11 flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      ) : (
        <div className="p-4 border-t border-border/30 text-center bg-background/50">
          <Link to="/auth">
            <Button variant="outline" className="rounded-full px-8">
              Sign in to comment
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
