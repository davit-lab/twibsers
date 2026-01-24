import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useLibraryItems, useCollections } from '@/hooks/useLibraryItems';
import { useAuth } from '@/contexts/AuthContext';
import LibraryItemCard from '@/components/library/LibraryItemCard';
import UploadItemModal from '@/components/library/UploadItemModal';
import { Search, Plus, FolderPlus, Grid, List, Filter, TrendingUp, Clock, Music, FileText, Image, Sparkles, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortOption = 'recent' | 'popular' | 'most_liked' | 'most_viewed';
type FilterType = 'all' | 'audio' | 'pdf' | 'image';
type ViewMode = 'grid' | 'list';

export default function LibraryExplore() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, loading, likeItem, refetch } = useLibraryItems();
  const { collections, createCollection } = useCollections(user?.id);

  const [activeTab, setActiveTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(item => item.type === filterType);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => (b.view_count + b.like_count) - (a.view_count + a.like_count));
        break;
      case 'most_liked':
        result.sort((a, b) => b.like_count - a.like_count);
        break;
      case 'most_viewed':
        result.sort((a, b) => b.view_count - a.view_count);
        break;
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [items, filterType, searchQuery, sortBy]);

  // My uploads
  const myItems = useMemo(() => {
    return items.filter(item => item.user_id === user?.id);
  }, [items, user?.id]);

  const handleCreateCollection = async () => {
    const name = prompt('Collection name:');
    if (name?.trim()) {
      await createCollection(name.trim());
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Library className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Library</h1>
              </div>
              
              {user && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCreateCollection}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Collection
                  </Button>
                  <UploadItemModal onSuccess={refetch}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </UploadItemModal>
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start bg-transparent gap-2 p-0">
                <TabsTrigger value="explore" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Explore
                </TabsTrigger>
                {user && (
                  <>
                    <TabsTrigger value="my-library" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Library className="h-4 w-4 mr-2" />
                      My Library
                    </TabsTrigger>
                    <TabsTrigger value="collections" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Collections
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              {/* Type Filter */}
              <Select value={filterType} onValueChange={(v: FilterType) => setFilterType(v)}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="audio">
                    <span className="flex items-center gap-2">
                      <Music className="h-4 w-4" /> Audio
                    </span>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> PDF
                    </span>
                  </SelectItem>
                  <SelectItem value="image">
                    <span className="flex items-center gap-2">
                      <Image className="h-4 w-4" /> Image
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Recent
                    </span>
                  </SelectItem>
                  <SelectItem value="popular">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Popular
                    </span>
                  </SelectItem>
                  <SelectItem value="most_liked">Most Liked</SelectItem>
                  <SelectItem value="most_viewed">Most Viewed</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("rounded-none", viewMode === 'grid' && "bg-muted")}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("rounded-none", viewMode === 'list' && "bg-muted")}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'explore' && (
            <>
              {loading ? (
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                    : "space-y-4"
                )}>
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="aspect-square rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-16">
                  <Library className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No items found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'Try a different search term' : 'Be the first to upload!'}
                  </p>
                  {user && (
                    <UploadItemModal onSuccess={refetch}>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload First Item
                      </Button>
                    </UploadItemModal>
                  )}
                </div>
              ) : (
                <div className={cn(
                  viewMode === 'grid'
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                    : "space-y-4"
                )}>
                  {filteredItems.map(item => (
                    <LibraryItemCard
                      key={item.id}
                      item={item}
                      onLike={likeItem}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'my-library' && (
            <>
              {myItems.length === 0 ? (
                <div className="text-center py-16">
                  <Library className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Your library is empty</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload audio, PDFs, or images to get started
                  </p>
                  <UploadItemModal onSuccess={refetch}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Your First Item
                    </Button>
                  </UploadItemModal>
                </div>
              ) : (
                <div className={cn(
                  viewMode === 'grid'
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                    : "space-y-4"
                )}>
                  {myItems.map(item => (
                    <LibraryItemCard
                      key={item.id}
                      item={item}
                      onLike={likeItem}
                      showAuthor={false}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'collections' && (
            <>
              {collections.length === 0 ? (
                <div className="text-center py-16">
                  <FolderPlus className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No collections yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create collections to organize your library
                  </p>
                  <Button onClick={handleCreateCollection}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Collection
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {collections.map(collection => (
                    <div
                      key={collection.id}
                      onClick={() => navigate(`/library/collection/${collection.id}`)}
                      className="group cursor-pointer bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-colors"
                    >
                      <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        {collection.cover_image ? (
                          <img
                            src={collection.cover_image}
                            alt={collection.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FolderPlus className="h-12 w-12 text-primary/50" />
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                          {collection.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {collection.item_count} items
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
