import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import Feed from '@/components/feed/Feed';
import InterestsFeed from '@/components/feed/InterestsFeed';
import FollowButton from '@/components/social/FollowButton';
import FollowersFollowingModal from '@/components/social/FollowersFollowingModal';
import { useFollowStats } from '@/hooks/useFollowStats';
import { useStories } from '@/hooks/useStories';
import { useMutualConnections } from '@/hooks/useMutualConnections';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PremiumBadge } from '@/components/ui/premium-badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Trash2,
  Camera,
  Share2,
  MoreHorizontal,
  CalendarDays,
  Users,
  FileText,
  UserCheck,
  Crown,
  ImagePlus,
  Sparkles,
} from 'lucide-react';
import LibraryModal from '@/components/library/LibraryModal';
import CoverUploadDialog from '@/components/profile/CoverUploadDialog';
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
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  
  // Story states
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isOwnProfile = currentUserProfile?.username === username;
  const { stats, loading: statsLoading } = useFollowStats(profileData?.user_id);
  const { mutuals, count: mutualCount, loading: mutualsLoading } = useMutualConnections(profileData?.user_id);
  const { data: isPremium } = usePremiumStatus(profileData?.user_id);
  const { groupedStories, viewStory, uploadStory, deleteStory } = useStories({ 
    profileUserId: profileData?.user_id 
  });
  
  
  // Modal states
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [libraryCount, setLibraryCount] = useState(0);

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

        // Fetch library count
        const { count } = await supabase
          .from('user_library')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', data.user_id);
        
        setLibraryCount(count || 0);
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
        <div className="min-h-screen bg-background relative overflow-hidden">
          {/* Ambient orbs */}
          <div className="orb-primary w-[500px] h-[500px] top-[-200px] right-[-100px]" />
          <div className="orb-accent w-[400px] h-[400px] bottom-[10%] left-[-150px]" />
          
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-56 w-full" />
            <div className="glass-card mx-4 -mt-20 p-6 rounded-2xl">
              <div className="flex gap-4">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="flex-1 space-y-3 pt-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !profileData) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4">
          {/* Ambient orbs */}
          <div className="orb-primary w-[500px] h-[500px] top-[10%] right-[-100px]" />
          <div className="orb-accent w-[400px] h-[400px] bottom-[20%] left-[-150px]" />
          
          <div className="glass-card p-12 rounded-3xl text-center max-w-md">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-black mb-3">Profile not found</h1>
            <p className="text-muted-foreground mb-8">
              This user doesn't exist or the profile has been removed.
            </p>
            <Button onClick={() => navigate('/')} className="btn-gradient font-bold px-8">
              <Sparkles className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background pb-24 lg:pb-8 relative overflow-hidden">
        {/* Ambient Background Effects */}
        <div className="orb-primary w-[500px] h-[500px] top-[-150px] right-[-100px]" />
        <div className="orb-accent w-[400px] h-[400px] bottom-[5%] left-[-150px]" />
        
        <div className="max-w-4xl mx-auto relative">
          {/* Cover Banner - Premium Gradient */}
          <div className="relative h-44 md:h-52 overflow-hidden">
            {profileData.cover_url ? (
              <img 
                src={profileData.cover_url} 
                alt="" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent">
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute top-6 left-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
                  <div className="absolute bottom-4 right-16 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-white/5 blur-[80px]" />
                </div>
              </div>
            )}
            
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            
            {/* Back button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="absolute top-4 left-4 rounded-xl bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Actions on cover */}
            <div className="absolute top-4 right-4 flex gap-2">
              {isOwnProfile && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setCoverDialogOpen(true)}
                    className="rounded-xl bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/10"
                  >
                    <ImagePlus className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    asChild
                    className="rounded-xl bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/10"
                  >
                    <Link to="/settings">
                      <Settings className="h-5 w-5" />
                    </Link>
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-xl bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/10"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Profile Header Card - Glassmorphism */}
          <div className="glass-card mx-4 -mt-20 relative rounded-2xl border border-white/10 shadow-xl">
            <div className="p-5 md:p-6">
              {/* Avatar Section */}
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                {/* Avatar with Story Ring */}
                <div className="relative -mt-16 md:-mt-20">
                  <div 
                    className={cn(
                      "rounded-full p-1 cursor-pointer transition-all duration-300 shadow-xl",
                      hasStories 
                        ? hasUnviewed 
                          ? "bg-gradient-to-br from-primary via-accent to-primary" 
                          : "bg-muted-foreground/30"
                        : "bg-card border-4 border-card"
                    )}
                    onClick={hasStories ? openViewer : undefined}
                  >
                    <div className={cn(
                      "rounded-full",
                      hasStories && "bg-card p-0.5"
                    )}>
                      <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-card shadow-xl ring-2 ring-white/5">
                        <AvatarImage 
                          src={profileData.avatar_url || undefined} 
                          alt={profileData.display_name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-3xl md:text-4xl font-black">
                          {getInitials(profileData.display_name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  {/* Add Story Button */}
                  {isOwnProfile && user && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className={cn(
                        "absolute bottom-1 right-1 w-8 h-8 rounded-lg",
                        "bg-gradient-to-br from-primary to-accent text-white",
                        "flex items-center justify-center transition-all duration-200",
                        "shadow-lg shadow-primary/40 hover:scale-110 border-2 border-card"
                      )}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  {/* Story indicator */}
                  {hasStories && (
                    <div className="absolute -top-1 -right-1 bg-gradient-to-br from-accent to-primary text-white text-xs font-bold rounded-md w-6 h-6 flex items-center justify-center shadow-lg border-2 border-card">
                      {currentGroup.stories.length}
                    </div>
                  )}
                </div>

                {/* Name and quick info */}
                <div className="flex-1 md:pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-black tracking-tight">
                      {profileData.display_name}
                    </h1>
                    {profileData.is_verified && (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                        <BadgeCheck className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {isPremium && (
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md" title="Premium Member">
                        <Crown className="h-3 w-3 text-white" />
                      </span>
                    )}
                    {isProfileAdmin && (
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                        <Hammer className="h-3 w-3 text-white" />
                      </span>
                    )}
                    {profileData.privacy === 'private' && (
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">@{profileData.username}</p>
                </div>

                {/* Action Buttons - Desktop */}
                <div className="hidden md:flex items-center gap-2">
                  {isOwnProfile ? (
                    <>
                      <Button variant="outline" asChild className="rounded-xl font-semibold border-border/50 hover:bg-muted/50 h-9">
                        <Link to="/settings">Edit Profile</Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted/50 h-9 w-9">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : user ? (
                    <>
                      <FollowButton
                        targetUserId={profileData.user_id}
                        targetUsername={profileData.username}
                        isPrivateAccount={profileData.privacy === 'private'}
                        onFollowChange={handleFollowChange}
                      />
                      <Button variant="outline" asChild className="rounded-xl font-semibold border-border/50 hover:bg-muted/50 h-9">
                        <Link to={`/messages?new=${profileData.user_id}`}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button className="btn-gradient font-semibold rounded-xl shadow-lg shadow-primary/30 h-9" asChild>
                      <Link to="/auth">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Follow
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profileData.bio && (
                <p className="mt-4 text-foreground/90 leading-relaxed max-w-2xl text-sm">
                  {profileData.bio}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-muted-foreground">
                {profileData.location && (
                  <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {profileData.location}
                  </span>
                )}
                {profileData.website && (
                  <a
                    href={profileData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    {profileData.website.replace(/^https?:\/\//, '').split('/')[0]}
                  </a>
                )}
                <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  Joined {format(new Date(profileData.created_at), 'MMM yyyy')}
                </span>
              </div>

              {/* Mutual Connections */}
              {!isOwnProfile && user && !mutualsLoading && mutualCount > 0 && (
                <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                  <UserCheck className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="flex -space-x-1.5">
                      {mutuals.slice(0, 3).map((mutual) => (
                        <Avatar key={mutual.user_id} className="w-5 h-5 border-2 border-card">
                          <AvatarImage src={mutual.avatar_url || undefined} />
                          <AvatarFallback className="text-[8px] bg-primary/20">
                            {mutual.display_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      Followed by{' '}
                      <span className="text-foreground font-medium">
                        {mutuals[0]?.display_name}
                      </span>
                      {mutualCount > 1 && (
                        <> and <span className="text-foreground font-medium">{mutualCount - 1} others</span></>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Stats Row */}
              <div className="flex items-center gap-1 mt-5 pt-5 border-t border-border/30">
                <button 
                  className="flex-1 group p-3 rounded-xl hover:bg-muted/50 transition-all text-center"
                  onClick={() => {
                    setFollowModalType('followers');
                    setFollowModalOpen(true);
                  }}
                >
                  <span className="block text-xl font-black group-hover:text-primary transition-colors">
                    {statsLoading ? '–' : stats.followers.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">followers</span>
                </button>
                <div className="w-px h-10 bg-border/30" />
                <button 
                  className="flex-1 group p-3 rounded-xl hover:bg-muted/50 transition-all text-center"
                  onClick={() => {
                    setFollowModalType('following');
                    setFollowModalOpen(true);
                  }}
                >
                  <span className="block text-xl font-black group-hover:text-primary transition-colors">
                    {statsLoading ? '–' : stats.following.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">following</span>
                </button>
                <div className="w-px h-10 bg-border/30" />
                <button 
                  className="flex-1 group p-3 rounded-xl hover:bg-muted/50 transition-all text-center"
                  onClick={() => setLibraryModalOpen(true)}
                >
                  <span className="block text-xl font-black group-hover:text-primary transition-colors">
                    {libraryCount.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">library</span>
                </button>
              </div>

              {/* Mobile Action Buttons */}
              <div className="flex md:hidden gap-2 mt-5">
                {isOwnProfile ? (
                  <>
                    <Button variant="outline" className="flex-1 rounded-xl font-semibold border-border/50 h-10" asChild>
                      <Link to="/settings">Edit Profile</Link>
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl border-border/50 h-10 w-10">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : user ? (
                  <>
                    <FollowButton
                      targetUserId={profileData.user_id}
                      targetUsername={profileData.username}
                      isPrivateAccount={profileData.privacy === 'private'}
                      onFollowChange={handleFollowChange}
                      className="flex-1 rounded-xl"
                    />
                    <Button variant="outline" className="flex-1 rounded-xl font-semibold border-border/50 h-10" asChild>
                      <Link to={`/messages?new=${profileData.user_id}`}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button className="flex-1 btn-gradient rounded-xl font-semibold shadow-lg shadow-primary/30 h-10" asChild>
                    <Link to="/auth">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Follow
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Library Modal */}
          <LibraryModal
            open={libraryModalOpen}
            onOpenChange={setLibraryModalOpen}
            userId={profileData.user_id}
            username={profileData.username}
            isOwnProfile={isOwnProfile}
          />

          {/* Activity & Interests Tabs */}
          <div className="glass-card mx-4 mt-4 rounded-2xl border border-white/10">
            <Tabs defaultValue="activity" className="w-full">
              <div className="p-4 border-b border-border/30">
                <TabsList className="grid w-full grid-cols-2 max-w-[200px] bg-muted/50 p-1 rounded-lg h-9">
                  <TabsTrigger value="activity" className="flex items-center gap-1.5 rounded-md text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <FileText className="h-3.5 w-3.5" />
                    Activity
                  </TabsTrigger>
                  <TabsTrigger value="interests" className="flex items-center gap-1.5 rounded-md text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    Interests
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="activity" className="p-4 mt-0">
                <Feed userId={profileData.user_id} refreshTrigger={refreshKey} />
              </TabsContent>
              
              <TabsContent value="interests" className="p-4 mt-0">
                <InterestsFeed userId={profileData.user_id} isOwnProfile={isOwnProfile} />
              </TabsContent>
            </Tabs>
          </div>
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
                  <Avatar className="w-10 h-10 ring-2 ring-white/30">
                    <AvatarImage src={currentGroup.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
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
                  <p className="text-white text-center text-sm bg-black/40 rounded-lg px-4 py-2 backdrop-blur-sm">
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

      {/* Followers/Following Modal */}
      <FollowersFollowingModal
        open={followModalOpen}
        onOpenChange={setFollowModalOpen}
        userId={profileData.user_id}
        type={followModalType}
        username={profileData.username}
      />

      {/* Cover Upload Dialog */}
      <CoverUploadDialog
        open={coverDialogOpen}
        onOpenChange={setCoverDialogOpen}
        onUploadComplete={(url) => {
          setProfileData(prev => prev ? { ...prev, cover_url: url } : null);
        }}
      />

      <style>{`
        @keyframes story-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-story-progress {
          animation: story-progress 5s linear forwards;
        }
      `}</style>
    </MainLayout>
  );
}
