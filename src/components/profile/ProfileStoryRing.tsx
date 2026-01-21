import { useState, useRef } from 'react';
import { useStories } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, Loader2, X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, Trash2, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ProfileStoryRingProps {
  userId: string;
  avatarUrl?: string | null;
  displayName: string;
  isOwnProfile: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function ProfileStoryRing({ 
  userId, 
  avatarUrl, 
  displayName, 
  isOwnProfile,
  size = 'xl'
}: ProfileStoryRingProps) {
  const { user } = useAuth();
  const { groupedStories, loading, viewStory, uploadStory, deleteStory } = useStories({ profileUserId: userId });
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasStories = groupedStories.length > 0 && groupedStories[0].stories.length > 0;
  const currentGroup = groupedStories[0];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const hasUnviewed = currentGroup?.has_unviewed;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-32 h-32 md:w-36 md:h-36',
  };

  const ringSize = {
    sm: 'p-0.5',
    md: 'p-0.5',
    lg: 'p-1',
    xl: 'p-1',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image or video file.',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 50MB.',
      });
      return;
    }

    setUploading(true);
    try {
      await uploadStory(file);
      toast({
        title: 'Story added!',
        description: 'Your story will be visible for 24 hours.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload story.',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openViewer = () => {
    if (!hasStories) return;
    setCurrentStoryIndex(0);
    setViewerOpen(true);
    const story = currentGroup?.stories[0];
    if (story && !story.is_viewed) {
      viewStory(story.id);
    }
  };

  const nextStory = () => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      const newIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(newIndex);
      const story = currentGroup.stories[newIndex];
      if (story && !story.is_viewed) viewStory(story.id);
    } else {
      setViewerOpen(false);
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <>
      <div className="relative group">
        {/* Ring container */}
        <div 
          className={cn(
            "rounded-full cursor-pointer transition-transform duration-300 hover:scale-105",
            ringSize[size],
            hasStories 
              ? hasUnviewed 
                ? "bg-gradient-to-br from-primary via-accent to-primary animate-pulse-slow" 
                : "bg-muted-foreground/30"
              : "bg-transparent"
          )}
          onClick={hasStories ? openViewer : undefined}
        >
          <div className={cn("rounded-full bg-background", ringSize[size])}>
            <Avatar className={cn(sizeClasses[size], "border-4 border-background")}>
              <AvatarImage src={avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl md:text-3xl font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Add story button for own profile */}
        {isOwnProfile && user && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "absolute -bottom-1 -right-1 rounded-full bg-primary text-primary-foreground",
              "flex items-center justify-center transition-all duration-200 hover:scale-110",
              "shadow-lg border-4 border-background",
              size === 'xl' ? 'w-10 h-10' : 'w-8 h-8'
            )}
          >
            {uploading ? (
              <Loader2 className={cn("animate-spin", size === 'xl' ? 'h-5 w-5' : 'h-4 w-4')} />
            ) : (
              <Plus className={cn(size === 'xl' ? 'h-5 w-5' : 'h-4 w-4')} />
            )}
          </button>
        )}

        {/* Story count indicator */}
        {hasStories && (
          <div className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg">
            {currentGroup.stories.length}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Story Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-lg p-0 bg-black border-none overflow-hidden h-[90vh] max-h-[800px]">
          {currentStory && currentGroup && (
            <div className="relative h-full w-full flex flex-col">
              {/* Progress bars */}
              <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
                {currentGroup.stories.map((story, i) => (
                  <div key={story.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full bg-white transition-all duration-300",
                        i < currentStoryIndex && "w-full",
                        i === currentStoryIndex && !paused && "animate-story-progress",
                        i > currentStoryIndex && "w-0"
                      )}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 ring-2 ring-white/30">
                    <AvatarImage src={currentGroup.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
                      {getInitials(currentGroup.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold text-sm">{currentGroup.display_name}</p>
                    <p className="text-white/60 text-xs">
                      {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPaused(!paused)}
                    className="rounded-full text-white hover:bg-white/20"
                  >
                    {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  </Button>
                  {currentStory.media_type === 'video' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMuted(!muted)}
                      className="rounded-full text-white hover:bg-white/20"
                    >
                      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  )}
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        deleteStory(currentStory.id);
                        nextStory();
                      }}
                      className="rounded-full text-white hover:bg-destructive/80"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewerOpen(false)}
                    className="rounded-full text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Media */}
              <div className="flex-1 flex items-center justify-center bg-black">
                {currentStory.media_type === 'video' ? (
                  <video
                    src={currentStory.media_url}
                    className="max-h-full max-w-full object-contain"
                    autoPlay
                    loop={false}
                    muted={muted}
                    playsInline
                    onEnded={nextStory}
                  />
                ) : (
                  <img
                    src={currentStory.media_url}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                    onLoad={() => {
                      if (!paused) {
                        setTimeout(nextStory, (currentStory.duration || 5) * 1000);
                      }
                    }}
                  />
                )}
              </div>

              {/* Caption */}
              {currentStory.caption && (
                <div className="absolute bottom-20 left-4 right-4 z-20">
                  <p className="text-white text-center text-sm bg-black/40 rounded-lg px-4 py-2">
                    {currentStory.caption}
                  </p>
                </div>
              )}

              {/* Navigation */}
              <button onClick={prevStory} className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 z-10" />
              <button onClick={nextStory} className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 z-10" />

              {currentStoryIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevStory}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/30 text-white hover:bg-black/50"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              {currentStoryIndex < currentGroup.stories.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextStory}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/30 text-white hover:bg-black/50"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* View count for own stories */}
              {isOwnProfile && (
                <div className="absolute bottom-4 left-0 right-0 z-20 text-center">
                  <span className="text-white/60 text-sm">
                    👁 {currentStory.view_count} views
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes story-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-story-progress {
          animation: story-progress 5s linear forwards;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
