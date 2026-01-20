import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Image, 
  Video, 
  Globe, 
  Users, 
  Lock, 
  ChevronDown, 
  X, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PostVisibility = 'public' | 'followers' | 'private';

interface MediaPreview {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface PostComposerProps {
  onPostCreated?: () => void;
}

const visibilityOptions = [
  { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see this' },
  { value: 'followers', label: 'Followers', icon: Users, description: 'Only followers can see' },
  { value: 'private', label: 'Only me', icon: Lock, description: 'Only you can see this' },
] as const;

export default function PostComposer({ onPostCreated }: PostComposerProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [mediaFiles, setMediaFiles] = useState<MediaPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return (isImage || isVideo) && isValidSize;
    });

    if (validFiles.length + mediaFiles.length > 4) {
      toast({
        variant: 'destructive',
        title: 'Too many files',
        description: 'You can only upload up to 4 media files per post.',
      });
      return;
    }

    const newPreviews = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video' as 'image' | 'video',
    }));

    setMediaFiles(prev => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadMedia = async (file: File, userId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('post-media')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('post-media')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    if (!profile) return;

    setIsSubmitting(true);

    try {
      // Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: profile.user_id,
          content: content.trim(),
          visibility,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Upload media files
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(async (media, index) => {
          const url = await uploadMedia(media.file, profile.user_id);
          if (url) {
            return supabase.from('post_media').insert({
              post_id: post.id,
              url,
              type: media.type,
              position: index,
            });
          }
          return null;
        });

        await Promise.all(uploadPromises);
      }

      // Reset form
      setContent('');
      setMediaFiles([]);
      setVisibility('public');
      setIsFocused(false);
      
      toast({
        title: 'Posted!',
        description: 'Your post has been published.',
      });

      onPostCreated?.();
    } catch (error: any) {
      console.error('Post creation error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create post. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVisibility = visibilityOptions.find(v => v.value === visibility)!;
  const charCount = content.length;
  const isOverLimit = charCount > 5000;
  const canPost = (content.trim() || mediaFiles.length > 0) && !isOverLimit && !isSubmitting;

  return (
    <div className={cn(
      "p-4 bg-card rounded-xl border transition-all duration-300",
      isFocused ? "shadow-card-hover border-primary/30" : "border-border"
    )}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
            {getInitials(profile?.display_name || 'U')}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <Textarea
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="min-h-[60px] border-0 bg-transparent resize-none focus-visible:ring-0 p-0 text-base placeholder:text-muted-foreground/70"
          />

          {/* Media Previews */}
          {mediaFiles.length > 0 && (
            <div className={cn(
              "grid gap-2 mt-3",
              mediaFiles.length === 1 && "grid-cols-1",
              mediaFiles.length === 2 && "grid-cols-2",
              mediaFiles.length >= 3 && "grid-cols-2"
            )}>
              {mediaFiles.map((media, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "relative rounded-lg overflow-hidden bg-muted",
                    mediaFiles.length === 3 && index === 0 && "row-span-2"
                  )}
                >
                  {media.type === 'image' ? (
                    <img 
                      src={media.preview} 
                      alt="Upload preview" 
                      className="w-full h-full object-cover max-h-64"
                    />
                  ) : (
                    <video 
                      src={media.preview} 
                      className="w-full h-full object-cover max-h-64"
                      controls
                    />
                  )}
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur rounded-full hover:bg-background transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions Bar */}
          {(isFocused || content || mediaFiles.length > 0) && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mediaFiles.length >= 4}
                >
                  <Image className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mediaFiles.length >= 4}
                >
                  <Video className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                      <selectedVisibility.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{selectedVisibility.label}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {visibilityOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setVisibility(option.value)}
                        className="gap-3"
                      >
                        <option.icon className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3">
                {content.length > 0 && (
                  <span className={cn(
                    "text-xs",
                    isOverLimit ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {charCount}/5000
                  </span>
                )}
                <Button 
                  onClick={handleSubmit} 
                  disabled={!canPost}
                  className="btn-gradient gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}