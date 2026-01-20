import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useBooks, useMyBooks, useUserLibrary } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import BookCard from '@/components/library/BookCard';
import LibraryBookCard from '@/components/library/LibraryBookCard';
import CreateBookDialog from '@/components/library/CreateBookDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Search, Library as LibraryIcon, PenTool, Heart } from 'lucide-react';

export default function Library() {
  const { user, profile } = useAuth();
  const { books: publishedBooks, isLoading: loadingPublished } = useBooks({ status: 'published' });
  const { books: myBooks, isLoading: loadingMyBooks, refetch: refetchMyBooks } = useMyBooks();
  const { books: libraryBooks, isLoading: loadingLibrary, refetch: refetchLibrary } = useUserLibrary();
  const [searchQuery, setSearchQuery] = useState('');

  const isVerified = profile?.is_verified;

  const filteredPublished = publishedBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMyBooks = myBooks.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLibrary = libraryBooks.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Books currently being read (have progress but not complete)
  const currentlyReading = filteredLibrary.filter(
    (book) => book.progress && book.completed_count < book.total_chapters
  );

  // Completed books
  const completedBooks = filteredLibrary.filter(
    (book) => book.completed_count === book.total_chapters && book.total_chapters > 0
  );

  // Books not started yet
  const notStarted = filteredLibrary.filter(
    (book) => !book.progress || book.completed_count === 0
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <LibraryIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Digital Library</h1>
              <p className="text-muted-foreground text-sm">
                Discover and read books from verified authors
              </p>
            </div>
          </div>

          {isVerified && <CreateBookDialog onBookCreated={refetchMyBooks} />}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books or authors..."
            className="pl-10"
          />
        </div>

        <Tabs defaultValue={user ? "my-library" : "browse"} className="space-y-6">
          <TabsList>
            {user && (
              <TabsTrigger value="my-library" className="gap-2">
                <Heart className="h-4 w-4" />
                My Library
                {libraryBooks.length > 0 && (
                  <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                    {libraryBooks.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="browse" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Browse
            </TabsTrigger>
            {isVerified && (
              <TabsTrigger value="my-books" className="gap-2">
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
                  {/* Currently Reading */}
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

                  {/* Not Started */}
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

                  {/* Completed */}
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

          {/* Browse Published Books */}
          <TabsContent value="browse">
            {loadingPublished ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[3/4] rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredPublished.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-1">No books found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Be the first to publish a book!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredPublished.map((book) => (
                  <BookCard key={book.id} book={book} />
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
