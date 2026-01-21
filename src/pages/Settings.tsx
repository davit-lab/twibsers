import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useLoginSessions } from '@/hooks/useLoginSessions';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Camera, User, Bell, Lock, Shield, Palette, Eye, 
  Accessibility, Globe, Monitor, Moon, Sun, Smartphone, Laptop, 
  MapPin, LogOut, Trash2, Key, AlertTriangle, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
];

const CONTENT_FILTERS = [
  { value: 'strict', label: 'Strict', description: 'Hide all potentially sensitive content' },
  { value: 'standard', label: 'Standard', description: 'Show warnings before sensitive content' },
  { value: 'none', label: 'None', description: 'Show all content without warnings' },
];

const COLOR_ACCENTS = [
  { value: 'purple', color: 'hsl(270 70% 55%)', label: 'Purple' },
  { value: 'blue', color: 'hsl(220 70% 55%)', label: 'Blue' },
  { value: 'green', color: 'hsl(160 70% 45%)', label: 'Green' },
  { value: 'orange', color: 'hsl(30 90% 55%)', label: 'Orange' },
  { value: 'pink', color: 'hsl(330 80% 55%)', label: 'Pink' },
  { value: 'red', color: 'hsl(0 75% 55%)', label: 'Red' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const { preferences, loading: prefsLoading, saving: prefsSaving, updatePreferences } = useUserPreferences();
  const { sessions, loading: sessionsLoading, revokeSession, revokeAllOtherSessions } = useLoginSessions();
  const { toast } = useToast();
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    privacy: 'public' as 'public' | 'private',
    email_notifications: true,
    push_notifications: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        privacy: profile.privacy,
        email_notifications: profile.email_notifications,
        push_notifications: profile.push_notifications,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    
    const { error } = await updateProfile({
      display_name: formData.display_name,
      bio: formData.bio,
      location: formData.location,
      website: formData.website,
      privacy: formData.privacy,
      email_notifications: formData.email_notifications,
      push_notifications: formData.push_notifications,
    });
    
    setSaving(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving settings',
        description: error.message,
      });
    } else {
      toast({
        title: 'Settings saved',
        description: 'Your profile has been updated successfully.',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDeviceIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Smartphone;
      default:
        return Laptop;
    }
  };

  if (authLoading || prefsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8 px-4 pb-24 lg:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 lg:w-auto gap-1">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4 hidden sm:inline" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4 hidden sm:inline" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <Eye className="h-4 w-4 hidden sm:inline" />
              Content
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4 hidden sm:inline" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Lock className="h-4 w-4 hidden sm:inline" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="gap-2">
              <Accessibility className="h-4 w-4 hidden sm:inline" />
              Accessibility
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4 hidden sm:inline" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your public profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl">
                        {getInitials(formData.display_name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-medium">Profile Photo</h3>
                    <p className="text-sm text-muted-foreground">Click to upload a new photo</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="Your display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://yoursite.com"
                    />
                  </div>
                </div>

                <Button onClick={handleSave} className="btn-gradient" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how Twibsers looks for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Theme */}
                <div className="space-y-3">
                  <Label>Theme</Label>
                  <RadioGroup 
                    value={preferences?.theme || 'system'}
                    onValueChange={(value) => updatePreferences({ theme: value })}
                    className="grid grid-cols-3 gap-4"
                  >
                    {[
                      { value: 'light', icon: Sun, label: 'Light' },
                      { value: 'dark', icon: Moon, label: 'Dark' },
                      { value: 'system', icon: Monitor, label: 'System' },
                    ].map(({ value, icon: Icon, label }) => (
                      <Label
                        key={value}
                        htmlFor={`theme-${value}`}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                          preferences?.theme === value 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value={value} id={`theme-${value}`} className="sr-only" />
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Font Size */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Font Size</Label>
                    <span className="text-sm text-muted-foreground capitalize">{preferences?.font_size}</span>
                  </div>
                  <Slider
                    value={[['small', 'medium', 'large', 'xlarge'].indexOf(preferences?.font_size || 'medium')]}
                    onValueChange={([v]) => updatePreferences({ font_size: ['small', 'medium', 'large', 'xlarge'][v] })}
                    max={3}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Small</span>
                    <span>Medium</span>
                    <span>Large</span>
                    <span>X-Large</span>
                  </div>
                </div>

                {/* Display Density */}
                <div className="space-y-3">
                  <Label>Display Density</Label>
                  <Select 
                    value={preferences?.display_density || 'comfortable'}
                    onValueChange={(value) => updatePreferences({ display_density: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact - More content, less spacing</SelectItem>
                      <SelectItem value="comfortable">Comfortable - Balanced layout</SelectItem>
                      <SelectItem value="spacious">Spacious - More breathing room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Color Accent */}
                <div className="space-y-3">
                  <Label>Accent Color</Label>
                  <div className="flex gap-3 flex-wrap">
                    {COLOR_ACCENTS.map(({ value, color, label }) => (
                      <button
                        key={value}
                        onClick={() => updatePreferences({ color_accent: value })}
                        className={cn(
                          "w-12 h-12 rounded-full transition-all flex items-center justify-center",
                          preferences?.color_accent === value && "ring-2 ring-offset-2 ring-offset-background"
                        )}
                        style={{ backgroundColor: color, '--tw-ring-color': color } as any}
                        title={label}
                      >
                        {preferences?.color_accent === value && (
                          <Check className="h-5 w-5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content & Feed Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Content & Feed</CardTitle>
                <CardDescription>Control what you see in your feed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Autoplay */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autoplay Videos</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically play videos as you scroll
                    </p>
                  </div>
                  <Switch
                    checked={preferences?.autoplay_videos ?? true}
                    onCheckedChange={(checked) => updatePreferences({ autoplay_videos: checked })}
                  />
                </div>

                {/* Content Filter */}
                <div className="space-y-3">
                  <Label>Content Filter</Label>
                  <RadioGroup 
                    value={preferences?.content_filter || 'standard'}
                    onValueChange={(value) => updatePreferences({ content_filter: value })}
                    className="space-y-2"
                  >
                    {CONTENT_FILTERS.map(({ value, label, description }) => (
                      <Label
                        key={value}
                        htmlFor={`filter-${value}`}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                          preferences?.content_filter === value 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value={value} id={`filter-${value}`} />
                        <div>
                          <span className="font-medium">{label}</span>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Sensitive Content */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Sensitive Content</Label>
                    <p className="text-sm text-muted-foreground">
                      Display content marked as sensitive
                    </p>
                  </div>
                  <Switch
                    checked={preferences?.show_sensitive_content ?? false}
                    onCheckedChange={(checked) => updatePreferences({ show_sensitive_content: checked })}
                  />
                </div>

                {/* Language */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Language
                  </Label>
                  <Select 
                    value={preferences?.language || 'en'}
                    onValueChange={(value) => updatePreferences({ language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(({ code, name }) => (
                        <SelectItem key={code} value={code}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about activity on your account
                    </p>
                  </div>
                  <Switch
                    checked={formData.email_notifications}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, email_notifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on your devices
                    </p>
                  </div>
                  <Switch
                    checked={formData.push_notifications}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, push_notifications: checked })
                    }
                  />
                </div>

                <Button onClick={handleSave} className="btn-gradient" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control who can see your content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Private Account</Label>
                    <p className="text-sm text-muted-foreground">
                      Only approved followers can see your posts and profile
                    </p>
                  </div>
                  <Switch
                    checked={formData.privacy === 'private'}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, privacy: checked ? 'private' : 'public' })
                    }
                  />
                </div>

                <Button onClick={handleSave} className="btn-gradient" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility Tab */}
          <TabsContent value="accessibility">
            <Card>
              <CardHeader>
                <CardTitle>Accessibility</CardTitle>
                <CardDescription>Make Twibsers easier to use</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reduce Motion</Label>
                    <p className="text-sm text-muted-foreground">
                      Minimize animations and transitions
                    </p>
                  </div>
                  <Switch
                    checked={preferences?.reduced_motion ?? false}
                    onCheckedChange={(checked) => updatePreferences({ reduced_motion: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>High Contrast</Label>
                    <p className="text-sm text-muted-foreground">
                      Increase color contrast for better visibility
                    </p>
                  </div>
                  <Switch
                    checked={preferences?.high_contrast ?? false}
                    onCheckedChange={(checked) => updatePreferences({ high_contrast: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Screen Reader Optimized</Label>
                    <p className="text-sm text-muted-foreground">
                      Optimize experience for screen readers
                    </p>
                  </div>
                  <Switch
                    checked={preferences?.screen_reader_optimized ?? false}
                    onCheckedChange={(checked) => updatePreferences({ screen_reader_optimized: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              {/* Account Security */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>Manage your security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <h3 className="font-medium mb-1">Email Address</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Button variant="outline" className="gap-2">
                      <Key className="h-4 w-4" />
                      Change Password
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      checked={preferences?.two_factor_enabled ?? false}
                      onCheckedChange={(checked) => updatePreferences({ two_factor_enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Login Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified of new logins to your account
                      </p>
                    </div>
                    <Switch
                      checked={preferences?.login_alerts ?? true}
                      onCheckedChange={(checked) => updatePreferences({ login_alerts: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Active Sessions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>Manage devices logged into your account</CardDescription>
                  </div>
                  {sessions.length > 1 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={revokeAllOtherSessions}
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out all others
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {sessionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No active sessions</p>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session) => {
                        const DeviceIcon = getDeviceIcon(session.device_type);
                        return (
                          <div 
                            key={session.id}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border",
                              session.is_current && "bg-primary/5 border-primary/30"
                            )}
                          >
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <DeviceIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {session.device_name || 'Unknown Device'}
                                </span>
                                {session.is_current && (
                                  <Badge variant="secondary" className="text-xs">Current</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {session.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {session.location}
                                  </span>
                                )}
                                <span>•</span>
                                <span>
                                  {format(new Date(session.last_active_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                            {!session.is_current && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => revokeSession(session.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <LogOut className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div>
                      <h4 className="font-medium">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
