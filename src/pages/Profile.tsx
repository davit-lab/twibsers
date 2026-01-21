import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import Feed from '@/components/feed/Feed';
import FollowButton from '@/components/social/FollowButton';
import ProfileStoryRing from '@/components/profile/ProfileStoryRing';
import { useFollowStats } from '@/hooks/useFollowStats';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BadgeCheck,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Settings,
  Lock,
  MessageCircle,
  Hammer,
  Grid3X3,
  Bookmark,
  Heart,
  MoreHorizontal,
  Share,
  UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';
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
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isProfileAdmin, setIsProfileAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [postCount, setPostCount] = useState(0);
  
  const isOwnProfile = currentUserProfile?.username === username;
  const { stats, loading: statsLoading } = useFollowStats(profileData?.user_id);

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
        
        // Check if this user is an admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user_id)
          .eq('role', 'admin')
          .maybeSingle();
        
        setIsProfileAdmin(!!roleData);

        // Get post count
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

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen">
          <div className="max-w-lg mx-auto pt-4 px-4">
            <div className="flex items-center gap-6 mb-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex justify-around py-4 border-y border-border">
              <Skeleton className="h-12 w-16" />
              <Skeleton className="h-12 w-16" />
              <Skeleton className="h-12 w-16" />
            </div>
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
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold mb-2">User not found</h1>
            <p className="text-muted-foreground mb-6">
              The user you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate('/')} className="btn-gradient">
              Go Home
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen pb-24 lg:pb-8">
        <div className="max-w-lg mx-auto">
          {/* Header Bar */}
          <div className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {profileData.privacy === 'private' && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <h1 className="font-bold text-lg">{profileData.username}</h1>
              {profileData.is_verified && (
                <BadgeCheck className="h-5 w-5 text-verified" />
              )}
              {isProfileAdmin && (
                <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <Hammer className="h-3 w-3 text-white" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/settings">
                    <Settings className="h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Profile Info Section */}
          <div className="px-4 pt-6">
            {/* Top row: Avatar + Stats */}
            <div className="flex items-center gap-6 mb-6">
              {/* Profile Avatar with Story Ring */}
              <ProfileStoryRing
                userId={profileData.user_id}
                avatarUrl={profileData.avatar_url}
                displayName={profileData.display_name}
                isOwnProfile={isOwnProfile}
                size="lg"
              />

              {/* Stats */}
              <div className="flex-1 flex justify-around">
                <button className="flex flex-col items-center hover:opacity-70 transition-opacity">
                  <span className="text-xl font-bold">{postCount}</span>
                  <span className="text-xs text-muted-foreground">Posts</span>
                </button>
                <button className="flex flex-col items-center hover:opacity-70 transition-opacity">
                  <span className="text-xl font-bold">
                    {statsLoading ? '–' : stats.followers.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">Followers</span>
                </button>
                <button className="flex flex-col items-center hover:opacity-70 transition-opacity">
                  <span className="text-xl font-bold">
                    {statsLoading ? '–' : stats.following.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">Following</span>
                </button>
              </div>
            </div>

            {/* Name & Bio */}
            <div className="mb-4">
              <h2 className="font-bold text-base flex items-center gap-2">
                {profileData.display_name}
              </h2>
              
              {profileData.bio && (
                <p className="text-sm mt-1 whitespace-pre-wrap">{profileData.bio}</p>
              )}
              
              {/* Meta info */}
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                {profileData.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profileData.location}
                  </span>
                )}
                {profileData.website && (
                  <a
                    href={profileData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {profileData.website.replace(/^https?:\/\//, '').split('/')[0]}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {format(new Date(profileData.created_at), 'MMM yyyy')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-6">
              {isOwnProfile ? (
                <>
                  <Button variant="outline" className="flex-1 rounded-lg h-9" asChild>
                    <Link to="/settings">Edit profile</Link>
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-lg h-9">
                    Share profile
                  </Button>
                </>
              ) : user ? (
                <>
                  <FollowButton
                    targetUserId={profileData.user_id}
                    targetUsername={profileData.username}
                    isPrivateAccount={profileData.privacy === 'private'}
                    onFollowChange={handleFollowChange}
                    className="flex-1 rounded-lg h-9"
                  />
                  <Button variant="outline" className="flex-1 rounded-lg h-9" asChild>
                    <Link to={`/messages?new=${profileData.user_id}`}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-lg h-9 w-9">
                    <Share className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button className="flex-1 btn-gradient rounded-lg h-9" asChild>
                  <Link to="/auth">Follow</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-transparent border-t border-border h-12 rounded-none p-0">
              <TabsTrigger
                value="posts"
                className="rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent h-full"
              >
                <Grid3X3 className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent h-full"
              >
                <Bookmark className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger
                value="liked"
                className="rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent h-full"
              >
                <Heart className="h-5 w-5" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-0">
              <Feed userId={profileData.user_id} refreshTrigger={refreshKey} />
            </TabsContent>

            <TabsContent value="saved" className="mt-0">
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-20 h-20 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
                  <Bookmark className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-1">Saved</h3>
                <p className="text-muted-foreground text-center text-sm">
                  {isOwnProfile 
                    ? "Save photos and videos that you want to see again."
                    : "No saved posts to show."
                  }
                </p>
              </div>
            </TabsContent>

            <TabsContent value="liked" className="mt-0">
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-20 h-20 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
                  <Heart className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-1">Liked</h3>
                <p className="text-muted-foreground text-center text-sm">
                  {isOwnProfile 
                    ? "Posts you've liked will appear here."
                    : "No liked posts to show."
                  }
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
