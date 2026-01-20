import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import FollowButton from '@/components/social/FollowButton';
import FollowRequests from '@/components/social/FollowRequests';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BadgeCheck, Search, Users } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  privacy: 'public' | 'private';
}

export default function Explore() {
  const { user, profile: currentUserProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('id, user_id, username, display_name, bio, avatar_url, is_verified, privacy')
        .order('created_at', { ascending: false })
        .limit(20);

      if (searchQuery.trim()) {
        query = query.or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`);
      }

      // Exclude current user
      if (user) {
        query = query.neq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data as UserProfile[]);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user, refreshKey]);

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <MainLayout>
      <div className="container max-w-2xl py-6 px-4 pb-24 lg:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold mb-1">Explore</h1>
          <p className="text-muted-foreground">Discover new people to follow</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Follow Requests (for private accounts) */}
        {currentUserProfile?.privacy === 'private' && (
          <div className="mb-6">
            <FollowRequests onRequestHandled={() => setRefreshKey(prev => prev + 1)} />
          </div>
        )}

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              {searchQuery ? 'Search Results' : 'Suggested Users'}
            </CardTitle>
            <CardDescription>
              {searchQuery ? `Results for "${searchQuery}"` : 'People you might want to follow'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No users found</p>
                {searchQuery && <p className="text-sm mt-1">Try a different search term</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((userProfile) => (
                  <div key={userProfile.id} className="flex items-center gap-3">
                    <Link to={`/profile/${userProfile.username}`}>
                      <Avatar className="h-12 w-12 hover:opacity-90 transition-opacity">
                        <AvatarImage src={userProfile.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                          {getInitials(userProfile.display_name)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/profile/${userProfile.username}`}
                        className="font-medium hover:underline flex items-center gap-1"
                      >
                        {userProfile.display_name}
                        {userProfile.is_verified && (
                          <BadgeCheck className="h-4 w-4 text-verified" />
                        )}
                      </Link>
                      <p className="text-sm text-muted-foreground truncate">
                        @{userProfile.username}
                      </p>
                      {userProfile.bio && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {userProfile.bio}
                        </p>
                      )}
                    </div>

                    <FollowButton
                      targetUserId={userProfile.user_id}
                      targetUsername={userProfile.username}
                      isPrivateAccount={userProfile.privacy === 'private'}
                      onFollowChange={() => setRefreshKey(prev => prev + 1)}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}