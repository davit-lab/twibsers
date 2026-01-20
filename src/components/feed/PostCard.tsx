import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import CommentSection from '@/components/comments/CommentSection';
import { 
  Star, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Trash2,
  Flag,
  Pin,
  BadgeCheck,
  Globe,
  Users,
  Lock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface PostProfile {
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
}

interface PostMedia {
  id: string;
  url: string;
  type: string;
  alt_text: string | null;
}

interface PostData {
  id: string;
  content: string;
  visibility: 'public' | 'followers' | 'private';
  star_count: number;
  comment_count: number;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
  profiles: PostProfile;
  post_media: PostMedia[];
  user_has_starred?: boolean;
}

interface PostCardProps {
  post: PostData;
  onPostDeleted?: () => void;
  onStarChange?: () => void;
}

const visibilityIcons = {
  public: Globe,
  followers: Users,
  private: Lock,
};

export default function PostCard({ post, onPostDeleted, onStarChange }: PostCardProps) {
  const { user, profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [isStarred, setIsStarred] = useState(post.user_has_starred || false);
  const [starCount, setStarCount] = useState(post.star_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [isStarring, setIsStarring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const isOwnPost = currentUserProfile?.user_id === post.user_id;

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const handleStar = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to star posts.',
      });
      return;
    }

    setIsStarring(true);
    
    try {
      if (isStarred) {
        // Remove star
        await supabase
          .from('stars')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        
        setIsStarred(false);
        setStarCount(prev => Math.max(0, prev - 1));
      } else {
        // Add star
        await supabase
          .from('stars')
          .insert({
            post_id: post.id,
            user_id: user.id,
          });
        
        setIsStarred(true);
        setStarCount(prev => prev + 1);
      }
      
      onStarChange?.();
    } catch (error: any) {
      console.error('Star error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update star. Please try again.',
      });
    } finally {
      setIsStarring(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwnPost) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: 'Post deleted',
        description: 'Your post has been removed.',
      });
      
      onPostDeleted?.();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete post. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.profiles.display_name}`,
          text: post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
          url: postUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(postUrl);
      toast({
        title: 'Link copied!',
        description: 'Post link copied to clipboard.',
      });
    }
  };

  const VisibilityIcon = visibilityIcons[post.visibility];

  return (
    <article className="p-4 bg-card rounded-xl border border-border feed-card">
      {/* Post Header */}
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.profiles.username}`}>
          <Avatar className="h-10 w-10 hover:opacity-90 transition-opacity">
            <AvatarImage src={post.profiles.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
              {getInitials(post.profiles.display_name)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link 
              to={`/profile/${post.profiles.username}`}
              className="font-semibold hover:underline truncate"
            >
              {post.profiles.display_name}
            </Link>
            {post.profiles.is_verified && (
              <BadgeCheck className="h-4 w-4 text-verified flex-shrink-0" />
            )}
            <span className="text-muted-foreground">·</span>
            <Link 
              to={`/profile/${post.profiles.username}`}
              className="text-muted-foreground hover:underline text-sm truncate"
            >
              @{post.profiles.username}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <time dateTime={post.created_at}>
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </time>
            <span>·</span>
            <VisibilityIcon className="h-3 w-3" />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwnPost ? (
              <>
                <DropdownMenuItem className="gap-2">
                  <Pin className="h-4 w-4" />
                  Pin to profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete post
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem className="gap-2">
                <Flag className="h-4 w-4" />
                Report post
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Post Content */}
      <div className="mt-3 pl-[52px]">
        <p className="text-foreground whitespace-pre-wrap break-words">{post.content}</p>

        {/* Media Grid */}
        {post.post_media && post.post_media.length > 0 && (
          <div className={cn(
            "grid gap-2 mt-3 rounded-xl overflow-hidden",
            post.post_media.length === 1 && "grid-cols-1",
            post.post_media.length === 2 && "grid-cols-2",
            post.post_media.length >= 3 && "grid-cols-2"
          )}>
            {post.post_media.map((media, index) => (
              <div 
                key={media.id} 
                className={cn(
                  "relative bg-muted",
                  post.post_media.length === 3 && index === 0 && "row-span-2"
                )}
              >
                {media.type === 'image' ? (
                  <img 
                    src={media.url} 
                    alt={media.alt_text || 'Post image'} 
                    className="w-full h-full object-cover max-h-96"
                    loading="lazy"
                  />
                ) : (
                  <video 
                    src={media.url} 
                    className="w-full h-full object-cover max-h-96"
                    controls
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center gap-6 mt-4">
          <button
            onClick={handleStar}
            disabled={isStarring}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-all group",
              isStarred 
                ? "text-star" 
                : "text-muted-foreground hover:text-star"
            )}
          >
            <Star 
              className={cn(
                "h-5 w-5 transition-transform star-burst",
                isStarred && "fill-star animate-star-pop"
              )} 
            />
            <span className="group-hover:text-star">{starCount > 0 && starCount}</span>
          </button>

          <button 
            onClick={() => setShowComments(!showComments)}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              showComments ? "text-primary" : "text-muted-foreground hover:text-primary"
            )}
          >
            <MessageCircle className={cn("h-5 w-5", showComments && "fill-primary/20")} />
            <span>{commentCount > 0 && commentCount}</span>
          </button>

          <button 
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {/* Comments Section */}
        <Collapsible open={showComments} onOpenChange={setShowComments}>
          <CollapsibleContent>
            <CommentSection postId={post.id} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </article>
  );
}