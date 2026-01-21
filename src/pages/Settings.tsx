import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useLoginSessions } from '@/hooks/useLoginSessions';
import { useCallBlocks } from '@/hooks/useCallBlocks';
import { supabase } from '@/integrations/supabase/client';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Camera, User, Bell, Lock, Shield, Palette, Eye, 
  Accessibility, Globe, Monitor, Moon, Sun, Smartphone, Laptop, 
  MapPin, LogOut, Trash2, Key, AlertTriangle, Check, Mail, Upload,
  PhoneOff, UserX
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getAllLanguages } from '@/lib/languageDetection';

const LANGUAGES = getAllLanguages();

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
  const { blockedUsers, loading: blocksLoading, unblockUser } = useCallBlocks();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'password' | 'email'>('password');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  
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
    
    // Check if username changed
    if (formData.username !== profile?.username) {
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(formData.username)) {
        setSaving(false);
        toast({
          variant: 'destructive',
          title: 'Invalid username',
          description: 'Username must be 3-30 characters and contain only letters, numbers, and underscores.',
        });
        return;
      }

      // Check if username is available
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', formData.username)
        .neq('user_id', user?.id)
        .maybeSingle();

      if (existingUser) {
        setSaving(false);
        toast({
          variant: 'destructive',
          title: 'Username taken',
          description: 'This username is already in use. Please choose another.',
        });
        return;
      }
    }
    
    const { error } = await updateProfile({
      display_name: formData.display_name,
      username: formData.username,
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
        title: 'Settings saved ✨',
        description: 'Your profile has been updated successfully.',
      });
      
      // If username changed, navigate to new profile URL
      if (formData.username !== profile?.username) {
        navigate(`/profile/${formData.username}`);
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image file.',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 5MB.',
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await updateProfile({ avatar_url: urlData.publicUrl });
      
      toast({
        title: 'Photo updated! 📸',
        description: 'Your profile picture has been changed.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload photo.',
      });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handlePasswordChange = async () => {
    if (passwordMode === 'password') {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast({
          variant: 'destructive',
          title: 'Passwords do not match',
          description: 'Please make sure both passwords are the same.',
        });
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        toast({
          variant: 'destructive',
          title: 'Password too short',
          description: 'Password must be at least 6 characters.',
        });
        return;
      }

      setPasswordLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      setPasswordLoading(false);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to change password',
          description: error.message,
        });
      } else {
        toast({
          title: 'Password changed! 🔐',
          description: 'Your password has been updated successfully.',
        });
        setPasswordDialogOpen(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } else {
      // Send password reset email
      setPasswordLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
        redirectTo: `${window.location.origin}/settings`,
      });
      setPasswordLoading(false);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to send email',
          description: error.message,
        });
      } else {
        toast({
          title: 'Email sent! 📧',
          description: 'Check your email for the password reset link.',
        });
        setPasswordDialogOpen(false);
      }
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
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your public profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-primary/20 ring-4 ring-primary/10">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl">
                        {getInitials(formData.display_name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">Profile Photo 📷</h3>
                    <p className="text-sm text-muted-foreground">Hover over the photo to change it</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-2"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </Button>
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
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                        placeholder="your_username"
                        className="pl-8"
                        maxLength={30}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">3-30 characters. Letters, numbers, underscores only.</p>
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
            <div className="space-y-6">
              {/* Theme Selection Card */}
              <Card className="glass-card overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Palette className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Theme 🎨</CardTitle>
                      <CardDescription>Choose your preferred appearance</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'light', icon: Sun, label: 'Light', emoji: '☀️', desc: 'Bright & clean' },
                      { value: 'dark', icon: Moon, label: 'Dark', emoji: '🌙', desc: 'Easy on eyes' },
                      { value: 'system', icon: Monitor, label: 'Auto', emoji: '💻', desc: 'Match device' },
                    ].map(({ value, icon: Icon, label, emoji, desc }) => (
                      <button
                        key={value}
                        onClick={() => updatePreferences({ theme: value })}
                        className={cn(
                          "group relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300",
                          preferences?.theme === value 
                            ? "border-primary bg-gradient-to-br from-primary/10 to-accent/5 shadow-lg shadow-primary/10" 
                            : "border-border/50 hover:border-primary/40 hover:bg-muted/30"
                        )}
                      >
                        <div className={cn(
                          "p-3 rounded-xl transition-all duration-300",
                          preferences?.theme === value 
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                            : "bg-muted group-hover:bg-primary/10"
                        )}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                          <span className="text-xl mb-1">{emoji}</span>
                          <p className="font-semibold text-sm">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        {preferences?.theme === value && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Font Size & Density Card */}
              <Card className="glass-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-accent/10">
                      <span className="text-lg">Aa</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Typography ✍️</CardTitle>
                      <CardDescription>Adjust text size and spacing</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Font Size */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Font Size</Label>
                      <Badge variant="secondary" className="capitalize">{preferences?.font_size || 'medium'}</Badge>
                    </div>
                    <div className="px-2">
                      <Slider
                        value={[['small', 'medium', 'large', 'xlarge'].indexOf(preferences?.font_size || 'medium')]}
                        onValueChange={([v]) => updatePreferences({ font_size: ['small', 'medium', 'large', 'xlarge'][v] })}
                        max={3}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between px-1">
                      {['Small', 'Medium', 'Large', 'X-Large'].map((size, i) => (
                        <button
                          key={size}
                          onClick={() => updatePreferences({ font_size: ['small', 'medium', 'large', 'xlarge'][i] })}
                          className={cn(
                            "text-xs px-2 py-1 rounded-lg transition-colors",
                            ['small', 'medium', 'large', 'xlarge'].indexOf(preferences?.font_size || 'medium') === i
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {/* Preview */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                      <p className="text-muted-foreground text-xs mb-2">Preview</p>
                      <p className="transition-all" style={{ 
                        fontSize: preferences?.font_size === 'small' ? '14px' : 
                                  preferences?.font_size === 'large' ? '18px' : 
                                  preferences?.font_size === 'xlarge' ? '20px' : '16px' 
                      }}>
                        The quick brown fox jumps over the lazy dog 🦊
                      </p>
                    </div>
                  </div>

                  {/* Display Density */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-base font-medium">Display Density</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'compact', label: 'Compact', icon: '📱', desc: 'More content' },
                        { value: 'comfortable', label: 'Comfortable', icon: '💻', desc: 'Balanced' },
                        { value: 'spacious', label: 'Spacious', icon: '🖥️', desc: 'More space' },
                      ].map(({ value, label, icon, desc }) => (
                        <button
                          key={value}
                          onClick={() => updatePreferences({ display_density: value })}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center transition-all",
                            preferences?.display_density === value 
                              ? "border-primary bg-primary/5" 
                              : "border-border/50 hover:border-primary/30"
                          )}
                        >
                          <span className="text-2xl block mb-1">{icon}</span>
                          <p className="font-medium text-sm">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Accent Color Card */}
              <Card className="glass-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                      <span className="text-white text-lg">🌈</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Accent Color ✨</CardTitle>
                      <CardDescription>Personalize your color theme</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 gap-4">
                    {COLOR_ACCENTS.map(({ value, color, label }) => (
                      <button
                        key={value}
                        onClick={() => updatePreferences({ color_accent: value })}
                        className={cn(
                          "relative aspect-square rounded-2xl transition-all duration-300 flex items-center justify-center group",
                          preferences?.color_accent === value 
                            ? "ring-4 ring-offset-4 ring-offset-background scale-110 shadow-lg" 
                            : "hover:scale-105"
                        )}
                        style={{ 
                          backgroundColor: color, 
                          '--tw-ring-color': color,
                          boxShadow: preferences?.color_accent === value ? `0 8px 30px ${color}50` : undefined
                        } as React.CSSProperties}
                        title={label}
                      >
                        {preferences?.color_accent === value && (
                          <Check className="h-6 w-6 text-white drop-shadow-md" />
                        )}
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-8 text-center">
                    Selected: <span className="font-medium capitalize">{preferences?.color_accent || 'purple'}</span>
                  </p>
                </CardContent>
              </Card>
            </div>
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
            <div className="space-y-6">
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

              {/* Do Not Disturb Card */}
              <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-500" />
                    Do Not Disturb
                  </CardTitle>
                  <CardDescription>Silence incoming calls and notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Enable Do Not Disturb</Label>
                      <p className="text-sm text-muted-foreground">
                        When enabled, incoming calls will be silently declined and marked as missed
                      </p>
                    </div>
                    <Switch
                      checked={preferences?.do_not_disturb ?? false}
                      onCheckedChange={(checked) => updatePreferences({ do_not_disturb: checked })}
                    />
                  </div>
                  {preferences?.do_not_disturb && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Bell className="h-4 w-4 text-amber-500" />
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Do Not Disturb is active. All incoming calls will be silently declined.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <div className="space-y-6">
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

              {/* Call Blocking Card */}
              <Card className="border-red-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PhoneOff className="h-5 w-5 text-red-500" />
                    Blocked Callers
                  </CardTitle>
                  <CardDescription>
                    Users you've blocked cannot call you. Block users from their profile or message thread.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {blocksLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : blockedUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="p-3 rounded-full bg-muted/50 mb-3">
                        <UserX className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No blocked callers</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Block users from their profile or message thread
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {blockedUsers.map((block) => (
                        <div
                          key={block.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={block.profile?.avatar_url || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-red-500 to-rose-600 text-white">
                                {block.profile?.display_name?.slice(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{block.profile?.display_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">@{block.profile?.username || 'user'}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => unblockUser(block.blocked_id)}
                          >
                            Unblock
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Account Security
                  </CardTitle>
                  <CardDescription>Manage your security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Email Address</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/50 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Password</h3>
                        <p className="text-sm text-muted-foreground">Change your account password</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => setPasswordDialogOpen(true)}
                    >
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

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Choose how you want to change your password
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPasswordMode('password')}
                className={cn(
                  "p-4 rounded-xl border-2 text-center transition-all",
                  passwordMode === 'password'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                <Key className="h-6 w-6 mx-auto mb-2" />
                <p className="font-medium text-sm">Use Password</p>
                <p className="text-xs text-muted-foreground">Enter new password</p>
              </button>
              <button
                onClick={() => setPasswordMode('email')}
                className={cn(
                  "p-4 rounded-xl border-2 text-center transition-all",
                  passwordMode === 'email'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                <Mail className="h-6 w-6 mx-auto mb-2" />
                <p className="font-medium text-sm">Email Link</p>
                <p className="text-xs text-muted-foreground">Reset via email</p>
              </button>
            </div>

            {passwordMode === 'password' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-muted/50 text-center">
                <Mail className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  We'll send a password reset link to <strong>{user?.email}</strong>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} disabled={passwordLoading} className="btn-gradient">
              {passwordLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {passwordMode === 'password' ? 'Changing...' : 'Sending...'}
                </>
              ) : (
                passwordMode === 'password' ? 'Change Password' : 'Send Reset Link'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
