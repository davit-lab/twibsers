import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useBooksByAuthor } from '@/hooks/useBooksByAuthor';
import { useMyBooks, useUserLibrary } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import AuthorBooksSection from '@/components/library/AuthorBooksSection';
import LibraryBookCard from '@/components/library/LibraryBookCard';
import CreateBookDialog from '@/components/library/CreateBookDialog';
import ReadingStreakCard from '@/components/library/ReadingStreakCard';
import BookCard from '@/components/library/BookCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Search, Library as LibraryIcon, PenTool, Heart, Flame, Plus, X } from 'lucide-react';

export default function Library() {
  const { user, profile } = useAuth();
  const { authorGroups, isLoading: loadingBrowse } = useBooksByAuthor();
  const { books: myBooks, isLoading: loadingMyBooks, refetch: refetchMyBooks } = useMyBooks();
  const { books: libraryBooks, isLoading: loadingLibrary } = useUserLibrary();
  const [searchQuery, setSearchQuery] = useState('');

  const isVerified = profile?.is_verified;

  // Filter author groups by search
  const filteredGroups = authorGroups.filter((group) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      group.author.display_name.toLowerCase().includes(query) ||
      group.author.username.toLowerCase().includes(query) ||
      group.books.some((book) => book.title.toLowerCase().includes(query))
    );
  });

  const filteredMyBooks = myBooks.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLibrary = libraryBooks.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Books currently being read
  const currentlyReading = filteredLibrary.filter(
    (book) => book.progress && book.completed_count < book.total_chapters
  );

  // Not started yet
  const notStarted = filteredLibrary.filter(
    (book) => !book.progress || book.completed_count === 0
  );

  // Completed books
  const completedBooks = filteredLibrary.filter(
    (book) => book.completed_count === book.total_chapters && book.total_chapters > 0
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Search Bar - Prominent at top */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="search books authors or books"
            className="pl-12 pr-12 h-12 text-base bg-muted/50 border-border/50 rounded-xl"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          {/* Create Button */}
          {isVerified && (
            <div className="absolute right-14 top-1/2 -translate-y-1/2">
              <CreateBookDialog onBookCreated={refetchMyBooks}>
                <Button size="icon" className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90">
                  <Plus className="h-5 w-5" />
                </Button>
              </CreateBookDialog>
            </div>
          )}
        </div>

        <Tabs defaultValue={user ? 'my-library' : 'browse'} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-lg">
            {user && (
              <TabsTrigger value="my-library" className="gap-2 rounded-md">
                <Heart className="h-4 w-4" />
                My Library
                {libraryBooks.length > 0 && (
                  <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                    {libraryBooks.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="browse" className="gap-2 rounded-md">
              <BookOpen className="h-4 w-4" />
              Browse
            </TabsTrigger>
            {user && (
              <TabsTrigger value="streak" className="gap-2 rounded-md">
                <Flame className="h-4 w-4" />
                Streak
              </TabsTrigger>
            )}
            {isVerified && (
              <TabsTrigger value="my-books" className="gap-2 rounded-md">
                <PenTool className="h-4 w-4" />
                My Books
              </TabsTrigger>
            )}
          </TabsList>

          {/* My Library - Saved Books with Progress */}
          {user && (
            <TabsContent value="my-library">
              {loadingLibrary ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 p-4 bg-card rounded-xl border">
                      <Skeleton className="w-24 aspect-[3/4] rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-2 w-full" />
                        <Skeleton className="h-8 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredLibrary.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-1">Your library is empty</h3>
                  <p className="text-muted-foreground mb-4">
                    Browse books and add them to your library to track your reading progress.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {currentlyReading.length > 0 && (
                    <section>
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
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
                      <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
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
                      <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
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
            </TabsContent>
          )}

          {/* Reading Streak Tab */}
          {user && (
            <TabsContent value="streak">
              <div className="max-w-md">
                <ReadingStreakCard />
              </div>
            </TabsContent>
          )}

          {/* Browse Published Books - Grouped by Author */}
          <TabsContent value="browse">
            {loadingBrowse ? (
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <div className="flex gap-4 overflow-hidden">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <div key={j} className="w-[140px] flex-shrink-0 space-y-2">
                          <Skeleton className="aspect-[3/4] rounded-lg" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-16">
                <LibraryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-1">No books found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Be the first to publish a book!'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredGroups.map((group) => (
                  <AuthorBooksSection key={group.author.user_id} authorGroup={group} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Books (for verified authors) */}
          {isVerified && (
            <TabsContent value="my-books">
              {loadingMyBooks ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[3/4] rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredMyBooks.length === 0 ? (
                <div className="text-center py-16">
                  <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-1">No books yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start writing your first book today
                  </p>
                  <CreateBookDialog onBookCreated={refetchMyBooks} />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredMyBooks.map((book) => (
                    <BookCard key={book.id} book={book} showStatus />
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Info for non-verified users */}
        {!isVerified && (
          <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
            <h3 className="font-medium mb-1">Want to publish your own books?</h3>
            <p className="text-sm text-muted-foreground">
              Get verified to unlock the ability to create and publish books in the Digital Library.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
