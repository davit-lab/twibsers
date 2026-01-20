import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Book, BookOpen, Eye, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Book as BookType } from '@/hooks/useBooks';

interface BookCardProps {
  book: BookType;
  showStatus?: boolean;
}

export default function BookCard({ book, showStatus = false }: BookCardProps) {
  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <Link
      to={`/library/book/${book.id}`}
      className="group block bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg"
    >
      {/* Cover Image */}
      <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-accent/20 relative overflow-hidden">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Book className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
        
        {showStatus && book.status !== 'published' && (
          <Badge
            variant={book.status === 'draft' ? 'secondary' : 'outline'}
            className="absolute top-2 right-2"
          >
            {book.status}
          </Badge>
        )}

        {book.genre && (
          <Badge variant="secondary" className="absolute bottom-2 left-2">
            {book.genre}
          </Badge>
        )}
      </div>

      {/* Book Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </h3>

        {book.author && (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={book.author.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary to-accent text-white">
                {getInitials(book.author.display_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">
              {book.author.display_name}
            </span>
            {book.author.is_verified && (
              <BadgeCheck className="h-3.5 w-3.5 text-verified flex-shrink-0" />
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {book.chapter_count || 0} chapters
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {book.view_count}
          </span>
        </div>

        {book.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {book.description}
          </p>
        )}
      </div>
    </Link>
  );
}
