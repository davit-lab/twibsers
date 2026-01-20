import { Link } from 'react-router-dom';
import { Conversation } from '@/hooks/useConversations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BadgeCheck, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="font-medium text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start a conversation from someone's profile
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {conversations.map((conv) => {
        const otherUser = conv.participants[0]?.profiles;
        if (!otherUser) return null;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
              'hover:bg-accent/50',
              selectedId === conv.id && 'bg-accent'
            )}
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                  {getInitials(otherUser.display_name)}
                </AvatarFallback>
              </Avatar>
              {conv.unread_count > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {conv.unread_count}
                </Badge>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-medium truncate">{otherUser.display_name}</span>
                {otherUser.is_verified && (
                  <BadgeCheck className="h-4 w-4 text-verified flex-shrink-0" />
                )}
              </div>
              {conv.last_message && (
                <p className="text-sm text-muted-foreground truncate">
                  {conv.last_message.content}
                </p>
              )}
            </div>

            {conv.last_message && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
