import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Heart, BadgeCheck } from 'lucide-react';

interface Liker {
  user_id: string;
  created_at: string;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

interface ReelLikersModalProps {
  reelId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReelLikersModal({ reelId, open, onOpenChange }: ReelLikersModalProps) {
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reelId || !open) return;

    const fetchLikers = async () => {
      setLoading(true);
      try {
        const { data: likesData, error: likesError } = await supabase
          .from('reel_likes')
          .select('user_id, created_at')
          .eq('reel_id', reelId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (likesError) throw likesError;

        if (!likesData || likesData.length === 0) {
          setLikers([]);
          setLoading(false);
          return;
        }

        // Fetch profiles
        const userIds = likesData.map(l => l.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url, is_verified')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        const enrichedLikers = likesData.map(like => ({
          ...like,
          profile: profileMap.get(like.user_id),
        }));

        setLikers(enrichedLikers);
      } catch (error) {
        console.error('Error fetching likers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikers();
  }, [reelId, open]);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[70vh] rounded-t-3xl bg-black/95 backdrop-blur-xl border-white/10"
      >
        <SheetHeader className="pb-4 border-b border-white/10">
          <SheetTitle className="flex items-center justify-center gap-2 text-white">
            <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
            Likes
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-60px)] mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            </div>
          ) : likers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <Heart className="h-8 w-8 text-white/40" />
              </div>
              <p className="text-white/60">No likes yet</p>
              <p className="text-white/40 text-sm mt-1">Be the first to like this reel!</p>
            </div>
          ) : (
            <div className="space-y-1 px-1">
              {likers.map((liker) => (
                <Link
                  key={liker.user_id}
                  to={`/profile/${liker.profile?.username}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Avatar className="h-12 w-12 ring-2 ring-white/10">
                    <AvatarImage 
                      src={liker.profile?.avatar_url || undefined} 
                      className="object-cover" 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                      {getInitials(liker.profile?.display_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-semibold text-sm truncate">
                        {liker.profile?.display_name || 'Unknown'}
                      </span>
                      {liker.profile?.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-primary fill-primary/20 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-white/50 text-sm">
                      @{liker.profile?.username || 'unknown'}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full bg-white/10 hover:bg-white/20 text-white border-0 h-8 px-4"
                  >
                    View
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
