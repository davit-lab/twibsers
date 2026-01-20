import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useBook, useBookActions } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Book,
  BookOpen,
  Eye,
  Calendar,
  BadgeCheck,
  Heart,
  HeartOff,
  Play,
  Edit,
  ChevronRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function BookDetail() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { user, profile: currentProfile } = useAuth();
  const { book, chapters, progress, isInLibrary, isLoading, refetch, setIsInLibrary } = useBook(bookId);
  const { addToLibrary, removeFromLibrary } = useBookActions();
  const [isUpdatingLibrary, setIsUpdatingLibrary] = useState(false);

  const isAuthor = user && book?.author_id === user.id;
  const completedCount = progress?.completed_chapters?.length || 0;
  const totalChapters = chapters.length;
  const progressPercent = totalChapters > 0 ? (completedCount / totalChapters) * 100 : 0;

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const handleToggleLibrary = async () => {
    if (!user || !bookId) return;

    setIsUpdatingLibrary(true);
    if (isInLibrary) {
      const success = await removeFromLibrary(bookId);
      if (success) setIsInLibrary(false);
    } else {
      const success = await addToLibrary(bookId);
      if (success) setIsInLibrary(true);
    }
    setIsUpdatingLibrary(false);
  };

  const handleStartReading = () => {
    if (chapters.length === 0) return;
    
    const chapterToRead = progress?.current_chapter_id 
      ? chapters.find((c) => c.id === progress.current_chapter_id) 
      : chapters[0];
    
    if (chapterToRead) {
      navigate(`/library/book/${bookId}/read/${chapterToRead.id}`);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="w-full md:w-64 aspect-[3/4] rounded-xl" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!book) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 md:p-6 text-center py-16">
          <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">Book not found</h2>
          <p className="text-muted-foreground mb-4">
            This book may have been removed or you don't have access.
          </p>
          <Button asChild>
            <Link to="/library">Back to Library</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Book Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Cover */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl overflow-hidden">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Book className="h-20 w-20 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{book.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  {book.genre && <Badge variant="secondary">{book.genre}</Badge>}
                  {book.status !== 'published' && (
                    <Badge variant="outline">{book.status}</Badge>
                  )}
                </div>
              </div>
              
              {isAuthor && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/library/book/${bookId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}
            </div>

            {/* Author */}
            {book.author && (
              <Link
                to={`/profile/${book.author.username}`}
                className="flex items-center gap-3 hover:bg-muted p-2 -m-2 rounded-lg transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={book.author.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                    {getInitials(book.author.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{book.author.display_name}</span>
                    {book.author.is_verified && (
                      <BadgeCheck className="h-4 w-4 text-verified" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">@{book.author.username}</span>
                </div>
              </Link>
            )}

            {book.description && (
              <p className="text-muted-foreground">{book.description}</p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {totalChapters} chapters
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {book.view_count} views
              </span>
              {book.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(book.published_at), 'MMM d, yyyy')}
                </span>
              )}
            </div>

            {/* Reading Progress */}
            {user && progress && totalChapters > 0 && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reading progress</span>
                  <span className="font-medium">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {completedCount} of {totalChapters} chapters completed
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              {totalChapters > 0 && (
                <Button onClick={handleStartReading}>
                  <Play className="h-4 w-4 mr-2" />
                  {progress ? 'Continue Reading' : 'Start Reading'}
                </Button>
              )}
              
              {user && !isAuthor && (
                <Button
                  variant="outline"
                  onClick={handleToggleLibrary}
                  disabled={isUpdatingLibrary}
                >
                  {isInLibrary ? (
                    <>
                      <HeartOff className="h-4 w-4 mr-2" />
                      Remove from Library
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Add to Library
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Chapters</h2>
          
          {chapters.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-lg">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No chapters yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chapters.map((chapter, index) => {
                const isCompleted = progress?.completed_chapters?.includes(chapter.id);
                const isCurrent = progress?.current_chapter_id === chapter.id;

                return (
                  <Link
                    key={chapter.id}
                    to={`/library/book/${bookId}/read/${chapter.id}`}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group",
                      isCurrent && "border-primary bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      isCompleted 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                        {chapter.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{chapter.word_count.toLocaleString()} words</span>
                        {isCurrent && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Reading
                          </Badge>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
