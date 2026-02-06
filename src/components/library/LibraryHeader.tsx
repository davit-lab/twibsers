import { Button } from '@/components/ui/button';
import { Plus, FolderPlus, Library } from 'lucide-react';
import UploadItemModal from './UploadItemModal';

interface LibraryHeaderProps {
  user: { id: string } | null;
  onCreateCollection: () => void;
  onUploadSuccess: () => void;
}

export default function LibraryHeader({ user, onCreateCollection, onUploadSuccess }: LibraryHeaderProps) {
  return (
    <div className="relative">
      {/* Decorative blob */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
      
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                <Library className="h-6 w-6" />
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-none">
                The <span className="text-primary">Archive</span>
              </h1>
            </div>
            <p className="text-lg font-medium text-muted-foreground max-w-lg">
              Discover manuscripts curated by the community. Read, annotate, and share.
            </p>
          </div>

          {user && (
            <div className="hidden md:flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={onCreateCollection}
                className="border-2 hover:border-primary/50 font-black text-xs uppercase tracking-widest"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Collection
              </Button>
              <UploadItemModal onSuccess={onUploadSuccess}>
                <Button className="font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </UploadItemModal>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
