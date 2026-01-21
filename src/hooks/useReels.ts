import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  audio_name: string | null;
  audio_url: string | null;
  duration: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  is_liked?: boolean;
}

export interface ReelComment {
  id: string;
  reel_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  like_count: number;
  created_at: string;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export function useReels() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchReels = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: reelsData, error } = await supabase
        .from('reels')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[Reels] Fetch error:', error);
        throw error;
      }

      console.log('[Reels] Fetched reels count:', reelsData?.length || 0);

      if (!reelsData || reelsData.length === 0) {
        setReels([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for each reel
      const userIds = [...new Set(reelsData.map(r => r.user_id))];
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, is_verified')
        .in('user_id', userIds);

      if (profileError) {
        console.error('[Reels] Profile fetch error:', profileError);
      }

      // Fetch user's likes if logged in
      let userLikes: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from('reel_likes')
          .select('reel_id')
          .eq('user_id', user.id);
        userLikes = (likesData || []).map(l => l.reel_id);
      }

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const enrichedReels = reelsData.map(reel => ({
        ...reel,
        profile: profileMap.get(reel.user_id) || {
          username: 'unknown',
          display_name: 'Unknown User',
          avatar_url: null,
          is_verified: false,
        },
        is_liked: userLikes.includes(reel.id),
      })) as Reel[];

      console.log('[Reels] Enriched reels:', enrichedReels.length);
      setReels(enrichedReels);
    } catch (error) {
      console.error('Error fetching reels:', error);
      setReels([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  const likeReel = async (reelId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Sign in required',
        description: 'Please sign in to like reels.',
      });
      return;
    }

    const reel = reels.find(r => r.id === reelId);
    if (!reel) return;

    try {
      if (reel.is_liked) {
        await supabase
          .from('reel_likes')
          .delete()
          .eq('reel_id', reelId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('reel_likes')
          .insert({ reel_id: reelId, user_id: user.id });
      }

      setReels(reels.map(r => 
        r.id === reelId 
          ? { 
              ...r, 
              is_liked: !r.is_liked, 
              like_count: r.is_liked ? r.like_count - 1 : r.like_count + 1 
            }
          : r
      ));
    } catch (error: any) {
      console.error('Error liking reel:', error);
    }
  };

  const incrementView = async (reelId: string) => {
    try {
      const { data } = await supabase
        .from('reels')
        .select('view_count')
        .eq('id', reelId)
        .single();
      
      if (data) {
        await supabase
          .from('reels')
          .update({ view_count: data.view_count + 1 })
          .eq('id', reelId);
      }
    } catch (error) {
      console.error('Error incrementing view:', error);
    }
  };

  const uploadReel = async (
    file: File,
    caption: string,
    onProgress?: (progress: number) => void
  ) => {
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload video
    const { error: uploadError } = await supabase.storage
      .from('reels')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('reels')
      .getPublicUrl(fileName);

    // Create reel record
    const { data: reel, error: insertError } = await supabase
      .from('reels')
      .insert({
        user_id: user.id,
        video_url: urlData.publicUrl,
        caption,
        duration: 0, // Would need video duration detection
      })
      .select()
      .single();

    if (insertError) throw insertError;

    await fetchReels();
    return reel;
  };

  return {
    reels,
    loading,
    currentIndex,
    setCurrentIndex,
    likeReel,
    incrementView,
    uploadReel,
    refetch: fetchReels,
  };
}

export function useReelComments(reelId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reel_comments')
        .select('*')
        .eq('reel_id', reelId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      const enrichedComments = (data || []).map(comment => ({
        ...comment,
        profile: profileMap.get(comment.user_id),
      })) as ReelComment[];

      setComments(enrichedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [reelId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reel_comments')
        .insert({
          reel_id: reelId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchComments();
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  return {
    comments,
    loading,
    addComment,
    refetch: fetchComments,
  };
}
