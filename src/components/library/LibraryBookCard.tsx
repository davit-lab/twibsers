import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Book, BookOpen, Play, Clock, BadgeCheck, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { LibraryBookWithProgress } from '@/hooks/useBooks';

interface LibraryBookCardProps {
  book: LibraryBookWithProgress;
}

export default function LibraryBookCard({ book }: LibraryBookCardProps) {
  const navigate = useNavigate();
  
  const progressPercent = book.total_chapters > 0 
    ? (book.completed_count / book.total_chapters) * 100 
    : 0;

  const isComplete = book.completed_count === book.total_chapters && book.total_chapters > 0;

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const handleContinueReading = () => {
    if (book.progress?.current_chapter_id) {
      navigate(`/library/book/${book.id}/read/${book.progress.current_chapter_id}`);
    } else {
      navigate(`/library/book/${book.id}`);
    }
  };

  return (
    <div className="flex gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-all">
      {/* Cover */}
      <Link 
        to={`/library/book/${book.id}`}
        className="w-20 sm:w-24 flex-shrink-0"
      >
        <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg overflow-hidden">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Book className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Link 
          to={`/library/book/${book.id}`}
          className="font-semibold hover:text-primary transition-colors line-clamp-1"
        >
          {book.title}
        </Link>

        {/* Author */}
        {book.author && (
          <div className="flex items-center gap-1.5 mt-1">
            <Avatar className="h-4 w-4">
              <AvatarImage src={book.author.avatar_url || undefined} />
              <AvatarFallback className="text-[8px] bg-gradient-to-br from-primary to-accent text-white">
                {getInitials(book.author.display_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">
              {book.author.display_name}
            </span>
            {book.author.is_verified && (
              <BadgeCheck className="h-3 w-3 text-verified flex-shrink-0" />
            )}
          </div>
        )}

        {/* Progress Section */}
        <div className="mt-3 space-y-2 flex-1">
          {isComplete ? (
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Completed</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {book.completed_count} of {book.total_chapters} chapters
                </span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </>
          )}

          {/* Current chapter / Last read */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {book.current_chapter_title && !isComplete && (
              <>
                <BookOpen className="h-3 w-3" />
                <span className="truncate">Reading: {book.current_chapter_title}</span>
              </>
            )}
            {book.progress?.last_read_at && (
              <span className="flex items-center gap-1 ml-auto flex-shrink-0">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(book.progress.last_read_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {/* Continue Reading Button */}
        <div className="mt-3">
          <Button 
            size="sm" 
            onClick={handleContinueReading}
            className="w-full sm:w-auto"
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            {isComplete ? 'Read Again' : book.progress ? 'Continue' : 'Start Reading'}
          </Button>
        </div>
      </div>
    </div>
  );
}
