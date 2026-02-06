import { Conversation } from '@/hooks/useConversations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId?: string;
  onSelect: (conversationId: string) => void;
}

const TABS = ['All', 'Unread', 'Groups', 'Archived'] as const;

export default function ConversationList({
  conversations,
  loading,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.participants[0]?.profiles;
    if (!otherUser) return false;
    
    const matchesSearch = otherUser.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherUser.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'Unread') return matchesSearch && conv.unread_count > 0;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-card">
        <div className="panel-head">
          <Skeleton className="h-7 w-28" />
          <div className="flex gap-1">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </div>
        <div className="px-5 pb-3">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="px-5 pb-3 flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
        <div className="flex-1 px-3 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border/50">
      {/* Header */}
      <div className="panel-head">
        <h2>Messages</h2>
        <div className="flex gap-1">
          <button className="icon-btn">
            <Plus className="w-4 h-4" />
          </button>
          <button className="icon-btn">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="orbis-search"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn('orbis-tab whitespace-nowrap', activeTab === tab && 'active')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-semibold">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start a conversation from someone's profile
            </p>
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {filteredConversations.map((conv) => {
              const otherUser = conv.participants[0]?.profiles;
              if (!otherUser) return null;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    'contact-item w-full text-left',
                    selectedId === conv.id && 'active'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12 rounded-2xl">
                      <AvatarImage src={otherUser.avatar_url || undefined} />
                      <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary to-accent text-white text-sm font-bold">
                        {getInitials(otherUser.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <span className="avatar-online-dot" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={cn(
                        "truncate text-sm",
                        conv.unread_count > 0 ? "font-semibold" : "font-medium"
                      )}>
                        {otherUser.display_name}
                      </span>
                      {conv.last_message && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {conv.last_message && (
                        <p className={cn(
                          "text-sm truncate flex-1",
                          conv.unread_count > 0 ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {conv.last_message.content}
                        </p>
                      )}
                      {conv.unread_count > 0 && (
                        <span className="unread-badge">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      )}
                    </div>
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
