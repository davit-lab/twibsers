import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BadgeCheck, Book, Star, ChevronRight } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { AuthorWithBooks } from '@/hooks/useBooksByAuthor';
import { cn } from '@/lib/utils';

interface AuthorBooksSectionProps {
  authorGroup: AuthorWithBooks;
}

export default function AuthorBooksSection({ authorGroup }: AuthorBooksSectionProps) {
  const { author, books } = authorGroup;

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <div className="space-y-4">
      {/* Author Header */}
      <div className="flex items-center justify-between">
        <Link 
          to={`/profile/${author.username}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10 border-2 border-border">
            <AvatarImage src={author.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
              {getInitials(author.display_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{author.display_name}'s library</span>
              {author.is_verified && (
                <BadgeCheck className="h-4 w-4 text-verified" />
              )}
            </div>
          </div>
        </Link>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs gap-1 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
          asChild
        >
          <Link to={`/profile/${author.username}`}>
            view full library
            <ChevronRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>

      {/* Horizontal Scrolling Books */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {books.map((book) => (
            <BookMiniCard key={book.id} book={book} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-2" />
      </ScrollArea>
    </div>
  );
}

interface BookMiniCardProps {
  book: AuthorWithBooks['books'][0];
}

function BookMiniCard({ book }: BookMiniCardProps) {
  const isFree = book.is_free || !book.price || book.price === 0;
  const priceDisplay = isFree ? 'Free' : `$${((book.price || 0) / 100).toFixed(2)}`;

  return (
    <Link
      to={`/library/book/${book.id}`}
      className="group flex-shrink-0 w-[140px] space-y-2"
    >
      {/* Book Cover */}
      <div className="aspect-[3/4] bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden border border-border group-hover:border-primary/50 transition-all relative">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <Book className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="space-y-1">
        <h4 className="font-medium text-sm line-clamp-2 whitespace-normal group-hover:text-primary transition-colors">
          {book.title}
        </h4>
        
        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span>5.0 reviews</span>
          </div>
        </div>
        
        {/* Price & Details */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] px-2 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
          >
            details
          </Button>
          <span className={cn(
            "text-xs font-semibold",
            isFree ? "text-green-500" : "text-primary"
          )}>
            {priceDisplay}
          </span>
        </div>
      </div>
    </Link>
  );
}
