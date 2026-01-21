import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useReels } from '@/hooks/useReels';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Upload, X, Play, Pause, Scissors, Palette, Music, 
  Image, ChevronLeft, ChevronRight, Volume2, VolumeX, Check,
  RotateCcw, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReelCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'trim' | 'filter' | 'music' | 'thumbnail' | 'caption';

const FILTERS = [
  { id: 'none', name: 'Original', css: '' },
  { id: 'grayscale', name: 'B&W', css: 'grayscale(100%)' },
  { id: 'sepia', name: 'Sepia', css: 'sepia(80%)' },
  { id: 'saturate', name: 'Vivid', css: 'saturate(150%)' },
  { id: 'contrast', name: 'Contrast', css: 'contrast(120%)' },
  { id: 'brightness', name: 'Bright', css: 'brightness(120%)' },
  { id: 'warm', name: 'Warm', css: 'sepia(30%) saturate(140%)' },
  { id: 'cool', name: 'Cool', css: 'hue-rotate(180deg) saturate(80%)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(40%) contrast(90%) brightness(90%)' },
  { id: 'dramatic', name: 'Dramatic', css: 'contrast(130%) brightness(90%)' },
  { id: 'fade', name: 'Fade', css: 'contrast(90%) brightness(110%) saturate(80%)' },
  { id: 'noir', name: 'Noir', css: 'grayscale(100%) contrast(120%)' },
];

const MUSIC_TRACKS = [
  { id: 'none', name: 'No Music', url: null, duration: 0 },
  { id: 'upbeat', name: '🎵 Upbeat Energy', url: '/music/upbeat.mp3', duration: 30 },
  { id: 'chill', name: '🎶 Chill Vibes', url: '/music/chill.mp3', duration: 30 },
  { id: 'epic', name: '🎸 Epic Rock', url: '/music/epic.mp3', duration: 30 },
  { id: 'happy', name: '🌟 Happy Day', url: '/music/happy.mp3', duration: 30 },
  { id: 'lofi', name: '☕ Lo-Fi Beats', url: '/music/lofi.mp3', duration: 30 },
  { id: 'electronic', name: '⚡ Electronic', url: '/music/electronic.mp3', duration: 30 },
];

