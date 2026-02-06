import { FolderPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Collection } from '@/hooks/useLibraryItems';

interface CollectionCardProps {
  collection: Collection;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/library/collection/${collection.id}`)}
      className="group cursor-pointer relative"
    >
      {/* Hover Glow */}
      <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
      
      <div className="relative bg-card rounded-3xl border border-border overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1">
        {/* Cover */}
        <div className="aspect-square bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
          {collection.cover_image ? (
            <img
              src={collection.cover_image}
              alt={collection.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 blur-xl" />
              <FolderPlus className="h-16 w-16 text-primary/30 relative z-10" />
            </div>
          )}
          
          {/* Item Count Badge */}
          <div className="absolute top-3 right-3 px-3 py-1.5 bg-background/80 backdrop-blur-xl rounded-lg text-[10px] font-black uppercase tracking-widest text-foreground shadow-lg border border-border/50">
            {collection.item_count} items
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-black text-foreground truncate group-hover:text-primary transition-colors tracking-tight">
            {collection.name}
          </h3>
          {collection.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {collection.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
