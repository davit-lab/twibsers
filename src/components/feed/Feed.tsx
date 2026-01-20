import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Loader2 } from 'lucide-react';

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
}

export default function Feed({ userId, refreshTrigger }: FeedProps) {
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
        // Get posts from followed users
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

      // Check if current user has starred each post
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
    }
  }, [userId, user, feedType, posts.length]);

  // Initial load and when dependencies change
  useEffect(() => {
    fetchPosts();
  }, [userId, refreshTrigger, feedType]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePostDeleted = () => {};

  const handleStarChange = () => {
    fetchPosts();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showFeedTabs && (
          <Tabs value={feedType} className="mb-4">
            <TabsList>
              <TabsTrigger value="all" disabled>For You</TabsTrigger>
              <TabsTrigger value="following" disabled>Following</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="mt-3 pl-[52px] space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Failed to load posts</p>
        <Button onClick={() => fetchPosts()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFeedTabs && (
        <Tabs value={feedType} onValueChange={(v) => setFeedType(v as FeedType)}>
          <TabsList>
            <TabsTrigger value="all">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-medium">
            {feedType === 'following' 
              ? 'No posts from people you follow'
              : 'No posts yet'
            }
          </p>
          <p className="text-sm mt-1">
            {feedType === 'following'
              ? 'Follow some people to see their posts here!'
              : 'Be the first to post something!'
            }
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onPostDeleted={handlePostDeleted}
            onStarChange={handleStarChange}
          />
        ))
      )}

      {hasMore && posts.length > 0 && (
        <div className="text-center py-4">
          <Button
            variant="outline"
            onClick={() => fetchPosts(true)}
            disabled={loadingMore}
            className="gap-2"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}