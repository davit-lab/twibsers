import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import Feed from '@/components/feed/Feed';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BadgeCheck,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Settings,
  UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isOwnProfile = currentUserProfile?.username === username;

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
        .single();

      if (fetchError) {
        setError('Profile not found');
      } else {
        setProfileData(data as ProfileData);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [username]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-0 px-0">
          {/* Cover skeleton */}
          <Skeleton className="h-48 md:h-64 w-full" />
          
          <div className="px-4 pb-8">
            {/* Avatar and info skeleton */}
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20">
              <Skeleton className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-background" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
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
        <div className="container max-w-4xl py-8 px-4 text-center">
          <h1 className="text-2xl font-display font-bold mb-2">Profile not found</h1>
          <p className="text-muted-foreground mb-4">
            The user you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl py-0 px-0 pb-24 lg:pb-8">
        {/* Cover Image */}
        <div className="h-48 md:h-64 bg-gradient-to-br from-primary via-primary/80 to-accent relative">
          {profileData.cover_url && (
            <img
              src={profileData.cover_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
        </div>

        <div className="px-4">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20 relative z-10">
            {/* Avatar */}
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-xl">
              <AvatarImage src={profileData.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-3xl md:text-4xl">
                {getInitials(profileData.display_name)}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-display font-bold">
                  {profileData.display_name}
                </h1>
                {profileData.is_verified && (
                  <BadgeCheck className="h-6 w-6 text-verified" />
                )}
              </div>
              <p className="text-muted-foreground">@{profileData.username}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pb-2">
              {isOwnProfile ? (
                <Button variant="outline" asChild>
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              ) : user ? (
                <>
                  <Button className="btn-gradient">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow
                  </Button>
                  <Button variant="outline">Message</Button>
                </>
              ) : (
                <Button className="btn-gradient" asChild>
                  <Link to="/auth">Follow</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Bio & Meta */}
          <div className="mt-6 space-y-4">
            {profileData.bio && (
              <p className="text-foreground max-w-2xl">{profileData.bio}</p>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {profileData.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
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
                  <LinkIcon className="h-4 w-4" />
                  {profileData.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined {format(new Date(profileData.created_at), 'MMMM yyyy')}
              </span>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <button className="hover:underline">
                <span className="font-bold">0</span>{' '}
                <span className="text-muted-foreground">Following</span>
              </button>
              <button className="hover:underline">
                <span className="font-bold">0</span>{' '}
                <span className="text-muted-foreground">Followers</span>
              </button>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="posts" className="mt-8">
            <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto">
              <TabsTrigger
                value="posts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Posts
              </TabsTrigger>
              <TabsTrigger
                value="replies"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Replies
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Media
              </TabsTrigger>
              <TabsTrigger
                value="starred"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Starred
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-6">
              <Feed userId={profileData.user_id} />
            </TabsContent>

            <TabsContent value="replies" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <p>No replies yet</p>
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <p>No media yet</p>
              </div>
            </TabsContent>

            <TabsContent value="starred" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <p>No starred posts yet</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}