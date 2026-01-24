import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useBook, useBookActions, useBooks } from '@/hooks/useBooks';
import { useBookPurchaseStatus, useAuthorStripeStatus } from '@/hooks/useBookPurchase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import BookPurchaseButton from '@/components/library/BookPurchaseButton';
import FullScreenPdfViewer from '@/components/library/FullScreenPdfViewer';
import BookCard from '@/components/library/BookCard';
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
  FileText,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function BookDetail() {
  const { bookId } = useParams<{ bookId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile: currentProfile } = useAuth();
  const { book, chapters, progress, isInLibrary, isLoading, refetch, setIsInLibrary } = useBook(bookId);
  const { addToLibrary, removeFromLibrary } = useBookActions();
  const { data: purchaseStatus } = useBookPurchaseStatus(bookId);
  const { data: authorHasStripe } = useAuthorStripeStatus(book?.author_id);
  const { books: moreBooks, isLoading: loadingMoreBooks } = useBooks({ status: 'published' });
  const [isUpdatingLibrary, setIsUpdatingLibrary] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  const isAuthor = user && book?.author_id === user.id;
  const completedCount = progress?.completed_chapters?.length || 0;
  const totalChapters = chapters.length;
  const progressPercent = totalChapters > 0 ? (completedCount / totalChapters) * 100 : 0;

  // Check for purchase success/cancel from URL
  useEffect(() => {
    if (searchParams.get('purchased') === 'true') {
      toast({
        title: 'Purchase successful!',
        description: 'You now have access to this book.',
      });
      refetch();
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        variant: 'destructive',
        title: 'Purchase canceled',
        description: "You can try again when you're ready.",
      });
    }
  }, [searchParams]);

  // Book pricing info
  const isFree = book?.is_free || !book?.price || book?.price === 0;
  const hasPdf = !!book?.pdf_url;
  const hasAccess = isAuthor || isFree || purchaseStatus?.hasPurchased;
  const priceDisplay = isFree ? 'Free' : `$${((book?.price || 0) / 100).toFixed(2)}`;

  // Get related books (same genre or by same author, excluding current book)
  const relatedBooks = moreBooks
    .filter((b) => b.id !== bookId)
    .slice(0, 8);

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

  const handleReadPdf = () => {
    setShowPdfViewer(true);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="w-full md:w-72 aspect-[3/4] rounded-2xl" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-12 w-48" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!book) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto p-4 md:p-6 text-center py-16">
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

  // Full Screen PDF Viewer
  if (showPdfViewer && hasPdf && hasAccess) {
    return (
      <FullScreenPdfViewer
        bookId={bookId!}
        bookTitle={book.title}
        onClose={() => setShowPdfViewer(false)}
      />
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/library')}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Button>

        {/* Book Header - Redesigned Layout */}
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          {/* Book Cover with Border */}
          <div className="w-full md:w-72 flex-shrink-0">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border-4 border-primary/30 shadow-xl bg-gradient-to-br from-primary/10 to-accent/10">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Book className="h-24 w-24 text-muted-foreground/30" />
                </div>
              )}
            </div>
            
            {/* Edit Button for Author */}
            {isAuthor && (
              <Button variant="outline" className="w-full mt-4 gap-2" asChild>
                <Link to={`/library/book/${bookId}/edit`}>
                  <Edit className="h-4 w-4" />
                  Edit Book
                </Link>
              </Button>
            )}
          </div>

          {/* Book Info */}
          <div className="flex-1 space-y-5">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {book.title}
            </h1>

            {/* Author */}
            {book.author && (
              <Link
                to={`/profile/${book.author.username}`}
                className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-10 w-10 border-2 border-border">
                  <AvatarImage src={book.author.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                    {getInitials(book.author.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{book.author.display_name}</span>
                    {book.author.is_verified && (
                      <BadgeCheck className="h-4 w-4 text-verified" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">@{book.author.username}</span>
                </div>
              </Link>
            )}

            {/* Info Card - Purple themed like reference */}
            <div className="bg-primary rounded-2xl p-5 text-primary-foreground space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">book detail page</span>
                <span className="font-medium">
                  book pages: {hasPdf ? 'PDF' : `${totalChapters} chapters`}
                </span>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">about this book</h3>
                <p className="text-sm opacity-90">
                  {book.description || 'No description available for this book.'}
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm opacity-80 pt-2">
                {book.genre && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {book.genre}
                  </Badge>
                )}
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
            </div>

            {/* Reading Progress */}
            {user && progress && totalChapters > 0 && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-xl border">
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

            {/* Action Button - Buy Now styled */}
            <div className="flex flex-wrap items-center gap-4">
              {hasPdf && hasAccess ? (
                <Button 
                  size="lg" 
                  onClick={handleReadPdf}
                  className="bg-primary/80 hover:bg-primary rounded-full px-8"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Read Book
                </Button>
              ) : hasPdf && !hasAccess ? (
                <BookPurchaseButton
                  bookId={bookId!}
                  price={book.price || 0}
                  isFree={isFree}
                  isAuthor={!!isAuthor}
                  hasPdf={hasPdf}
                  authorHasStripe={authorHasStripe}
                  onReadPdf={handleReadPdf}
                />
              ) : totalChapters > 0 && hasAccess ? (
                <Button 
                  size="lg" 
                  onClick={handleStartReading}
                  className="bg-primary/80 hover:bg-primary rounded-full px-8"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {progress ? 'Continue Reading' : 'Start Reading'}
                </Button>
              ) : !hasAccess && !isFree ? (
                <BookPurchaseButton
                  bookId={bookId!}
                  price={book.price || 0}
                  isFree={false}
                  isAuthor={false}
                  hasPdf={false}
                  authorHasStripe={authorHasStripe}
                />
              ) : null}

              {user && !isAuthor && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleToggleLibrary}
                  disabled={isUpdatingLibrary}
                  className="rounded-full"
                >
                  {isInLibrary ? (
                    <>
                      <HeartOff className="h-5 w-5 mr-2" />
                      Remove
                    </>
                  ) : (
                    <>
                      <Heart className="h-5 w-5 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              )}

              {/* Price Display */}
              <span className={cn(
                "text-xl font-bold",
                isFree ? "text-green-500" : "text-primary"
              )}>
                {priceDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        {totalChapters > 0 && (
          <div className="space-y-4 mb-10">
            <h2 className="text-xl font-semibold">Chapters</h2>
            
            <div className="space-y-2">
              {chapters.map((chapter, index) => {
                const isCompleted = progress?.completed_chapters?.includes(chapter.id);
                const isCurrent = progress?.current_chapter_id === chapter.id;

                return (
                  <Link
                    key={chapter.id}
                    to={`/library/book/${bookId}/read/${chapter.id}`}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group',
                      isCurrent && 'border-primary bg-primary/5'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                        isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
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
          </div>
        )}

        {/* See More Books Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <Link 
              to="/library"
              className="inline-flex items-center justify-center w-full max-w-2xl py-4 px-8 bg-primary/20 hover:bg-primary/30 text-primary font-semibold text-xl rounded-xl transition-colors"
            >
              see more books
            </Link>
          </div>

          {/* Related Books Scroll */}
          {relatedBooks.length > 0 && (
            <ScrollArea className="w-full whitespace-nowrap mt-8">
              <div className="flex gap-4 pb-4">
                {relatedBooks.map((relatedBook) => (
                  <div key={relatedBook.id} className="w-[160px] flex-shrink-0">
                    <BookCard book={relatedBook} />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
