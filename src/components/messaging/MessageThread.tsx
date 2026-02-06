import { useState, useEffect, useRef, useCallback } from 'react';
import { useMessages, Message } from '@/hooks/useMessages';
import { useMessageReactions } from '@/hooks/useMessageReactions';
import { useCallBlocks } from '@/hooks/useCallBlocks';
import { useAuth } from '@/contexts/AuthContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Mic,
  PhoneOff,
  User,
  Paperclip,
  Image as ImageIcon,
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
  const { blockUser, unblockUser, isUserBlocked } = useCallBlocks();
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
  const [isBlocked, setIsBlocked] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    const checkCallPermission = async () => {
      if (!user || !otherUserId) return;
      const blocked = isUserBlocked(otherUserId);
      setIsBlocked(blocked);

      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('privacy')
        .eq('user_id', otherUserId)
        .single();

      if (otherProfile?.privacy === 'public') {
        setCanCall(true);
        setCallBlockReason(null);
        return;
      }

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
      setCallBlockReason(isMutualFollow ? null : 'Mutual follow required');
    };

    checkCallPermission();
  }, [user, otherUserId, isUserBlocked]);

  const handleToggleBlock = async () => {
    if (isBlocked) {
      await unblockUser(otherUserId);
      setIsBlocked(false);
    } else {
      await blockUser(otherUserId);
      setIsBlocked(true);
    }
  };

  const activeCallType = callState.session?.call_type || null;
  const isInCall = callState.session && callState.session.status !== 'ended' && callState.session.status !== 'declined';

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

  useEffect(() => {
    if (pendingAnswerCall && pendingAnswerCall.conversation_id === conversationId) {
      const handleAnswer = async () => {
        try {
          await answerCall(pendingAnswerCall);
        } catch (error) {
          console.error('Failed to answer call:', error);
        }
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
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
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
      <div className="flex flex-col h-full bg-background">
        <div className="h-[70px] px-6 flex items-center gap-4 border-b border-border/50 bg-card/65 backdrop-blur-xl">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn('flex gap-2', i % 2 === 0 && 'justify-end')}>
              <Skeleton className="h-12 w-40 rounded-2xl" />
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
          onEnd={endCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={toggleScreenShare}
          onRetry={retryCall}
        />
      )}
      
      <div className={cn(
        "flex flex-col h-full bg-background relative",
        isExtended && "fixed inset-0 z-50"
      )}>
        {/* Header - Orbis style */}
        <div className="h-[70px] px-6 flex items-center gap-4 border-b border-border/50 bg-card/65 backdrop-blur-xl flex-shrink-0 z-10">
          {onBack && !isExtended && (
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden h-9 w-9 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="relative">
            <Avatar className="h-10 w-10 rounded-xl">
              <AvatarImage src={otherUser.avatar_url || undefined} />
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-accent text-white text-sm font-bold">
                {getInitials(otherUser.display_name)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{otherUser.display_name}</h3>
            <span className="text-xs text-success flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Online now
            </span>
          </div>

          <div className="flex items-center gap-1">
            {canCall ? (
              <>
                <button className="icon-btn" onClick={() => startCall('audio')}>
                  <Phone className="h-4 w-4" />
                </button>
                <button className="icon-btn" onClick={() => startCall('video')}>
                  <Video className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 opacity-50">
                    <button className="icon-btn" disabled>
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="icon-btn" disabled>
                      <Video className="h-4 w-4" />
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{callBlockReason}</p>
                </TooltipContent>
              </Tooltip>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="icon-btn">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => window.open(`/profile/${otherUser.username}`, '_blank')}>
                  <User className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsExtended(!isExtended)}>
                  {isExtended ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
                  {isExtended ? 'Exit Fullscreen' : 'Fullscreen'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggleBlock} className={isBlocked ? "text-success" : "text-destructive"}>
                  {isBlocked ? (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Unblock Calls
                    </>
                  ) : (
                    <>
                      <PhoneOff className="h-4 w-4 mr-2" />
                      Block Calls
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-1 scrollbar-thin">
          {messageGroups.map((group) => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground">{group.date}</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              <div className="space-y-1">
                {group.messages.map((message, idx) => {
                  const isOwn = message.sender_id === user?.id;
                  const showAvatar = !isOwn && (idx === 0 || group.messages[idx - 1].sender_id !== message.sender_id);
                  const messageReactions = getReactionsForMessage(message.id);

                  return (
                    <div key={message.id} className={cn('flex gap-2', isOwn && 'justify-end')}>
                      {!isOwn && (
                        <div className="w-8 flex-shrink-0">
                          {showAvatar && (
                            <Avatar className="h-8 w-8 rounded-xl">
                              <AvatarImage src={otherUser.avatar_url || undefined} />
                              <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-accent text-white text-xs font-bold">
                                {getInitials(otherUser.display_name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      <div className="relative max-w-[70%]">
                        {selectedMessageId === message.id && (
                          <MessageReactionPicker
                            onSelect={handleReactionSelect}
                            onClose={() => setSelectedMessageId(null)}
                            position={reactionPickerPosition}
                          />
                        )}
                        
                        <div
                          className={cn(
                            'cursor-pointer select-none',
                            isGifUrl(message.content) ? 'p-1' : 'px-4 py-2.5',
                            isOwn ? 'message-own' : 'message-other',
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
                            <p className="break-words text-sm leading-relaxed">{message.content}</p>
                          )}
                          <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
                            <span className={cn('text-[10px]', isOwn ? 'text-white/70' : 'text-muted-foreground')}>
                              {formatMessageTime(message.created_at)}
                            </span>
                            {isOwn && (
                              isMessageRead(message) ? (
                                <CheckCheck className="h-3 w-3 text-white/70" />
                              ) : (
                                <Check className="h-3 w-3 text-white/70" />
                              )
                            )}
                          </div>
                        </div>
                        
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
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 rounded-xl">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-accent text-white text-xs font-bold">
                  {getInitials(otherUser.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="typing-bubble">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick emoji bar */}
        <div className="flex gap-1 px-6 flex-wrap">
          {['👍', '❤️', '😂', '🔥', '✨', '🎨', '💜', '🙌'].map((emoji) => (
            <button key={emoji} className="emoji-chip" onClick={() => handleEmojiSelect(emoji)}>
              {emoji}
            </button>
          ))}
        </div>

        {/* Input area - Orbis style */}
        <div className="p-4 border-t border-border/50 bg-card/55 backdrop-blur-xl flex-shrink-0">
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div className="flex gap-1">
              <button type="button" className="icon-btn h-11 w-11">
                <Paperclip className="w-4 h-4" />
              </button>
              <button 
                type="button" 
                className="icon-btn h-11 w-11"
                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>
            
            <div className="orbis-input-wrap h-11 flex-1">
              <input
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button 
                type="button" 
                className="icon-btn h-8 w-8"
                onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button type="button" className="icon-btn h-8 w-8">
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <button 
              type="submit" 
              disabled={!newMessage.trim() || sending} 
              className="send-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>

          {showEmojiPicker && (
            <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
          )}
          {showGifPicker && (
            <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
          )}
        </div>
      </div>
    </>
  );
}
