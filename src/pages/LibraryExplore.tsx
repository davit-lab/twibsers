import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useLibraryItems, useCollections } from '@/hooks/useLibraryItems';
import { useAuth } from '@/contexts/AuthContext';
import LibraryHeader from '@/components/library/LibraryHeader';
import LibrarySearchBar from '@/components/library/LibrarySearchBar';
import LibraryTabs from '@/components/library/LibraryTabs';
import LibraryItemGridCard from '@/components/library/LibraryItemGridCard';
import LibraryEmptyState from '@/components/library/LibraryEmptyState';
import CollectionCard from '@/components/library/CollectionCard';
import { cn } from '@/lib/utils';

type SortOption = 'recent' | 'popular' | 'most_liked' | 'most_viewed';
type FilterType = 'all' | 'audio' | 'pdf' | 'image';
type ViewMode = 'grid' | 'list';
type TabValue = 'explore' | 'my-library' | 'collections';

export default function LibraryExplore() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, loading, likeItem, refetch } = useLibraryItems();
  const { collections, createCollection } = useCollections(user?.id);

  const [activeTab, setActiveTab] = useState<TabValue>('explore');
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

  const getGridClass = () => {
    if (viewMode === 'list') return "space-y-4";
    return "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8";
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Background Effects */}
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-10">
          {/* Header */}
          <LibraryHeader
            user={user}
            onCreateCollection={handleCreateCollection}
            onUploadSuccess={refetch}
          />

          {/* Tabs */}
          <LibraryTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isLoggedIn={!!user}
          />

          {/* Search & Filters */}
          <LibrarySearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterType={filterType}
            onFilterChange={setFilterType}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Content */}
          <div className="min-h-[400px]">
            {activeTab === 'explore' && (
              <>
                {loading ? (
                  <div className={getGridClass()}>
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="space-y-4">
                        <Skeleton className="aspect-square rounded-2xl" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <LibraryEmptyState
                    type="explore"
                    searchQuery={searchQuery}
                    isLoggedIn={!!user}
                    onUploadSuccess={refetch}
                  />
                ) : (
                  <div className={getGridClass()}>
                    {filteredItems.map(item => (
                      <LibraryItemGridCard
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
                  <LibraryEmptyState
                    type="my-library"
                    isLoggedIn={!!user}
                    onUploadSuccess={refetch}
                  />
                ) : (
                  <div className={getGridClass()}>
                    {myItems.map(item => (
                      <LibraryItemGridCard
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
                  <LibraryEmptyState
                    type="collections"
                    isLoggedIn={!!user}
                    onCreateCollection={handleCreateCollection}
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {collections.map(collection => (
                      <CollectionCard
                        key={collection.id}
                        collection={collection}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
