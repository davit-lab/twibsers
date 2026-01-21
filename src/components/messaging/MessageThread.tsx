import { useState, useEffect, useRef, useCallback } from 'react';
import { useMessages, Message } from '@/hooks/useMessages';
import { useMessageReactions } from '@/hooks/useMessageReactions';
import { useAuth } from '@/contexts/AuthContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  X,
  Image as ImageIcon,
  Lock
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import CallOverlay from './CallOverlay';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import MessageReactionPicker from './MessageReactionPicker';
import MessageReactions from './MessageReactions';

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
  pendingAnswerCall?: any;
  onCallAnswered?: () => void;
}

export default function MessageThread({
  conversationId,
  otherUser,
  otherUserId,
  onBack,
  lastReadAt,
  pendingAnswerCall,
  onCallAnswered,
}: MessageThreadProps) {
  const { user } = useAuth();
  const { messages, loading, typingUsers, sendMessage, handleTyping, markAsRead } = useMessages(conversationId);
  const { toggleReaction, getReactionsForMessage } = useMessageReactions(conversationId);
  const { callState, startCall, answerCall, endCall, toggleAudio, toggleVideo, toggleScreenShare, retryCall } = useWebRTC(conversationId, otherUserId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isExtended, setIsExtended] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [reactionPickerPosition, setReactionPickerPosition] = useState<'left' | 'right'>('left');
  const [canCall, setCanCall] = useState(true);
  const [callBlockReason, setCallBlockReason] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  // Check if calling is allowed (mutual follow for private accounts)
  useEffect(() => {
    const checkCallPermission = async () => {
      if (!user || !otherUserId) return;

      // Check other user's privacy setting
      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('privacy')
        .eq('user_id', otherUserId)
        .single();

      // If public account, allow calling
      if (otherProfile?.privacy === 'public') {
        setCanCall(true);
        setCallBlockReason(null);
        return;
      }

      // For private accounts, check mutual follow
      const [meFollowingThem, themFollowingMe] = await Promise.all([
        supabase
          .from('follows')
          .select('status')
          .eq('follower_id', user.id)
          .eq('following_id', otherUserId)
          .eq('status', 'accepted')
          .maybeSingle(),
        supabase
          .from('follows')
          .select('status')
          .eq('follower_id', otherUserId)
          .eq('following_id', user.id)
          .eq('status', 'accepted')
          .maybeSingle(),
      ]);

      const isMutualFollow = !!meFollowingThem.data && !!themFollowingMe.data;
      setCanCall(isMutualFollow);
      setCallBlockReason(isMutualFollow ? null : 'Mutual follow required for private accounts');
    };

    checkCallPermission();
  }, [user, otherUserId]);

  // Derive active call type from callState session
  const activeCallType = callState.session?.call_type || null;
  const isInCall = callState.session && callState.session.status !== 'ended' && callState.session.status !== 'declined';

  // Helper to detect if content is a GIF URL
  const isGifUrl = (content: string) => {
    const trimmed = content.trim();
    return (
      trimmed.match(/^https?:\/\/.*\.(gif)(\?.*)?$/i) ||
      trimmed.includes('giphy.com') ||
      trimmed.includes('tenor.com')
    );
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleGifSelect = async (gifUrl: string) => {
    setShowGifPicker(false);
    setSending(true);
    try {
      await sendMessage(gifUrl);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  useEffect(() => {
    markAsRead();
  }, [conversationId]);

  // Handle pending incoming call answer
  useEffect(() => {
    if (pendingAnswerCall && pendingAnswerCall.conversation_id === conversationId) {
      // Answer the call asynchronously and notify parent after completion
      const handleAnswer = async () => {
        try {
          console.log('[MessageThread] Answering pending call:', pendingAnswerCall.id);
          await answerCall(pendingAnswerCall);
          console.log('[MessageThread] Call answered successfully');
        } catch (error) {
          console.error('[MessageThread] Failed to answer call:', error);
        }
        // Only notify parent after the answer process completes
        onCallAnswered?.();
      };
      handleAnswer();
    }
  }, [pendingAnswerCall, conversationId]);

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
    await startCall(type);
  };

  const handleEndCall = async () => {
    await endCall();
  };

  // Long press handlers for reactions
  const handleLongPressStart = useCallback((messageId: string, isOwn: boolean) => {
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setSelectedMessageId(messageId);
      setReactionPickerPosition(isOwn ? 'right' : 'left');
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleReactionSelect = async (emoji: string) => {
    if (selectedMessageId) {
      await toggleReaction(selectedMessageId, emoji);
      setSelectedMessageId(null);
    }
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
      {isInCall && activeCallType && (
        <CallOverlay 
          type={activeCallType} 
          user={otherUser} 
          callState={callState}
          onEnd={handleEndCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={toggleScreenShare}
          onRetry={retryCall}
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
            {canCall ? (
              <>
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
              </>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <Video className="h-5 w-5" />
                    </Button>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{callBlockReason}</p>
                </TooltipContent>
              </Tooltip>
            )}
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
                  const messageReactions = getReactionsForMessage(message.id);

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
                      <div className="relative max-w-[70%]">
                        {/* Reaction picker */}
                        {selectedMessageId === message.id && (
                          <MessageReactionPicker
                            onSelect={handleReactionSelect}
                            onClose={() => setSelectedMessageId(null)}
                            position={reactionPickerPosition}
                          />
                        )}
                        
                        <div
                          className={cn(
                            'rounded-2xl transition-all cursor-pointer select-none',
                            isGifUrl(message.content) ? 'p-1' : 'px-4 py-3',
                            isOwn
                              ? 'message-own text-white rounded-br-md'
                              : 'message-other rounded-bl-md',
                            selectedMessageId === message.id && 'ring-2 ring-primary/50'
                          )}
                          onMouseDown={() => handleLongPressStart(message.id, isOwn)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onTouchStart={() => handleLongPressStart(message.id, isOwn)}
                          onTouchEnd={handleLongPressEnd}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setSelectedMessageId(message.id);
                            setReactionPickerPosition(isOwn ? 'right' : 'left');
                          }}
                        >
                          {isGifUrl(message.content) ? (
                            <img 
                              src={message.content.trim()} 
                              alt="GIF" 
                              className="max-w-full rounded-xl max-h-64 object-contain pointer-events-none"
                              loading="lazy"
                            />
                          ) : (
                            <p className="break-words text-[15px] leading-relaxed">{message.content}</p>
                          )}
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
                        
                        {/* Reactions display */}
                        <MessageReactions
                          reactions={messageReactions}
                          isOwn={isOwn}
                          onToggle={(emoji) => toggleReaction(message.id, emoji)}
                        />
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
                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-8 w-8"
              >
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>

            {/* GIF Button */}
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
              className="rounded-full flex-shrink-0 hover:bg-primary/10 transition-colors"
            >
              <span className="text-xs font-bold text-muted-foreground">GIF</span>
            </Button>

            {/* Pickers */}
            {showEmojiPicker && (
              <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
            )}
            {showGifPicker && (
              <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
            )}

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
