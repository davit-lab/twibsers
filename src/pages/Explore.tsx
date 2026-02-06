import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import FollowButton from '@/components/social/FollowButton';
import FollowRequests from '@/components/social/FollowRequests';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BadgeCheck, Search, Users, TrendingUp, Sparkles, X, UserPlus, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

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

type TabValue = 'discover' | 'friends';

function UserCard({ userProfile, onFollowChange }: { userProfile: UserProfile; onFollowChange: () => void }) {
  const { data: isPremium } = usePremiumStatus(userProfile.user_id);
  
  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };
  
  return (
    <div className="flex items-center gap-4 p-4 bg-card/50 hover:bg-card rounded-2xl border border-border/50 transition-all group">
      <Link to={`/profile/${userProfile.username}`} className="flex-shrink-0">
        <Avatar className="h-14 w-14 ring-2 ring-border/50 group-hover:ring-primary/30 transition-all">
          <AvatarImage src={userProfile.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
            {getInitials(userProfile.display_name)}
          </AvatarFallback>
        </Avatar>
      </Link>
      
      <div className="flex-1 min-w-0">
        <Link 
          to={`/profile/${userProfile.username}`}
          className="font-bold hover:text-primary transition-colors flex items-center gap-1.5"
        >
          {userProfile.display_name}
          {userProfile.is_verified && (
            <span className="verified-badge">
              <BadgeCheck className="h-3 w-3 text-white" />
            </span>
          )}
          {isPremium && (
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Crown className="h-2.5 w-2.5 text-white" />
            </span>
          )}
        </Link>
        <p className="text-sm text-muted-foreground">@{userProfile.username}</p>
        {userProfile.bio && (
          <p className="text-sm text-muted-foreground/80 truncate mt-1 max-w-[200px]">
            {userProfile.bio}
          </p>
        )}
      </div>

      <FollowButton
        targetUserId={userProfile.user_id}
        targetUsername={userProfile.username}
        isPrivateAccount={userProfile.privacy === 'private'}
        onFollowChange={onFollowChange}
      />
    </div>
  );
}

export default function Explore() {
  const { user, profile: currentUserProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabValue>('discover');

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

  const tabs = [
    { value: 'discover', label: 'Discover', icon: Sparkles },
    { value: 'friends', label: 'Find Friends', icon: Users },
  ];

  const renderUserList = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-card/50 rounded-2xl border border-border/50">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          ))}
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-xl mb-2">No users found</h3>
          {searchQuery && <p className="text-muted-foreground">Try a different search term</p>}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {users.map((userProfile) => (
          <UserCard key={userProfile.id} userProfile={userProfile} onFollowChange={() => setRefreshKey(prev => prev + 1)} />
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
          <div className="relative">
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight"><span className="text-primary">Explore</span></h1>
                <p className="text-muted-foreground">Discover new people and content</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as TabValue)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all",
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'discover' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-lg">Trending Creators</h2>
              </div>
              {renderUserList()}
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-12 h-14 text-base bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 rounded-2xl"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {currentUserProfile?.privacy === 'private' && (
                <FollowRequests onRequestHandled={() => setRefreshKey(prev => prev + 1)} />
              )}

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-bold text-lg">{searchQuery ? 'Search Results' : 'Suggested Friends'}</h2>
                </div>
                {renderUserList()}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
