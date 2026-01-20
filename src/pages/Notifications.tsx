import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import MainLayout from '@/components/layout/MainLayout';
import NotificationItem from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck, Trash2, UserPlus, Star, MessageCircle, AtSign } from 'lucide-react';
import { NotificationType } from '@/hooks/useNotifications';

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return null;
  }

  const filterNotifications = (types: NotificationType[]) => {
    return notifications.filter(n => types.includes(n.type));
  };

  const socialNotifs = filterNotifications(['follow', 'follow_request', 'follow_accepted']);
  const activityNotifs = filterNotifications(['star', 'mention', 'comment']);
  const messageNotifs = filterNotifications(['message']);

  return (
    <MainLayout>
      <div className="container max-w-2xl py-6 px-4 pb-24 lg:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold mb-1">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" className="gap-2" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="all" className="gap-2">
              <Bell className="h-4 w-4" />
              All
              {unreadCount > 0 && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Social
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Star className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <NotificationList
              notifications={notifications}
              loading={loading}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              emptyMessage="No notifications yet"
            />
          </TabsContent>

          <TabsContent value="social">
            <NotificationList
              notifications={socialNotifs}
              loading={loading}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              emptyMessage="No social notifications"
              emptyIcon={UserPlus}
            />
          </TabsContent>

          <TabsContent value="activity">
            <NotificationList
              notifications={activityNotifs}
              loading={loading}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              emptyMessage="No activity notifications"
              emptyIcon={Star}
            />
          </TabsContent>

          <TabsContent value="messages">
            <NotificationList
              notifications={messageNotifs}
              loading={loading}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              emptyMessage="No message notifications"
              emptyIcon={MessageCircle}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

interface NotificationListProps {
  notifications: any[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  emptyMessage: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
}

function NotificationList({
  notifications,
  loading,
  onMarkAsRead,
  onDelete,
  emptyMessage,
  emptyIcon: EmptyIcon = Bell,
}: NotificationListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <EmptyIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-2">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onDelete={onDelete}
          />
        ))}
      </CardContent>
    </Card>
  );
}
