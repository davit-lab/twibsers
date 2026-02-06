import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Grid, List, Music, FileText, Image, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortOption = 'recent' | 'popular' | 'most_liked' | 'most_viewed';
type FilterType = 'all' | 'audio' | 'pdf' | 'image';
type ViewMode = 'grid' | 'list';

interface LibrarySearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: FilterType;
  onFilterChange: (filter: FilterType) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const typeFilters: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'audio', label: 'Audio', icon: <Music className="h-4 w-4" /> },
  { value: 'pdf', label: 'PDF', icon: <FileText className="h-4 w-4" /> },
  { value: 'image', label: 'Image', icon: <Image className="h-4 w-4" /> },
];

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'recent', label: 'Recent', icon: <Clock className="h-4 w-4" /> },
  { value: 'popular', label: 'Popular', icon: <TrendingUp className="h-4 w-4" /> },
];

export default function LibrarySearchBar({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: LibrarySearchBarProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Search Input */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          placeholder="Search the archive..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 h-14 text-base font-medium bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 rounded-2xl transition-all"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type Filter Pills */}
        <div className="flex items-center bg-muted/50 p-1.5 rounded-2xl gap-1">
          {typeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                filterType === filter.value
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filter.icon}
              <span className="hidden sm:inline">{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Sort Pills */}
        <div className="flex items-center bg-muted/50 p-1.5 rounded-2xl gap-1">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                sortBy === option.value
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.icon}
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex ml-auto border-2 border-border rounded-xl overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-none h-10 w-10",
              viewMode === 'grid' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
            onClick={() => onViewModeChange('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-none h-10 w-10",
              viewMode === 'list' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
