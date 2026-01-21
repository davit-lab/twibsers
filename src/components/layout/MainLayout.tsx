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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Compass,
  Clapperboard,
  MessageCircle,
  BookOpen,
  Bell,
  Settings,
  User,
  LogOut,
  Sparkles,
  Search,
  Plus,
  Shield,
  BadgeCheck,
  Crown,
  Ban,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

interface MainLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Compass, label: 'Explore', href: '/explore' },
  { icon: Clapperboard, label: 'Reels', href: '/reels' },
  { icon: MessageCircle, label: 'Messages', href: '/messages' },
  { icon: BookOpen, label: 'Library', href: '/library' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
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

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar - Native App Style */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="flex h-14 items-center justify-between px-4 max-w-screen-xl mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl hidden sm:inline gradient-text">Twibsers</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-sm mx-6">
            <div className="relative w-full group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-10 pl-10 pr-4 rounded-full bg-muted/50 border border-transparent focus:border-primary/30 focus:bg-background focus:shadow-sm transition-all outline-none text-sm"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full h-9 w-9"
            >
              <Search className="h-5 w-5" />
            </Button>

            {user && (
              <>
                <NotificationDropdown className="hidden md:flex" />
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="btn-gradient rounded-full gap-2 hidden sm:flex h-9 px-4 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Post
                </Button>
              </>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/10 ring-offset-1 ring-offset-background transition-all hover:ring-primary/30">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm font-medium">
                        {getInitials(profile?.display_name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    {profile?.is_verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background flex items-center justify-center shadow-sm">
                        <BadgeCheck className="w-3.5 h-3.5 text-verified" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 glass-premium border-border/30" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold">{profile?.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{profile?.username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem asChild>
                    <Link to={`/profile/${profile?.username}`} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/pricing" className="cursor-pointer">
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade Plan
                    </Link>
                  </DropdownMenuItem>
                  {(isAdmin || isModerator) && (
                    <>
                      <DropdownMenuSeparator className="bg-border/50" />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild className="rounded-full">
                  <Link to="/auth">Log In</Link>
                </Button>
                <Button className="btn-gradient rounded-full" asChild>
                  <Link to="/auth?mode=signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex max-w-screen-xl mx-auto">
        {/* Left Sidebar - Desktop Navigation */}
        {user && (
          <aside className="hidden lg:flex flex-col w-60 h-[calc(100vh-3.5rem)] sticky top-14 py-4 pr-4">
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive && "scale-105")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Card */}
            <div className="mt-4 p-3 rounded-2xl bg-muted/30 border border-border/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm font-medium">
                    {getInitials(profile?.display_name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{profile?.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{profile?.username}</p>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)] border-x border-border/30">
          {isBanned && banInfo ? (
            <div className="container max-w-2xl py-12 px-4">
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <Ban className="w-8 h-8 text-destructive" />
                  </div>
                  <CardTitle className="text-destructive">Account Suspended</CardTitle>
                  <CardDescription>
                    Your account has been suspended from using Twibsers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-1">Reason:</p>
                    <p className="text-sm text-muted-foreground">{banInfo.reason}</p>
                  </div>
                  {banInfo.expires_at ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        Suspension ends: {format(new Date(banInfo.expires_at), 'PPpp')}
                      </span>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-destructive font-medium">
                      This is a permanent suspension.
                    </p>
                  )}
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation - Minimal iOS style */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/40 safe-area-inset-bottom">
          <div className="flex items-center justify-around h-14 px-2">
            {navItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center py-1 px-4 transition-all',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <item.icon className={cn('h-6 w-6', isActive && 'scale-105')} strokeWidth={isActive ? 2.5 : 2} />
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Create Dialog */}
      <CreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
