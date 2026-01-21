import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Sparkles } from 'lucide-react';
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

interface Post {
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

type FeedType = 'all' | 'following';

interface FeedProps {
  userId?: string;
  refreshTrigger?: number;
  onRefreshComplete?: () => void;
}

export default function Feed({ userId, refreshTrigger, onRefreshComplete }: FeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<FeedType>('all');
  
  const PAGE_SIZE = 10;
  const showFeedTabs = !userId && user;

  const fetchPosts = useCallback(async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          visibility,
          star_count,
          comment_count,
          is_pinned,
          created_at,
          user_id,
          profiles!inner (
            username,
            display_name,
            avatar_url,
            is_verified
          ),
          post_media (
            id,
            url,
            type,
            alt_text
          )
        `)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (feedType === 'following' && user) {
        const { data: followedUsers } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .eq('status', 'accepted');

        const followedIds = followedUsers?.map(f => f.following_id) || [];
        
        if (followedIds.length === 0) {
          setPosts([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          onRefreshComplete?.();
          return;
        }
        
        query = query.in('user_id', followedIds);
      }

      if (loadMore && posts.length > 0) {
        query = query.lt('created_at', posts[posts.length - 1].created_at);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const transformedPosts = (data || []).map(post => ({
        ...post,
        profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
        post_media: post.post_media || [],
      })) as Post[];

      if (user && transformedPosts.length > 0) {
        const postIds = transformedPosts.map(p => p.id);
        const { data: stars } = await supabase
          .from('stars')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        const starredPostIds = new Set(stars?.map(s => s.post_id) || []);
        transformedPosts.forEach(post => {
          post.user_has_starred = starredPostIds.has(post.id);
        });
      }

      if (loadMore) {
        setPosts(prev => [...prev, ...transformedPosts]);
      } else {
        setPosts(transformedPosts);
      }

      setHasMore(transformedPosts.length === PAGE_SIZE);
    } catch (err: any) {
      console.error('Feed fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      onRefreshComplete?.();
    }
  }, [userId, user, feedType, posts.length, onRefreshComplete]);

  useEffect(() => {
    fetchPosts();
  }, [userId, refreshTrigger, feedType]);

  useEffect(() => {
    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        () => fetchPosts()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => setPosts(prev => prev.filter(p => p.id !== payload.old.id))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePostDeleted = () => {};
  const handleStarChange = () => fetchPosts();

  if (loading) {
    return (
      <div className="space-y-1">
        {showFeedTabs && (
          <div className="flex gap-1 p-1 bg-muted/30 rounded-full mb-4 w-fit">
            <div className="px-4 py-2 rounded-full bg-primary/20 text-sm font-medium">For You</div>
            <div className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground">Following</div>
          </div>
        )}
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-card/50 border-b border-border/30">
            <div className="flex items-start gap-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-destructive font-medium mb-2">Failed to load posts</p>
        <p className="text-sm text-muted-foreground mb-4">Something went wrong. Please try again.</p>
        <Button onClick={() => fetchPosts()} variant="outline" className="gap-2 rounded-full">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Feed Type Tabs - Pill Style */}
      {showFeedTabs && (
        <div className="flex gap-1 p-1 bg-muted/30 rounded-full mb-4 w-fit">
          <button
            onClick={() => setFeedType('all')}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200",
              feedType === 'all'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            For You
          </button>
          <button
            onClick={() => setFeedType('following')}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200",
              feedType === 'following'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            Following
          </button>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <p className="font-semibold text-lg mb-1">
            {feedType === 'following' ? 'Your feed is empty' : 'No posts yet'}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {feedType === 'following'
              ? 'Follow some people to see their posts here!'
              : 'Be the first to share something with the community!'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onStarChange={handleStarChange}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && posts.length > 0 && (
        <div className="text-center py-6">
          <Button
            variant="ghost"
            onClick={() => fetchPosts(true)}
            disabled={loadingMore}
            className="gap-2 rounded-full text-muted-foreground hover:text-foreground"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Show more'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
