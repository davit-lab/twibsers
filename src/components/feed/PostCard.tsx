import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/ui/user-avatar';
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
  Bookmark,
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
        await supabase
          .from('stars')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        
        setIsStarred(false);
        setStarCount(prev => Math.max(0, prev - 1));
      } else {
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
    <article className="py-4 px-4">
      {/* Post Header */}
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.profiles.username}`}>
          <UserAvatar
            userId={post.user_id}
            avatarUrl={post.profiles.avatar_url}
            displayName={post.profiles.display_name}
            size="md"
          />
        </Link>

        <div className="flex-1 min-w-0">
          {/* User Info Row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link 
              to={`/profile/${post.profiles.username}`}
              className="font-semibold text-[15px] hover:underline truncate"
            >
              {post.profiles.display_name}
            </Link>
            {post.profiles.is_verified && (
              <BadgeCheck className="h-[18px] w-[18px] text-verified flex-shrink-0" />
            )}
            <span className="text-muted-foreground text-sm">@{post.profiles.username}</span>
            <span className="text-muted-foreground">·</span>
            <time 
              dateTime={post.created_at}
              className="text-muted-foreground text-sm hover:underline cursor-pointer"
            >
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })}
            </time>
            <VisibilityIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          {/* Post Content */}
          <div className="mt-1.5">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>

            {/* Media Grid */}
            {post.post_media && post.post_media.length > 0 && (
              <div className={cn(
                "grid gap-0.5 mt-3 rounded-2xl overflow-hidden border border-border/50",
                post.post_media.length === 1 && "grid-cols-1",
                post.post_media.length === 2 && "grid-cols-2",
                post.post_media.length >= 3 && "grid-cols-2"
              )}>
                {post.post_media.map((media, index) => (
                  <div 
                    key={media.id} 
                    className={cn(
                      "relative bg-muted cursor-pointer",
                      post.post_media.length === 3 && index === 0 && "row-span-2"
                    )}
                  >
                    {media.type === 'image' ? (
                      <img 
                        src={media.url} 
                        alt={media.alt_text || 'Post image'} 
                        className="w-full h-full object-cover max-h-[400px] hover:opacity-95 transition-opacity"
                        loading="lazy"
                      />
                    ) : (
                      <video 
                        src={media.url} 
                        className="w-full h-full object-cover max-h-[400px]"
                        controls
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center">
                {/* Star Button */}
                <button
                  onClick={handleStar}
                  disabled={isStarring}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-all active:scale-95",
                    isStarred 
                      ? "text-star" 
                      : "text-muted-foreground hover:text-star"
                  )}
                >
                  <Star 
                    className={cn(
                      "h-5 w-5 transition-transform",
                      isStarred && "fill-star"
                    )} 
                  />
                  {starCount > 0 && <span className="text-xs tabular-nums">{starCount}</span>}
                </button>

                {/* Comment Button */}
                <button 
                  onClick={() => setShowComments(!showComments)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-all active:scale-95",
                    showComments 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <MessageCircle className={cn("h-5 w-5", showComments && "fill-primary/20")} />
                  {commentCount > 0 && <span className="text-xs tabular-nums">{commentCount}</span>}
                </button>

                {/* Share Button */}
                <button 
                  onClick={handleShare}
                  className="flex items-center px-2 py-1.5 rounded-lg text-muted-foreground hover:text-primary transition-all active:scale-95"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              {/* Right Actions */}
              <div className="flex items-center">
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-all active:scale-95">
                  <Bookmark className="h-5 w-5" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-all active:scale-95">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-card border-border">
                    {isOwnPost ? (
                      <>
                        <DropdownMenuItem className="gap-2 text-sm">
                          <Pin className="h-4 w-4" />
                          Pin to profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="gap-2 text-destructive focus:text-destructive text-sm"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete post
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem className="gap-2 text-sm">
                        <Flag className="h-4 w-4" />
                        Report post
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Comments Section */}
            <Collapsible open={showComments} onOpenChange={setShowComments}>
              <CollapsibleContent>
                <div className="mt-2 pt-2">
                  <CommentSection postId={post.id} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </article>
  );
}
