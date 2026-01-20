import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBook, useBookActions } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  BookOpen,
  CheckCircle2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChapterReader() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { book, chapters, progress } = useBook(bookId);
  const { updateProgress } = useBookActions();
  const [tocOpen, setTocOpen] = useState(false);

  const currentChapter = chapters.find((c) => c.id === chapterId);
  const currentIndex = chapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const completedChapters = progress?.completed_chapters || [];
  const isCompleted = chapterId ? completedChapters.includes(chapterId) : false;
  const progressPercent = chapters.length > 0 
    ? ((currentIndex + 1) / chapters.length) * 100 
    : 0;

  // Update reading progress
  useEffect(() => {
    if (user && bookId && chapterId) {
      updateProgress(bookId, chapterId);
    }
  }, [user, bookId, chapterId, updateProgress]);

  const handleMarkComplete = useCallback(async () => {
    if (!bookId || !chapterId) return;
    await updateProgress(bookId, chapterId, undefined, chapterId);
  }, [bookId, chapterId, updateProgress]);

  const handleNavigate = (chapter: typeof prevChapter) => {
    if (!chapter) return;
    navigate(`/library/book/${bookId}/read/${chapter.id}`);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && prevChapter) {
        handleNavigate(prevChapter);
      } else if (e.key === 'ArrowRight' && nextChapter) {
        handleNavigate(nextChapter);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevChapter, nextChapter]);

  if (!currentChapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">Chapter not found</h2>
          <Button asChild>
            <Link to={`/library/book/${bookId}`}>Back to Book</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/library/book/${bookId}`}>
                <X className="h-5 w-5" />
              </Link>
            </Button>
            
            <Sheet open={tocOpen} onOpenChange={setTocOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>{book?.title}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-1">
                  {chapters.map((chapter, index) => {
                    const isComplete = completedChapters.includes(chapter.id);
                    const isCurrent = chapter.id === chapterId;

                    return (
                      <button
                        key={chapter.id}
                        onClick={() => {
                          navigate(`/library/book/${bookId}/read/${chapter.id}`);
                          setTocOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                          isCurrent 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted"
                        )}
                      >
                        <span className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                          isComplete && !isCurrent
                            ? "bg-primary text-primary-foreground"
                            : isCurrent
                            ? "bg-primary-foreground text-primary"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {isComplete ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                        </span>
                        <span className="flex-1 truncate text-sm">{chapter.title}</span>
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex-1 text-center min-w-0">
            <h1 className="font-medium truncate text-sm">{currentChapter.title}</h1>
            <p className="text-xs text-muted-foreground">
              Chapter {currentIndex + 1} of {chapters.length}
            </p>
          </div>

          <div className="w-20 text-right">
            <span className="text-xs text-muted-foreground">
              {currentChapter.word_count.toLocaleString()} words
            </span>
          </div>
        </div>
        <Progress value={progressPercent} className="h-0.5" />
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-2xl md:text-3xl font-bold mb-8">{currentChapter.title}</h1>
          <div className="whitespace-pre-wrap leading-relaxed">
            {currentChapter.content || (
              <p className="text-muted-foreground italic">This chapter has no content yet.</p>
            )}
          </div>
        </article>

        {/* Chapter Actions */}
        <div className="mt-12 space-y-6">
          {user && !isCompleted && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleMarkComplete}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Complete
            </Button>
          )}

          {isCompleted && (
            <div className="text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 inline-block mr-1 text-primary" />
              Chapter completed
            </div>
          )}
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => handleNavigate(prevChapter)}
            disabled={!prevChapter}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {chapters.length}
          </span>

          <Button
            variant="ghost"
            onClick={() => handleNavigate(nextChapter)}
            disabled={!nextChapter}
            className="gap-2"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
