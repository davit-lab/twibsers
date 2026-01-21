import { Link } from 'react-router-dom';
import { Notification, NotificationType } from '@/hooks/useNotifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  UserPlus,
  UserCheck,
  Star,
  MessageCircle,
  AtSign,
  Bell,
  MessageSquare,
  X,
  PhoneMissed,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: () => void;
}

const iconMap: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  follow: UserPlus,
  follow_request: UserPlus,
  follow_accepted: UserCheck,
  star: Star,
  mention: AtSign,
  message: MessageCircle,
  comment: MessageSquare,
  system: Bell,
  missed_call: PhoneMissed,
};

const colorMap: Record<NotificationType, string> = {
  follow: 'text-blue-500 bg-blue-500/10',
  follow_request: 'text-orange-500 bg-orange-500/10',
  follow_accepted: 'text-green-500 bg-green-500/10',
  star: 'text-yellow-500 bg-yellow-500/10',
  mention: 'text-purple-500 bg-purple-500/10',
  message: 'text-primary bg-primary/10',
  comment: 'text-cyan-500 bg-cyan-500/10',
  system: 'text-muted-foreground bg-muted',
  missed_call: 'text-red-500 bg-red-500/10',
};

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const Icon = iconMap[notification.type] || Bell;
  const colorClass = colorMap[notification.type] || colorMap.system;

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const getLink = () => {
    switch (notification.target_type) {
      case 'profile':
        return notification.actor ? `/profile/${notification.actor.username}` : null;
      case 'post':
        return `/post/${notification.target_id}`;
      case 'conversation':
        return `/messages?conv=${notification.target_id}`;
      default:
        return null;
    }
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    onClick?.();
  };

  const link = getLink();
  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer group',
        notification.is_read
          ? 'bg-transparent hover:bg-muted/50'
          : 'bg-primary/5 hover:bg-primary/10'
      )}
      onClick={handleClick}
    >
      {/* Icon or Avatar */}
      <div className="relative flex-shrink-0">
        {notification.actor ? (
          <Avatar className="h-10 w-10">
            <AvatarImage src={notification.actor.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
              {getInitials(notification.actor.display_name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        
        {/* Type badge */}
        {notification.actor && (
          <div className={cn(
            'absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center',
            colorClass
          )}>
            <Icon className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm',
          !notification.is_read && 'font-medium'
        )}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Unread indicator & Delete */}
      <div className="flex items-center gap-2">
        {!notification.is_read && (
          <div className="h-2 w-2 rounded-full bg-primary" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(notification.id);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
}
