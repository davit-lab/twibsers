import { cn } from '@/lib/utils';
import { Sparkles, Library, FolderPlus } from 'lucide-react';

type TabValue = 'explore' | 'my-library' | 'collections';

interface LibraryTabsProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
  isLoggedIn: boolean;
}

const tabs: { value: TabValue; label: string; icon: React.ReactNode; requiresAuth: boolean }[] = [
  { value: 'explore', label: 'Explore', icon: <Sparkles className="h-4 w-4" />, requiresAuth: false },
  { value: 'my-library', label: 'My Library', icon: <Library className="h-4 w-4" />, requiresAuth: true },
  { value: 'collections', label: 'Collections', icon: <FolderPlus className="h-4 w-4" />, requiresAuth: true },
];

export default function LibraryTabs({ activeTab, onTabChange, isLoggedIn }: LibraryTabsProps) {
  return (
    <div className="flex items-center gap-2 pb-2">
      {tabs.map((tab) => {
        if (tab.requiresAuth && !isLoggedIn) return null;
        
        const isActive = activeTab === tab.value;
        
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "relative flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
