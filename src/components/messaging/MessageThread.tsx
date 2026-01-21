import { useState, useEffect, useRef } from 'react';
import { useMessages, Message } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Send, 
  Loader2, 
  ArrowLeft, 
  Check, 
  CheckCheck, 
  Maximize2, 
  Minimize2,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  X
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import CallOverlay from './CallOverlay';

interface MessageThreadProps {
  conversationId: string;
  otherUser: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  otherUserId: string;
  onBack?: () => void;
  lastReadAt?: string | null;
}

export default function MessageThread({
  conversationId,
  otherUser,
  otherUserId,
  onBack,
  lastReadAt,
}: MessageThreadProps) {
  const { user } = useAuth();
  const { messages, loading, typingUsers, sendMessage, handleTyping, markAsRead } = useMessages(conversationId);
  const { callState, startCall, endCall, toggleAudio, toggleVideo } = useWebRTC(conversationId, otherUserId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isExtended, setIsExtended] = useState(false);
  const [activeCallType, setActiveCallType] = useState<'audio' | 'video' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  useEffect(() => {
    markAsRead();
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(newMessage);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    }
    return format(date, 'MMM d, HH:mm');
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    
    messages.forEach((message) => {
      const date = new Date(message.created_at);
      let dateLabel: string;
      
      if (isToday(date)) {
        dateLabel = 'Today';
      } else if (isYesterday(date)) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = format(date, 'MMMM d, yyyy');
      }

      const lastGroup = groups[groups.length - 1];
      if (lastGroup?.date === dateLabel) {
        lastGroup.messages.push(message);
      } else {
        groups.push({ date: dateLabel, messages: [message] });
      }
    });

    return groups;
  };

  const isMessageRead = (message: Message) => {
    if (message.sender_id !== user?.id) return false;
    if (!lastReadAt) return false;
    return new Date(message.created_at) <= new Date(lastReadAt);
  };

  const handleStartCall = async (type: 'audio' | 'video') => {
    setActiveCallType(type);
    await startCall(type);
  };

  const handleEndCall = async () => {
    await endCall();
    setActiveCallType(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full glass-premium">
        <div className="p-4 border-b border-border/30 flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn('flex gap-2', i % 2 === 0 && 'justify-end')}>
              <Skeleton className="h-16 w-48 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <>
      {activeCallType && (
        <CallOverlay 
          type={activeCallType} 
          user={otherUser} 
          callState={callState}
          onEnd={handleEndCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
        />
      )}
      
      <div className={cn(
        "flex flex-col h-full transition-all duration-400",
        isExtended && "fixed inset-0 z-50"
      )}>
        {/* Glass background */}
        <div className={cn(
          "absolute inset-0 -z-10",
          isExtended ? "bg-background" : "glass-premium"
        )} />

        {/* Header */}
        <div className="relative p-4 border-b border-border/30 flex items-center gap-3">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          
          {onBack && !isExtended && (
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
              <AvatarImage src={otherUser.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-medium">
                {getInitials(otherUser.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-online rounded-full border-2 border-background" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-lg truncate">{otherUser.display_name}</h3>
            <p className="text-sm text-muted-foreground">Active now</p>
          </div>

          {/* Call buttons */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => handleStartCall('audio')}
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => handleStartCall('video')}
            >
              <Video className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsExtended(!isExtended)}
              className="rounded-full hover:bg-primary/10 transition-colors"
            >
              {isExtended ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messageGroups.map((group) => (
            <div key={group.date} className="animate-fade-in">
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="text-xs text-muted-foreground font-medium px-3 py-1 rounded-full bg-muted/50">
                  {group.date}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
              </div>

              <div className="space-y-3">
                {group.messages.map((message, idx) => {
                  const isOwn = message.sender_id === user?.id;
                  const showAvatar =
                    !isOwn &&
                    (idx === 0 || group.messages[idx - 1].sender_id !== message.sender_id);

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-2 animate-fade-in',
                        isOwn && 'justify-end'
                      )}
                    >
                      {!isOwn && (
                        <div className="w-8 flex-shrink-0">
                          {showAvatar && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={otherUser.avatar_url || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-accent/80 text-white text-xs">
                                {getInitials(otherUser.display_name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[70%] px-4 py-3 rounded-2xl transition-all',
                          isOwn
                            ? 'message-own text-white rounded-br-md'
                            : 'message-other rounded-bl-md'
                        )}
                      >
                        <p className="break-words text-[15px] leading-relaxed">{message.content}</p>
                        <div className={cn(
                          'flex items-center gap-1.5 mt-1.5',
                          isOwn ? 'justify-end' : 'justify-start'
                        )}>
                          <span className={cn(
                            'text-[11px]',
                            isOwn ? 'text-white/70' : 'text-muted-foreground'
                          )}>
                            {formatMessageTime(message.created_at)}
                          </span>
                          {isOwn && (
                            isMessageRead(message) ? (
                              <CheckCheck className="h-3.5 w-3.5 text-white/70" />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-white/70" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-3 text-muted-foreground animate-fade-in">
              <Avatar className="h-8 w-8">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-accent/80 text-white text-xs">
                  {getInitials(otherUser.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="message-other px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex space-x-1.5">
                  <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="relative p-4 border-t border-border/30">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
          
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="rounded-full flex-shrink-0 hover:bg-primary/10 transition-colors"
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
            
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                disabled={sending}
                className="pr-12 rounded-full border-border/50 bg-muted/30 focus:bg-background input-focus h-12 text-[15px]"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-8 w-8"
              >
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>

            {newMessage.trim() ? (
              <Button 
                type="submit" 
                disabled={sending} 
                size="icon"
                className="btn-gradient rounded-full h-12 w-12 flex-shrink-0"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                className="rounded-full h-12 w-12 flex-shrink-0 hover:bg-primary/10 transition-colors"
              >
                <Mic className="h-5 w-5 text-muted-foreground" />
              </Button>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
