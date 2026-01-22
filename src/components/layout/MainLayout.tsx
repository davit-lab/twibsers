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
  Crown,
  Plus,
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
  { icon: null, label: 'Create', href: '#create', id: 'create' }, // Center button placeholder
  { icon: Clapperboard, label: 'Reels', href: '/reels', id: 'reels' },
  { icon: Menu, label: 'More', href: '#more', id: 'more' },
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
      {/* Desktop Sidebar - Glassmorphism style */}
      {user && (
        <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-[220px] xl:w-[245px] glass-nav-solid border-r border-border/50 px-3 py-6 z-40">
          {/* Logo */}
          <Link to="/" className="px-3 mb-8 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl btn-center-action flex items-center justify-center">
              <span className="font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-xl gradient-text">Twibsers</span>
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
                      'flex items-center gap-4 w-full px-3 py-3 rounded-xl text-[15px] transition-all duration-200',
                      'hover:bg-primary/10 text-foreground nav-item-hover'
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
                    'flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] transition-all duration-200 nav-item-hover',
                    active
                      ? 'font-semibold bg-primary/10'
                      : 'text-foreground hover:bg-primary/10'
                  )}
                >
                  <item.icon 
                    className={cn("h-6 w-6 transition-transform", active && "text-primary")}
                    strokeWidth={active ? 2.5 : 1.5}
                    fill={active ? 'currentColor' : 'none'}
                  />
                  <span className={active ? 'text-primary' : ''}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-4 w-full px-3 py-3 rounded-xl text-[15px] transition-all duration-200 hover:bg-primary/10 nav-item-hover">
                <Menu className="h-6 w-6" strokeWidth={1.5} />
                <span>More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px] glass-nav border-border/50" align="start" side="top">
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
            className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl transition-all duration-200 hover:bg-primary/10 nav-item-hover"
          >
            <Avatar className="h-7 w-7 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {getInitials(profile?.display_name || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.username}</p>
            </div>
          </Link>
        </aside>
      )}

      {/* Mobile Header - Glassmorphism */}
      {user && (
        <header className="lg:hidden sticky top-0 z-50 glass-nav border-b border-border/50">
          <div className="flex items-center justify-between h-12 px-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg btn-center-action flex items-center justify-center">
                <span className="font-bold text-xs">T</span>
              </div>
              <span className="font-semibold text-lg gradient-text">Twibsers</span>
            </Link>
            <div className="flex items-center gap-1">
              <NotificationDropdown />
              <Link to="/messages">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10">
                  <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
                </Button>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Guest Header */}
      {!user && (
        <header className="sticky top-0 z-50 glass-nav border-b border-border/50">
          <div className="flex items-center justify-between h-14 px-4 max-w-screen-lg mx-auto">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl btn-center-action flex items-center justify-center">
                <span className="font-bold text-sm">T</span>
              </div>
              <span className="font-semibold text-xl gradient-text">Twibsers</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                <Link to="/auth">Log in</Link>
              </Button>
              <Button size="sm" className="rounded-xl btn-center-action border-0" asChild>
                <Link to="/auth?mode=signup">Sign up</Link>
              </Button>
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

      {/* Mobile Bottom Navigation - Glassmorphism with Center Action */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-border/50 safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16 px-2 relative">
            {mobileNavItems.map((item, index) => {
              const active = isActive(item.href);
              const isMore = item.href === '#more';
              const isCreate = item.href === '#create';

              // Center Create Button
              if (isCreate) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setCreateDialogOpen(true)}
                    className="relative -mt-6"
                  >
                    <div className="w-14 h-14 rounded-2xl btn-center-action flex items-center justify-center transition-transform duration-200 active:scale-95">
                      <Plus className="h-7 w-7 text-white" strokeWidth={2} />
                    </div>
                  </button>
                );
              }

              if (isMore) {
                return (
                  <DropdownMenu key={item.id}>
                    <DropdownMenuTrigger asChild>
                      <button className="flex flex-col items-center justify-center p-2 gap-0.5 rounded-xl transition-all duration-200 hover:bg-primary/10">
                        <Menu className="h-6 w-6" strokeWidth={1.5} />
                        <span className="text-[10px] text-muted-foreground">More</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      className="w-[200px] glass-nav border-border/50" 
                      align="end" 
                      side="top"
                      sideOffset={16}
                    >
                      <DropdownMenuItem asChild>
                        <Link to={`/profile/${profile?.username}`} className="cursor-pointer">
                          <User className="mr-3 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/library" className="cursor-pointer">
                          <BookOpen className="mr-3 h-4 w-4" />
                          Library
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/notifications" className="cursor-pointer">
                          <Heart className="mr-3 h-4 w-4" />
                          Notifications
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/messages" className="cursor-pointer">
                          <MessageCircle className="mr-3 h-4 w-4" />
                          Messages
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="cursor-pointer">
                          <Settings className="mr-3 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/pricing" className="cursor-pointer">
                          <Crown className="mr-3 h-4 w-4" />
                          Premium
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
                      <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                        <LogOut className="mr-3 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className="flex flex-col items-center justify-center p-2 gap-0.5 rounded-xl transition-all duration-200 hover:bg-primary/10"
                >
                  {item.icon && (
                    <item.icon 
                      className={cn("h-6 w-6 transition-colors", active && "text-primary")}
                      strokeWidth={active ? 2.5 : 1.5}
                      fill={active ? 'currentColor' : 'none'}
                    />
                  )}
                  <span className={cn("text-[10px]", active ? "text-primary font-medium" : "text-muted-foreground")}>
                    {item.label}
                  </span>
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
