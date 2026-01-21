import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useStories } from '@/hooks/useStories';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Film, FileText, ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CreateType = 'story' | 'post' | 'reel';

export default function CreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const { uploadStory } = useStories();
  const { toast } = useToast();
  const [createType, setCreateType] = useState<CreateType | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
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

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !createType) return;

    setUploading(true);
    try {
      if (createType === 'story') {
        await uploadStory(selectedFile, caption || undefined);
        toast({
          title: 'Story posted! ✨',
          description: 'Your story is now live.',
        });
      } else {
        // For posts and reels, we'd need to implement those hooks
        toast({
          title: 'Coming soon!',
          description: `${createType === 'post' ? 'Post' : 'Reel'} creation is coming soon.`,
        });
      }
      handleClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setCreateType(null);
    setSelectedFile(null);
    setCaption('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  };

  const createOptions = [
    { type: 'story' as CreateType, icon: Camera, label: 'Story', description: 'Share a moment (24h)' },
    { type: 'post' as CreateType, icon: ImageIcon, label: 'Post', description: 'Share to your feed' },
    { type: 'reel' as CreateType, icon: Film, label: 'Reel', description: 'Create a short video' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {createType ? `Create ${createType.charAt(0).toUpperCase() + createType.slice(1)}` : 'Create'}
          </DialogTitle>
        </DialogHeader>

        {!createType ? (
          <div className="grid grid-cols-3 gap-3 py-4">
            {createOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => setCreateType(option.type)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <option.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground text-center">{option.description}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {!selectedFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Click to select a file</span>
              </button>
            ) : (
              <div className="relative">
                {selectedFile.type.startsWith('video/') ? (
                  <video
                    src={previewUrl || undefined}
                    className="w-full aspect-video rounded-xl object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={previewUrl || undefined}
                    alt="Preview"
                    className="w-full aspect-video rounded-xl object-cover"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedFile(null);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <Textarea
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="resize-none"
              rows={3}
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCreateType(null)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || uploading}
                className="flex-1 btn-gradient"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Share'
                )}
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}
