import { Conversation } from '@/hooks/useConversations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BadgeCheck, MessageSquare, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId?: string;
  onSelect: (conversationId: string) => void;
}

export default function ConversationList({
  conversations,
  loading,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.participants[0]?.profiles;
    if (!otherUser) return false;
    return otherUser.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherUser.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full rounded-full" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 rounded-full bg-muted/30 border-border/50 focus:bg-background input-focus h-12"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
              <MessageSquare className="h-10 w-10 text-primary/50" />
            </div>
            <p className="font-display font-semibold text-lg text-foreground mb-2">No conversations yet</p>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Start a conversation from someone's profile to begin chatting
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.map((conv, index) => {
              const otherUser = conv.participants[0]?.profiles;
              if (!otherUser) return null;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    'conversation-item w-full flex items-center gap-3 p-3 text-left',
                    selectedId === conv.id && 'active'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-offset-background ring-primary/10">
                      <AvatarImage src={otherUser.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-medium">
                        {getInitials(otherUser.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-online rounded-full border-2 border-background shadow-[0_0_8px_hsl(160_70%_45%/0.5)]" />
                    {conv.unread_count > 0 && (
                      <Badge
                        className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-[10px] bg-gradient-to-r from-primary to-accent border-0 shadow-glow-sm"
                      >
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-semibold truncate text-[15px]">{otherUser.display_name}</span>
                      {otherUser.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-verified flex-shrink-0" />
                      )}
                    </div>
                    {conv.last_message && (
                      <p className={cn(
                        "text-sm truncate",
                        conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {conv.last_message.content}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {conv.last_message && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
