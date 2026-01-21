import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
} from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Compass, label: 'Explore', href: '/explore' },
  { icon: MessageCircle, label: 'Messages', href: '/messages' },
  { icon: BookOpen, label: 'Library', href: '/library' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, profile, signOut, isAdmin, isModerator } = useAuth();
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
    <div className="min-h-screen">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full">
        <div className="absolute inset-0 glass-card border-b border-border/30" />
        <div className="container relative flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl hidden sm:inline gradient-text">Twibsers</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Search Twibsers..."
                className="w-full h-11 pl-11 pr-4 rounded-full bg-muted/40 border border-transparent focus:border-primary/30 focus:bg-background focus:shadow-glow-sm transition-all outline-none text-sm"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
            >
              <Search className="h-5 w-5" />
            </Button>

            {user && (
              <>
                <NotificationDropdown className="hidden md:flex" />
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="btn-gradient rounded-full gap-2 hidden sm:flex h-10 px-5"
                >
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Create</span>
                </Button>
              </>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0">
                    <Avatar className="h-11 w-11 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all hover:ring-primary/40">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-medium">
                        {getInitials(profile?.display_name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    {profile?.is_verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-background flex items-center justify-center shadow-sm">
                        <BadgeCheck className="w-4 h-4 text-verified" />
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

      <div className="flex">
        {/* Left Sidebar - Desktop Navigation */}
        {user && (
          <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-4rem)] sticky top-16 p-4">
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-border/50 to-transparent" />
            
            <nav className="flex-1 space-y-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                      isActive
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-glow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Card */}
            <div className="glass-premium p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-primary/20">
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
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <div className="absolute inset-0 glass-card border-t border-border/30" />
          <div className="relative flex items-center justify-around h-16 px-2">
            {navItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center h-full px-3 py-2 rounded-xl transition-all',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className={cn(
                    "relative p-2 rounded-xl transition-all",
                    isActive && "bg-primary/10"
                  )}>
                    <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md -z-10" />
                    )}
                  </div>
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
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
