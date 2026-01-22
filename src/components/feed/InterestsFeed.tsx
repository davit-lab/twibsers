import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useUserInterests, useInterestCategories } from '@/hooks/useInterests';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useInterestPosts, useInterestPostActions } from '@/hooks/useInterestPosts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, Lock, Crown, PlusCircle, Heart, MessageCircle, 
  Share2, MoreHorizontal, Trash2, Loader2, BadgeCheck 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface InterestsFeedProps {
  userId: string;
  isOwnProfile?: boolean;
}

export default function InterestsFeed({ userId, isOwnProfile = false }: InterestsFeedProps) {
  const { user } = useAuth();
  const { data: userInterests, isLoading: interestsLoading } = useUserInterests(userId);
  const { data: categories } = useInterestCategories();
  const { data: isPremium, isLoading: premiumLoading } = usePremiumStatus(userId);
  const { data: viewerIsPremium } = usePremiumStatus(user?.id);
  const { data: posts, isLoading: postsLoading } = useInterestPosts({ userId });
  const { createPost, deletePost, likePost, unlikePost } = useInterestPostActions();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const isLoading = interestsLoading || premiumLoading || postsLoading;

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !selectedCategory) return;
    
    await createPost.mutateAsync({
      content: newPostContent.trim(),
      categoryId: selectedCategory,
    });
    
    setNewPostContent('');
    setSelectedCategory('');
    setCreateDialogOpen(false);
  };

  const handleLikeToggle = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    if (isLiked) {
      await unlikePost.mutateAsync(postId);
    } else {
      await likePost.mutateAsync(postId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // Show user's interests as tags
  const interests = userInterests?.map((ui: any) => ui.interest_categories).filter(Boolean) || [];
  const userCategoryIds = userInterests?.map((ui: any) => ui.category_id) || [];
  const availableCategories = categories?.filter(c => userCategoryIds.includes(c.id)) || [];

  return (
    <div className="space-y-6">
      {/* User's Interests Display */}
      {interests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {interests.map((interest: any) => (
            <span
              key={interest.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: `${interest.color}20`,
                color: interest.color,
                borderColor: interest.color,
                borderWidth: 1
              }}
            >
              {interest.name}
            </span>
          ))}
        </div>
      )}

      {/* Premium gate for posting to interests */}
      {isOwnProfile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-5 rounded-xl border",
            isPremium 
              ? "border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5" 
              : "border-border bg-card"
          )}
        >
          {isPremium ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Share to Interests Feed</p>
                  <p className="text-sm text-muted-foreground">
                    Create content based on your interests
                  </p>
                </div>
              </div>
              <Button 
                className="btn-gradient"
                onClick={() => setCreateDialogOpen(true)}
                disabled={availableCategories.length === 0}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Unlock Interests Posting</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Premium to post to your interests feed
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link to="/pricing" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Upgrade
                </Link>
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Interest Posts List */}
      {posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-border bg-card"
            >
              {/* Post Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Link to={`/profile/${post.profiles?.username}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {post.profiles?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link 
                        to={`/profile/${post.profiles?.username}`}
                        className="font-semibold hover:underline"
                      >
                        {post.profiles?.display_name}
                      </Link>
                      {post.profiles?.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>@{post.profiles?.username}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${post.interest_categories?.color}20`,
                      color: post.interest_categories?.color 
                    }}
                  >
                    {post.interest_categories?.name}
                  </span>
                  
                  {user?.id === post.user_id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deletePost.mutate(post.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <p className="text-foreground whitespace-pre-wrap">{post.content}</p>

              {/* Post Media */}
              {post.media_url && (
                <div className="mt-3 rounded-lg overflow-hidden">
                  {post.media_type?.startsWith('video') ? (
                    <video 
                      src={post.media_url} 
                      controls 
                      className="w-full max-h-96 object-cover"
                    />
                  ) : (
                    <img 
                      src={post.media_url} 
                      alt="" 
                      className="w-full max-h-96 object-cover"
                    />
                  )}
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                <button 
                  onClick={() => handleLikeToggle(post.id, post.user_has_liked || false)}
                  className={cn(
                    "flex items-center gap-1.5 text-sm transition-colors",
                    post.user_has_liked 
                      ? "text-red-500" 
                      : "text-muted-foreground hover:text-red-500"
                  )}
                >
                  <Heart className={cn("h-4 w-4", post.user_has_liked && "fill-current")} />
                  {post.like_count}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  {post.comment_count}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No interest posts yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {isOwnProfile 
              ? isPremium 
                ? "Share your first post to your interests feed!"
                : "Upgrade to Premium to start posting to your interests"
              : "This user hasn't posted any interest content yet"
            }
          </p>
          {isOwnProfile && !isPremium && (
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/pricing">
                <Sparkles className="h-4 w-4 mr-2" />
                View Premium
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Create Post Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Interest Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an interest category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                placeholder="Share your thoughts..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || !selectedCategory || createPost.isPending}
                className="btn-gradient"
              >
                {createPost.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
