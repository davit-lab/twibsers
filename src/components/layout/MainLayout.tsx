import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserBan } from '@/hooks/useUserBan';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import CreateDialog from '@/components/create/CreateDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Search,
  Compass,
  Clapperboard,
  MessageCircle,
  Heart,
  PlusSquare,
  User,
  Settings,
  LogOut,
  Shield,
  Menu,
  BookOpen,
  Ban,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

interface MainLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: Home, label: 'Home', href: '/', id: 'home' },
  { icon: Compass, label: 'Explore', href: '/explore', id: 'explore' },
  { icon: Clapperboard, label: 'Reels', href: '/reels', id: 'reels' },
  { icon: MessageCircle, label: 'Messages', href: '/messages', id: 'messages' },
  { icon: Heart, label: 'Notifications', href: '/notifications', id: 'notifications' },
  { icon: PlusSquare, label: 'Create', href: '#create', id: 'create' },
  { icon: BookOpen, label: 'Library', href: '/library', id: 'library' },
];

const mobileNavItems = [
  { icon: Home, label: 'Home', href: '/', id: 'home' },
  { icon: Compass, label: 'Explore', href: '/explore', id: 'explore' },
  { icon: PlusSquare, label: 'Create', href: '#create', id: 'create' },
  { icon: Clapperboard, label: 'Reels', href: '/reels', id: 'reels' },
  { icon: User, label: 'Profile', href: '/profile', id: 'profile' },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, profile, signOut, isAdmin, isModerator } = useAuth();
  const { isBanned, banInfo } = useUserBan();
  const location = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleNavClick = (href: string) => {
    if (href === '#create') {
      setCreateDialogOpen(true);
    }
  };

  const isActive = (href: string) => {
    if (href === '#create') return false;
    if (href === '/profile' && location.pathname.startsWith('/profile/')) return true;
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - Instagram style */}
      {user && (
        <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-[220px] xl:w-[245px] border-r border-border px-3 py-6">
          {/* Logo */}
          <Link to="/" className="px-3 mb-8">
            <span className="font-semibold text-xl">Twibsers</span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const isCreate = item.href === '#create';
              
              if (isCreate) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setCreateDialogOpen(true)}
                    className={cn(
                      'flex items-center gap-4 w-full px-3 py-3 rounded-lg text-[15px] transition-colors',
                      'hover:bg-secondary text-foreground'
                    )}
                  >
                    <item.icon className="h-6 w-6" strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-4 px-3 py-3 rounded-lg text-[15px] transition-colors',
                    active
                      ? 'font-semibold'
                      : 'text-foreground hover:bg-secondary'
                  )}
                >
                  <item.icon 
                    className="h-6 w-6" 
                    strokeWidth={active ? 2.5 : 1.5}
                    fill={active ? 'currentColor' : 'none'}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-4 w-full px-3 py-3 rounded-lg text-[15px] transition-colors hover:bg-secondary">
                <Menu className="h-6 w-6" strokeWidth={1.5} />
                <span>More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]" align="start" side="top">
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              {(isAdmin || isModerator) && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer">
                    <Shield className="mr-3 h-4 w-4" />
                    Admin
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                <LogOut className="mr-3 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <Link
            to={`/profile/${profile?.username}`}
            className="flex items-center gap-3 px-3 py-3 mt-2 rounded-lg transition-colors hover:bg-secondary"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] bg-muted">
                {getInitials(profile?.display_name || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.username}</p>
            </div>
          </Link>
        </aside>
      )}

      {/* Mobile Header */}
      {user && (
        <header className="lg:hidden sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center justify-between h-12 px-4">
            <Link to="/" className="font-semibold text-lg">
              Twibsers
            </Link>
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <Link to="/messages">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MessageCircle className="h-6 w-6" strokeWidth={1.5} />
                </Button>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Guest Header */}
      {!user && (
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center justify-between h-14 px-4 max-w-screen-lg mx-auto">
            <Link to="/" className="font-semibold text-xl">
              Twibsers
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth?mode=signup">Sign up</Link>
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={cn(
        'min-h-screen',
        user && 'lg:ml-[220px] xl:ml-[245px]'
      )}>
        {isBanned && banInfo ? (
          <div className="max-w-md mx-auto py-20 px-4">
            <Card className="border-destructive/30">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <Ban className="w-7 h-7 text-destructive" />
                </div>
                <CardTitle>Account Suspended</CardTitle>
                <CardDescription>
                  Your account has been suspended.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-sm font-medium mb-1">Reason</p>
                  <p className="text-sm text-muted-foreground">{banInfo.reason}</p>
                </div>
                {banInfo.expires_at && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Until {format(new Date(banInfo.expires_at), 'PPp')}</span>
                  </div>
                )}
                <Button variant="outline" onClick={signOut} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
          <div className="flex items-center justify-around h-12">
            {mobileNavItems.map((item) => {
              const active = isActive(item.href);
              const isCreate = item.href === '#create';
              const isProfile = item.href === '/profile';

              if (isCreate) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setCreateDialogOpen(true)}
                    className="flex items-center justify-center p-2"
                  >
                    <item.icon className="h-6 w-6" strokeWidth={1.5} />
                  </button>
                );
              }

              if (isProfile) {
                return (
                  <Link
                    key={item.id}
                    to={`/profile/${profile?.username}`}
                    className="flex items-center justify-center p-2"
                  >
                    <Avatar className={cn(
                      "h-6 w-6",
                      active && "ring-2 ring-foreground"
                    )}>
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-[8px] bg-muted">
                        {getInitials(profile?.display_name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className="flex items-center justify-center p-2"
                >
                  <item.icon 
                    className="h-6 w-6" 
                    strokeWidth={active ? 2.5 : 1.5}
                    fill={active ? 'currentColor' : 'none'}
                  />
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <CreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
