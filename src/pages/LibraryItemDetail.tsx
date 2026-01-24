import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AudioPlayer from '@/components/library/AudioPlayer';
import PdfViewer from '@/components/library/PdfViewer';
import { useAuth } from '@/contexts/AuthContext';
import { LibraryItem } from '@/hooks/useLibraryItems';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Download,
  Share2,
  Eye,
  MoreHorizontal,
  Send,
  Trash2,
  Edit,
  Lock,
  Users,
  Globe,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export default function LibraryItemDetail() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState<LibraryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  useEffect(() => {
    if (itemId) {
      fetchItem();
      fetchComments();
      incrementView();
    }
  }, [itemId]);

  const fetchItem = async () => {
    try {
      const { data, error } = await supabase
        .from('library_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;

      // Fetch profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url, is_verified')
        .eq('user_id', data.user_id)
        .single();

      setItem({
        ...data,
        type: data.type as LibraryItem['type'],
        visibility: data.visibility as LibraryItem['visibility'],
        profiles: profile || undefined
      });
      setLikeCount(data.like_count);

      // Check if liked
      if (user) {
        const { data: like } = await supabase
          .from('library_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('item_id', itemId)
          .maybeSingle();
        
        setIsLiked(!!like);
      }
    } catch (err: any) {
      console.error('Error fetching item:', err);
      toast.error('Item not found');
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('library_comments')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for all comments
      const userIds = [...new Set(data?.map(d => d.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setComments(data?.map(c => ({
        ...c,
        profiles: profileMap.get(c.user_id) as Comment['profiles']
      })) || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const incrementView = async () => {
    try {
      await supabase
        .from('library_items')
        .update({ view_count: (item?.view_count || 0) + 1 })
        .eq('id', itemId);
    } catch (err) {
      // Silent fail
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like');
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('library_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', itemId);
        setLikeCount(prev => prev - 1);
      } else {
        await supabase
          .from('library_likes')
          .insert({ user_id: user.id, item_id: itemId });
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (err) {
      toast.error('Failed to update like');
    }
  };

  const handleDownload = async () => {
    if (!item) return;

    try {
      // Increment download count
      await supabase
        .from('library_items')
        .update({ download_count: item.download_count + 1 })
        .eq('id', itemId);

      // Trigger download
      window.open(item.file_url, '_blank');
    } catch (err) {
      toast.error('Failed to download');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: item?.title,
        url: window.location.href
      });
    } catch (err) {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('library_comments')
        .insert({
          user_id: user.id,
          item_id: itemId,
          content: newComment.trim()
        })
        .select('*')
        .single();

      if (error) throw error;

      // Fetch the current user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      const newCommentData: Comment = {
        ...data,
        profiles: profile as Comment['profiles']
      };

      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this item? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('library_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Item deleted');
      navigate('/library');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const getVisibilityIcon = () => {
    switch (item?.visibility) {
      case 'private':
        return <Lock className="h-4 w-4" />;
      case 'followers':
        return <Users className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="aspect-video rounded-xl mb-6" />
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!item) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold mb-2">Item not found</h2>
          <Button onClick={() => navigate('/library')}>Back to Library</Button>
        </div>
      </MainLayout>
    );
  }

  const isOwner = user?.id === item.user_id;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Content Viewer */}
        {item.type === 'audio' && (
          <AudioPlayer
            src={item.file_url}
            title={item.title}
            artist={item.profiles?.display_name}
            coverUrl={item.thumbnail_url || undefined}
            className="mb-6"
          />
        )}

        {item.type === 'pdf' && (
          <div className="mb-6">
            <div className="aspect-[3/4] max-h-[500px] bg-muted rounded-xl flex items-center justify-center border border-border/50">
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-3xl font-bold text-red-500">PDF</span>
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {item.page_count ? `${item.page_count} pages` : 'PDF Document'}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setShowPdfViewer(true)}>
                    Open Viewer
                  </Button>
                  {item.allow_downloads && (
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {item.type === 'image' && (
          <div className="mb-6 rounded-xl overflow-hidden border border-border/50">
            <img
              src={item.file_url}
              alt={item.title}
              className="w-full max-h-[70vh] object-contain bg-muted"
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="uppercase text-xs">
                {item.type}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                {getVisibilityIcon()}
                {item.visibility}
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-2">{item.title}</h1>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Author */}
        {item.profiles && (
          <Link
            to={`/profile/${item.profiles.username}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors mb-4"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={item.profiles.avatar_url || undefined} />
              <AvatarFallback>
                {item.profiles.display_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{item.profiles.display_name}</p>
              <p className="text-sm text-muted-foreground">@{item.profiles.username}</p>
            </div>
            <Button size="sm" variant="outline">Follow</Button>
          </Link>
        )}

        {/* Description */}
        {item.description && (
          <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
            {item.description}
          </p>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {item.tags.map(tag => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats & Actions */}
        <div className="flex items-center justify-between py-4 border-y border-border/50 mb-6">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {item.view_count} views
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              {item.download_count} downloads
            </span>
            <span>
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(isLiked && "text-red-500")}
            >
              <Heart className={cn("h-4 w-4 mr-1", isLiked && "fill-current")} />
              {likeCount}
            </Button>

            {item.allow_downloads && (
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comments */}
        {item.allow_comments && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments ({comments.length})
            </h2>

            {/* Comment Input */}
            {user ? (
              <div className="flex gap-3 mb-6">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={1}
                    className="resize-none"
                  />
                  <Button
                    size="icon"
                    disabled={!newComment.trim() || submitting}
                    onClick={handleComment}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground mb-6">
                <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to comment
              </p>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {comment.profiles.display_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/profile/${comment.profiles.username}`}
                        className="font-medium hover:underline"
                      >
                        {comment.profiles.display_name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No comments yet. Be the first!
                </p>
              )}
            </div>
          </div>
        )}

        {/* PDF Viewer Modal */}
        {showPdfViewer && item.type === 'pdf' && (
          <PdfViewer
            bookId={item.id}
            bookTitle={item.title}
            onClose={() => setShowPdfViewer(false)}
          />
        )}
      </div>
    </MainLayout>
  );
}
