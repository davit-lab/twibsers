import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import Feed from '@/components/feed/Feed';
import FollowButton from '@/components/social/FollowButton';
import { useFollowStats } from '@/hooks/useFollowStats';
import { useStories } from '@/hooks/useStories';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  BadgeCheck,
  MapPin,
  Link as LinkIcon,
  Settings,
  Lock,
  MessageCircle,
  Hammer,
  ArrowLeft,
  Plus,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  Zap,
  Camera,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProfileData {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  location: string | null;
  website: string | null;
  privacy: 'public' | 'private';
  is_verified: boolean;
  created_at: string;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isProfileAdmin, setIsProfileAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [postCount, setPostCount] = useState(0);
  
  // Story states
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isOwnProfile = currentUserProfile?.username === username;
  const { stats, loading: statsLoading } = useFollowStats(profileData?.user_id);
  const { groupedStories, viewStory, uploadStory, deleteStory } = useStories({ 
    profileUserId: profileData?.user_id 
  });

  const hasStories = groupedStories.length > 0 && groupedStories[0]?.stories.length > 0;
  const currentGroup = groupedStories[0];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const hasUnviewed = currentGroup?.has_unviewed;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setError('Profile not found');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (fetchError || !data) {
        setError('Profile not found');
      } else {
        setProfileData(data as ProfileData);
        
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user_id)
          .eq('role', 'admin')
          .maybeSingle();
        
        setIsProfileAdmin(!!roleData);

        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', data.user_id);
        
        setPostCount(count || 0);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [username]);

  const handleFollowChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image or video file.',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 50MB.',
      });
      return;
    }

    setUploading(true);
    try {
      await uploadStory(file);
      toast({
        title: 'Story added!',
        description: 'Your story will be visible for 24 hours.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload story.',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openViewer = () => {
    if (!hasStories) return;
    setCurrentStoryIndex(0);
    setViewerOpen(true);
    const story = currentGroup?.stories[0];
    if (story && !story.is_viewed) {
      viewStory(story.id);
    }
  };

  const nextStory = () => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      const newIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(newIndex);
      const story = currentGroup.stories[newIndex];
      if (story && !story.is_viewed) viewStory(story.id);
    } else {
      setViewerOpen(false);
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen">
          <div className="max-w-2xl mx-auto pt-8 px-6">
            <Skeleton className="h-80 w-full rounded-3xl mb-6" />
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !profileData) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">User not found</h1>
            <p className="text-muted-foreground mb-8">
              This profile doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/')} className="btn-gradient rounded-full px-8">
              Explore
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen pb-24 lg:pb-8">
        {/* Hero Header - Magazine Style */}
        <div className="relative">
          {/* Background Gradient */}
          <div className="absolute inset-0 h-[420px] bg-gradient-to-b from-primary/10 via-accent/5 to-background" />
          
          {/* Floating Navigation */}
          <div className="relative z-20 flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {isOwnProfile ? (
              <Button 
                variant="ghost" 
                size="icon" 
                asChild
                className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
              >
                <Link to="/settings">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <div className="w-10" />
            )}
          </div>

          {/* Profile Card */}
          <div className="relative z-10 max-w-2xl mx-auto px-4 pt-4">
            <div className="glass-premium rounded-[2rem] p-6 md:p-8">
              {/* Top Section - Avatar & Story */}
              <div className="flex flex-col items-center mb-6">
                {/* Avatar with Story Ring */}
                <div className="relative mb-4 group">
                  <div 
                    className={cn(
                      "rounded-[1.5rem] p-[3px] cursor-pointer transition-all duration-500",
                      hasStories 
                        ? hasUnviewed 
                          ? "bg-gradient-to-br from-primary via-accent to-primary bg-[length:200%_200%] animate-gradient-shift" 
                          : "bg-muted-foreground/20"
                        : "bg-transparent"
                    )}
                    onClick={hasStories ? openViewer : undefined}
                  >
                    <div className="rounded-[1.3rem] bg-background p-[3px]">
                      <Avatar className="w-28 h-28 md:w-32 md:h-32 rounded-[1.2rem]">
                        <AvatarImage src={profileData.avatar_url || undefined} className="object-cover rounded-[1.2rem]" />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-3xl font-bold rounded-[1.2rem]">
                          {getInitials(profileData.display_name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  {/* Story Indicator Badge */}
                  {hasStories && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold rounded-full px-3 py-1 shadow-lg">
                      <Zap className="w-3 h-3" />
                      {currentGroup.stories.length} {currentGroup.stories.length === 1 ? 'story' : 'stories'}
                    </div>
                  )}

                  {/* Add Story Button */}
                  {isOwnProfile && user && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className={cn(
                        "absolute -bottom-2 -right-2 w-10 h-10 rounded-xl",
                        "bg-gradient-to-br from-primary to-accent text-white",
                        "flex items-center justify-center transition-all duration-300",
                        "shadow-lg shadow-primary/30 hover:scale-110 hover:shadow-xl",
                        "border-4 border-background"
                      )}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Name & Badges */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {profileData.privacy === 'private' && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <h1 className="text-2xl md:text-3xl font-bold gradient-text">
                      {profileData.display_name}
                    </h1>
                    {profileData.is_verified && (
                      <div className="verified-badge">
                        <BadgeCheck className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {isProfileAdmin && (
                      <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                        <Hammer className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground font-medium">@{profileData.username}</p>
                </div>
              </div>

              {/* Stats Row - Unique Pill Design */}
              <div className="flex justify-center gap-3 mb-6">
                <div className="glass-card rounded-2xl px-5 py-3 text-center min-w-[90px] hover-glow transition-all cursor-pointer">
                  <div className="text-xl font-bold">{postCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Posts</div>
                </div>
                <div className="glass-card rounded-2xl px-5 py-3 text-center min-w-[90px] hover-glow transition-all cursor-pointer">
                  <div className="text-xl font-bold">
                    {statsLoading ? '–' : stats.followers.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Followers</div>
                </div>
                <div className="glass-card rounded-2xl px-5 py-3 text-center min-w-[90px] hover-glow transition-all cursor-pointer">
                  <div className="text-xl font-bold">
                    {statsLoading ? '–' : stats.following.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Following</div>
                </div>
              </div>

              {/* Bio Section */}
              {profileData.bio && (
                <p className="text-center text-sm md:text-base mb-6 max-w-md mx-auto leading-relaxed">
                  {profileData.bio}
                </p>
              )}

              {/* Meta Tags - Chip Style */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {profileData.location && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm text-secondary-foreground">
                    <MapPin className="h-3 w-3" />
                    {profileData.location}
                  </span>
                )}
                {profileData.website && (
                  <a
                    href={profileData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-sm text-primary hover:bg-primary/20 transition-colors"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {profileData.website.replace(/^https?:\/\//, '').split('/')[0]}
                  </a>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  Since {format(new Date(profileData.created_at), 'MMM yyyy')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                {isOwnProfile ? (
                  <>
                    <Button 
                      variant="outline" 
                      className="rounded-full px-6 h-11 border-2"
                      asChild
                    >
                      <Link to="/settings">Edit Profile</Link>
                    </Button>
                    <Button 
                      className="btn-gradient rounded-full px-6 h-11"
                    >
                      Share Profile
                    </Button>
                  </>
                ) : user ? (
                  <>
                    <FollowButton
                      targetUserId={profileData.user_id}
                      targetUsername={profileData.username}
                      isPrivateAccount={profileData.privacy === 'private'}
                      onFollowChange={handleFollowChange}
                      className="rounded-full px-6 h-11"
                    />
                    <Button 
                      variant="outline" 
                      className="rounded-full h-11 px-6 border-2 gap-2"
                      asChild
                    >
                      <Link to={`/messages?new=${profileData.user_id}`}>
                        <MessageCircle className="h-4 w-4" />
                        Message
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button className="btn-gradient rounded-full px-8 h-11" asChild>
                    <Link to="/auth">Follow</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="max-w-2xl mx-auto px-4 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Posts
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
          
          <Feed userId={profileData.user_id} refreshTrigger={refreshKey} />
        </div>
      </div>

      {/* Hidden file input for story upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Story Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-lg p-0 bg-black border-none overflow-hidden h-[90vh] max-h-[800px]">
          {currentStory && currentGroup && (
            <div className="relative h-full w-full flex flex-col">
              {/* Progress bars */}
              <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
                {currentGroup.stories.map((story, i) => (
                  <div key={story.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full bg-white transition-all duration-300",
                        i < currentStoryIndex && "w-full",
                        i === currentStoryIndex && !paused && "animate-story-progress",
                        i > currentStoryIndex && "w-0"
                      )}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 ring-2 ring-white/30 rounded-xl">
                    <AvatarImage src={currentGroup.avatar_url || undefined} className="rounded-xl" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm rounded-xl">
                      {getInitials(currentGroup.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold text-sm">{currentGroup.display_name}</p>
                    <p className="text-white/60 text-xs">
                      {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPaused(!paused)}
                    className="rounded-full text-white hover:bg-white/20"
                  >
                    {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  </Button>
                  {currentStory.media_type === 'video' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMuted(!muted)}
                      className="rounded-full text-white hover:bg-white/20"
                    >
                      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  )}
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        deleteStory(currentStory.id);
                        nextStory();
                      }}
                      className="rounded-full text-white hover:bg-destructive/80"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewerOpen(false)}
                    className="rounded-full text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Media */}
              <div className="flex-1 flex items-center justify-center bg-black">
                {currentStory.media_type === 'video' ? (
                  <video
                    src={currentStory.media_url}
                    className="max-h-full max-w-full object-contain"
                    autoPlay
                    loop={false}
                    muted={muted}
                    playsInline
                    onEnded={nextStory}
                  />
                ) : (
                  <img
                    src={currentStory.media_url}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                    onLoad={() => {
                      if (!paused) {
                        setTimeout(nextStory, (currentStory.duration || 5) * 1000);
                      }
                    }}
                  />
                )}
              </div>

              {/* Caption */}
              {currentStory.caption && (
                <div className="absolute bottom-20 left-4 right-4 z-20">
                  <p className="text-white text-center text-sm bg-black/40 rounded-xl px-4 py-2 backdrop-blur-sm">
                    {currentStory.caption}
                  </p>
                </div>
              )}

              {/* Navigation */}
              <button onClick={prevStory} className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 z-10" />
              <button onClick={nextStory} className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 z-10" />

              {currentStoryIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevStory}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/30 text-white hover:bg-black/50"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              {currentStoryIndex < currentGroup.stories.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextStory}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/30 text-white hover:bg-black/50"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* View count for own stories */}
              {isOwnProfile && (
                <div className="absolute bottom-4 left-0 right-0 z-20 text-center">
                  <span className="text-white/60 text-sm">
                    👁 {currentStory.view_count} views
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes story-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-story-progress {
          animation: story-progress 5s linear forwards;
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-shift {
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
    </MainLayout>
  );
}
