import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useBooksByAuthor } from '@/hooks/useBooksByAuthor';
import { useMyBooks, useUserLibrary } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import AuthorBooksSection from '@/components/library/AuthorBooksSection';
import LibraryBookCard from '@/components/library/LibraryBookCard';
import CreateBookDialog from '@/components/library/CreateBookDialog';
import ReadingStreakCard from '@/components/library/ReadingStreakCard';
import BookCard from '@/components/library/BookCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Search, Library as LibraryIcon, PenTool, Heart, Flame, Plus, X, Sparkles, TrendingUp, Clock, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabValue = 'my-library' | 'browse' | 'streak' | 'my-books';
type SortOption = 'recent' | 'popular';

export default function Library() {
  const { user, profile } = useAuth();
  const { authorGroups, isLoading: loadingBrowse } = useBooksByAuthor();
  const { books: myBooks, isLoading: loadingMyBooks, refetch: refetchMyBooks } = useMyBooks();
  const { books: libraryBooks, isLoading: loadingLibrary } = useUserLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>(user ? 'my-library' : 'browse');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const { data: isPremium } = usePremiumStatus(user?.id);

  const isVerified = profile?.is_verified;
  const canCreateBooks = isVerified || isPremium;

  // Filter author groups by search
  const filteredGroups = useMemo(() => {
    return authorGroups.filter((group) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        group.author.display_name.toLowerCase().includes(query) ||
        group.author.username.toLowerCase().includes(query) ||
        group.books.some((book) => book.title.toLowerCase().includes(query))
      );
    });
  }, [authorGroups, searchQuery]);

  const filteredMyBooks = useMemo(() => {
    return myBooks.filter((book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [myBooks, searchQuery]);

  const filteredLibrary = useMemo(() => {
    return libraryBooks.filter((book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [libraryBooks, searchQuery]);

  // Books categorized
  const currentlyReading = filteredLibrary.filter(
    (book) => book.progress && book.completed_count < book.total_chapters
  );
  const notStarted = filteredLibrary.filter(
    (book) => !book.progress || book.completed_count === 0
  );
  const completedBooks = filteredLibrary.filter(
    (book) => book.completed_count === book.total_chapters && book.total_chapters > 0
  );

  const tabs = [
    { value: 'my-library', label: 'My Library', icon: Heart, requiresAuth: true, count: libraryBooks.length },
    { value: 'browse', label: 'Browse', icon: BookOpen, requiresAuth: false },
    { value: 'streak', label: 'Streak', icon: Flame, requiresAuth: true },
    { value: 'my-books', label: 'My Books', icon: PenTool, requiresAuth: true, requiresCreate: true },
  ];

  const sortOptions = [
    { value: 'recent', label: 'Recent', icon: Clock },
    { value: 'popular', label: 'Popular', icon: TrendingUp },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
        {/* Ambient Background Effects */}
        <div className="orb-primary w-[600px] h-[600px] top-[-200px] right-[-100px]" />
        <div className="orb-accent w-[500px] h-[500px] bottom-[10%] left-[-200px]" />

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8 relative">
          {/* Header - Premium Style */}
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
                  <BookOpen className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                    <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                      Library
                    </span>
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base font-medium">
                    Discover and read amazing books from our community
                  </p>
                </div>
              </div>

              {canCreateBooks && (
                <CreateBookDialog onBookCreated={refetchMyBooks}>
                  <Button className="btn-gradient shadow-xl shadow-primary/30 font-bold px-6 rounded-xl">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Book
                  </Button>
                </CreateBookDialog>
              )}
            </div>
          </div>

          {/* Search Bar - Premium Glass */}
          <div className="relative max-w-2xl">
            <div className="glass-card rounded-2xl p-1.5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books, authors..."
                  className="pl-12 pr-12 h-14 text-base bg-muted/50 border-transparent focus:bg-background focus:border-primary/30 rounded-xl font-medium"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs - Pill Style */}
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              if (tab.requiresAuth && !user) return null;
              if (tab.requiresCreate && !canCreateBooks) return null;
              
              const isActive = activeTab === tab.value;
              
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as TabValue)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-xl shadow-primary/30"
                      : "glass-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      "ml-1.5 text-xs px-2.5 py-1 rounded-lg font-bold",
                      isActive ? "bg-white/20" : "bg-primary/10 text-primary"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="min-h-[400px]">
            {/* My Library Tab */}
            {activeTab === 'my-library' && user && (
              <>
                {loadingLibrary ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="glass-card flex gap-4 p-5 rounded-2xl">
                        <Skeleton className="w-28 aspect-[3/4] rounded-xl" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredLibrary.length === 0 ? (
                  <div className="glass-card text-center py-20 px-8 rounded-3xl">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Heart className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="font-black text-2xl mb-3">Your library is empty</h3>
                    <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                      Browse books and add them to your library to track your reading progress.
                    </p>
                    <Button onClick={() => setActiveTab('browse')} className="btn-gradient font-bold px-8 rounded-xl shadow-lg shadow-primary/30">
                      <Sparkles className="h-5 w-5 mr-2" />
                      Browse Books
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {currentlyReading.length > 0 && (
                      <section>
                        <h2 className="text-xl font-black mb-5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          Continue Reading
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                          {currentlyReading.map((book) => (
                            <LibraryBookCard key={book.id} book={book} />
                          ))}
                        </div>
                      </section>
                    )}

                    {notStarted.length > 0 && (
                      <section>
                        <h2 className="text-xl font-black mb-5 text-muted-foreground flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          </div>
                          Not Started Yet
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                          {notStarted.map((book) => (
                            <LibraryBookCard key={book.id} book={book} />
                          ))}
                        </div>
                      </section>
                    )}

                    {completedBooks.length > 0 && (
                      <section>
                        <h2 className="text-xl font-black mb-5 text-muted-foreground flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                            <BadgeCheck className="h-5 w-5 text-accent" />
                          </div>
                          Completed
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                          {completedBooks.map((book) => (
                            <LibraryBookCard key={book.id} book={book} />
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Reading Streak Tab */}
            {activeTab === 'streak' && user && (
              <div className="max-w-md">
                <div className="glass-card rounded-3xl p-1">
                  <ReadingStreakCard />
                </div>
              </div>
            )}

            {/* Browse Tab */}
            {activeTab === 'browse' && (
              <>
                {/* Sort Options */}
                <div className="flex items-center gap-2 mb-8">
                  <div className="glass-card flex items-center p-1.5 rounded-xl gap-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value as SortOption)}
                        className={cn(
                          "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
                          sortBy === option.value
                            ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingBrowse ? (
                  <div className="space-y-10">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-5">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-14 w-14 rounded-full" />
                          <Skeleton className="h-6 w-48" />
                        </div>
                        <div className="flex gap-5 overflow-hidden">
                          {[1, 2, 3, 4, 5].map((j) => (
                            <div key={j} className="w-[160px] flex-shrink-0 space-y-3">
                              <Skeleton className="aspect-[3/4] rounded-2xl" />
                              <Skeleton className="h-4 w-3/4" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="glass-card text-center py-20 px-8 rounded-3xl">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <LibraryIcon className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="font-black text-2xl mb-3">No books found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Try a different search term' : 'Be the first to publish a book!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {filteredGroups.map((group) => (
                      <AuthorBooksSection key={group.author.user_id} authorGroup={group} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* My Books Tab */}
            {activeTab === 'my-books' && canCreateBooks && (
              <>
                {loadingMyBooks ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="aspect-[3/4] rounded-2xl" />
                        <Skeleton className="h-5 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : filteredMyBooks.length === 0 ? (
                  <div className="glass-card text-center py-20 px-8 rounded-3xl">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <PenTool className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="font-black text-2xl mb-3">No books yet</h3>
                    <p className="text-muted-foreground mb-8">Start writing your first book today</p>
                    <CreateBookDialog onBookCreated={refetchMyBooks}>
                      <Button className="btn-gradient font-bold px-8 rounded-xl shadow-lg shadow-primary/30">
                        <Plus className="h-5 w-5 mr-2" />
                        Create Book
                      </Button>
                    </CreateBookDialog>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredMyBooks.map((book) => (
                      <BookCard key={book.id} book={book} showStatus />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Info for non-verified users */}
          {!canCreateBooks && user && (
            <div className="glass-card p-6 rounded-3xl">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <PenTool className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-lg mb-2">Want to publish your own books?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Get verified or upgrade to premium to unlock the ability to create and publish books in the Digital Library.
                  </p>
                  <Button variant="outline" className="mt-5 rounded-xl font-bold border-primary/30 hover:bg-primary/10" asChild>
                    <Link to="/pricing">
                      <Sparkles className="h-4 w-4 mr-2" />
                      View Plans
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