export default function ReelCreator({ open, onOpenChange }: ReelCreatorProps) {
  const { uploadReel } = useReels();
  const { toast } = useToast();
  
  // Step management
  const [step, setStep] = useState<Step>('upload');
  
  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Trim state
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);
  
  // Filter state
  const [selectedFilter, setSelectedFilter] = useState('none');
  
  // Music state
  const [selectedMusic, setSelectedMusic] = useState('none');
  const [musicVolume, setMusicVolume] = useState(50);
  
  // Thumbnail state
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState(0);
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
  
  // Caption
  const [caption, setCaption] = useState('');
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate thumbnails from video
  const generateThumbnails = useCallback(async (video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const thumbs: string[] = [];
    const duration = video.duration;
    const numThumbs = Math.min(8, Math.floor(duration));
    
    canvas.width = 160;
    canvas.height = 284;
    
    for (let i = 0; i < numThumbs; i++) {
      const time = (duration / numThumbs) * i;
      video.currentTime = time;
      await new Promise(resolve => {
        video.onseeked = resolve;
      });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      thumbs.push(canvas.toDataURL('image/jpeg', 0.7));
    }
    
    video.currentTime = 0;
    setThumbnails(thumbs);
  }, []);

  // Handle video file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select a video file.',
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 100MB.',
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setStep('trim');
  };

  // Handle video metadata loaded
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      setTrimEnd(Math.min(60, duration));
      generateThumbnails(videoRef.current);
    }
  };

  // Handle thumbnail file selection
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image file.',
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setCustomThumbnail(url);
  };

  // Play/pause toggle
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Update current time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Loop within trim range
      if (video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [trimStart, trimEnd]);

  // Seek to trim start when trim changes
  useEffect(() => {
    if (videoRef.current && step === 'trim') {
      videoRef.current.currentTime = trimStart;
    }
  }, [trimStart, step]);

  // Get current filter CSS
  const getFilterStyle = () => {
    const filter = FILTERS.find(f => f.id === selectedFilter);
    return filter?.css || '';
  };

  // Upload the reel
  const handleUpload = async () => {
    if (!videoFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (actual upload doesn't have progress callback yet)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      await uploadReel(videoFile, caption, (progress) => {
        setUploadProgress(progress);
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: 'Reel posted! 🎬',
        description: 'Your reel is now live.',
      });

      handleClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload reel.',
      });
    } finally {
      setUploading(false);
    }
  };

  // Reset and close
  const handleClose = () => {
    setStep('upload');
    setVideoFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setVideoDuration(0);
    setTrimStart(0);
    setTrimEnd(60);
    setSelectedFilter('none');
    setSelectedMusic('none');
    setThumbnails([]);
    setSelectedThumbnail(0);
    if (customThumbnail) URL.revokeObjectURL(customThumbnail);
    setCustomThumbnail(null);
    setCaption('');
    setIsPlaying(false);
    onOpenChange(false);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Navigation
  const goToStep = (newStep: Step) => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setStep(newStep);
  };

  const steps: Step[] = ['trim', 'filter', 'music', 'thumbnail', 'caption'];
  const currentStepIndex = steps.indexOf(step);

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      goToStep(steps[currentStepIndex + 1]);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      goToStep(steps[currentStepIndex - 1]);
    } else {
      goToStep('upload');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {step !== 'upload' && (
                <Button variant="ghost" size="icon" onClick={prevStep}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <DialogTitle className="text-lg">
                {step === 'upload' && 'Create Reel'}
                {step === 'trim' && 'Trim Video'}
                {step === 'filter' && 'Add Filter'}
                {step === 'music' && 'Add Music'}
                {step === 'thumbnail' && 'Choose Thumbnail'}
                {step === 'caption' && 'Add Caption'}
              </DialogTitle>
            </div>
            {step !== 'upload' && step !== 'caption' && (
              <Button variant="ghost" onClick={nextStep}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 'caption' && (
              <Button 
                onClick={handleUpload} 
                disabled={uploading}
                className="btn-gradient"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Share
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Step indicators */}
          {step !== 'upload' && (
            <div className="flex justify-center gap-2 py-3 px-4 border-b bg-muted/30">
              {steps.map((s, i) => (
                <button
                  key={s}
                  onClick={() => goToStep(s)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : i < currentStepIndex
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {s === 'trim' && <Scissors className="h-3 w-3" />}
                  {s === 'filter' && <Palette className="h-3 w-3" />}
                  {s === 'music' && <Music className="h-3 w-3" />}
                  {s === 'thumbnail' && <Image className="h-3 w-3" />}
                  {s === 'caption' && <Sparkles className="h-3 w-3" />}
                  <span className="hidden sm:inline capitalize">{s}</span>
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {/* Upload Step */}
            {step === 'upload' && (
              <div className="flex flex-col items-center justify-center h-[400px] p-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-sm aspect-[9/16] rounded-2xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-4 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Upload Video</p>
                    <p className="text-sm text-muted-foreground">MP4, MOV, WebM • Max 100MB</p>
                  </div>
                </button>
              </div>
            )}

            {/* Video preview with editing */}
            {step !== 'upload' && videoUrl && (
              <div className="flex flex-col lg:flex-row gap-4 p-4">
                {/* Video preview */}
                <div className="flex-shrink-0 mx-auto">
                  <div className="relative w-[200px] aspect-[9/16] rounded-xl overflow-hidden bg-black">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-cover"
                      style={{ filter: getFilterStyle() }}
                      onLoadedMetadata={handleVideoLoaded}
                      muted={isMuted}
                      playsInline
                      loop
                    />
                    
                    {/* Play/pause overlay */}
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                        {isPlaying ? (
                          <Pause className="h-6 w-6 text-white" />
                        ) : (
                          <Play className="h-6 w-6 text-white ml-1" />
                        )}
                      </div>
                    </button>

                    {/* Mute toggle */}
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4 text-white" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-white" />
                      )}
                    </button>

                    {/* Time display */}
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/50 text-white text-xs">
                      {formatTime(currentTime)} / {formatTime(trimEnd - trimStart)}
                    </div>
                  </div>
                </div>

                {/* Controls panel */}
                <div className="flex-1 min-w-0">
                  {/* Trim controls */}
                  {step === 'trim' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <Scissors className="h-4 w-4" />
                          Trim Video
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Select the portion of your video to use (max 60 seconds)
                        </p>
                      </div>

                      {/* Trim range slider */}
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span>Start: {formatTime(trimStart)}</span>
                          <span>End: {formatTime(trimEnd)}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Start time</label>
                          <Slider
                            value={[trimStart]}
                            min={0}
                            max={Math.max(0, trimEnd - 1)}
                            step={0.1}
                            onValueChange={([value]) => setTrimStart(value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">End time</label>
                          <Slider
                            value={[trimEnd]}
                            min={trimStart + 1}
                            max={Math.min(videoDuration, trimStart + 60)}
                            step={0.1}
                            onValueChange={([value]) => setTrimEnd(value)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm">Duration</span>
                          <span className="font-medium">{formatTime(trimEnd - trimStart)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Filter controls */}
                  {step === 'filter' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-1 flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Filters
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Choose a filter for your reel
                        </p>
                      </div>

                      <ScrollArea className="h-[280px]">
                        <div className="grid grid-cols-3 gap-2 pr-4">
                          {FILTERS.map((filter) => (
                            <button
                              key={filter.id}
                              onClick={() => setSelectedFilter(filter.id)}
                              className={cn(
                                "relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all",
                                selectedFilter === filter.id
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-transparent hover:border-border"
                              )}
                            >
                              <div 
                                className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30"
                                style={{ filter: filter.css }}
                              />
                              <span className="absolute bottom-1 left-0 right-0 text-center text-xs font-medium text-white drop-shadow-md">
                                {filter.name}
                              </span>
                              {selectedFilter === filter.id && (
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Music controls */}
                  {step === 'music' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-1 flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          Add Music
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Add background music to your reel
                        </p>
                      </div>

                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2 pr-4">
                          {MUSIC_TRACKS.map((track) => (
                            <button
                              key={track.id}
                              onClick={() => setSelectedMusic(track.id)}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                                selectedMusic === track.id
                                  ? "bg-primary/10 border border-primary/30"
                                  : "bg-muted/50 hover:bg-muted"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                selectedMusic === track.id
                                  ? "bg-primary text-white"
                                  : "bg-muted-foreground/20"
                              )}>
                                <Music className="h-5 w-5" />
                              </div>
                              <span className="flex-1 text-left font-medium">
                                {track.name}
                              </span>
                              {selectedMusic === track.id && (
                                <Check className="h-5 w-5 text-primary" />
                              )}
                            </button>
                          ))}
                        </div>
                      </ScrollArea>

                      {selectedMusic !== 'none' && (
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between text-sm">
                            <span>Music Volume</span>
                            <span>{musicVolume}%</span>
                          </div>
                          <Slider
                            value={[musicVolume]}
                            min={0}
                            max={100}
                            step={5}
                            onValueChange={([value]) => setMusicVolume(value)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Thumbnail controls */}
                  {step === 'thumbnail' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-1 flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Cover Photo
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Choose a thumbnail for your reel
                        </p>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {thumbnails.map((thumb, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSelectedThumbnail(i);
                              setCustomThumbnail(null);
                            }}
                            className={cn(
                              "relative aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all",
                              selectedThumbnail === i && !customThumbnail
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-transparent hover:border-border"
                            )}
                          >
                            <img
                              src={thumb}
                              alt={`Thumbnail ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {selectedThumbnail === i && !customThumbnail && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="outline"
                          onClick={() => thumbnailInputRef.current?.click()}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Custom Thumbnail
                        </Button>
                      </div>

                      {customThumbnail && (
                        <div className="relative w-20 aspect-[9/16] rounded-lg overflow-hidden border-2 border-primary ring-2 ring-primary/20">
                          <img
                            src={customThumbnail}
                            alt="Custom thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => setCustomThumbnail(null)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Caption step */}
                  {step === 'caption' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-1 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Add Caption
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Write a caption for your reel
                        </p>
                      </div>

                      <Textarea
                        placeholder="Write something amazing..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="resize-none h-32"
                        maxLength={2200}
                      />
                      
                      <div className="text-right text-sm text-muted-foreground">
                        {caption.length}/2200
                      </div>

                      {/* Summary */}
                      <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium text-sm">Summary</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-muted-foreground">Duration:</div>
                          <div>{formatTime(trimEnd - trimStart)}</div>
                          <div className="text-muted-foreground">Filter:</div>
                          <div>{FILTERS.find(f => f.id === selectedFilter)?.name}</div>
                          <div className="text-muted-foreground">Music:</div>
                          <div>{MUSIC_TRACKS.find(m => m.id === selectedMusic)?.name}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailSelect}
            className="hidden"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
