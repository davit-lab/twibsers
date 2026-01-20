import { Flame, Trophy, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useReadingStreak, BADGE_INFO } from '@/hooks/useReadingStreak';
import { format, differenceInDays, parseISO } from 'date-fns';

interface ReadingStreakCardProps {
  userId?: string;
  compact?: boolean;
}

export default function ReadingStreakCard({ userId, compact = false }: ReadingStreakCardProps) {
  const { streak, badges, loading } = useReadingStreak(userId);

  if (loading) {
    return (
      <Card className={compact ? 'border-0 shadow-none bg-transparent' : ''}>
        <CardHeader className={compact ? 'p-0 pb-3' : ''}>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className={compact ? 'p-0' : ''}>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const lastReadDate = streak?.last_read_date;

  // Check if streak is active (read today or yesterday)
  const isStreakActive = lastReadDate
    ? differenceInDays(new Date(), parseISO(lastReadDate)) <= 1
    : false;

  // Calculate next milestone
  const milestones = [3, 7, 14, 30, 60, 100, 365];
  const nextMilestone = milestones.find(m => m > currentStreak) || 365;
  const progressToNext = currentStreak > 0 ? (currentStreak / nextMilestone) * 100 : 0;

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isStreakActive ? 'bg-orange-500/10 text-orange-500' : 'bg-muted text-muted-foreground'}`}>
            <Flame className={`h-4 w-4 ${isStreakActive ? 'animate-pulse' : ''}`} />
            <span className="font-bold">{currentStreak}</span>
            <span className="text-xs">day streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span className="font-bold">{longestStreak}</span>
            <span className="text-xs">best</span>
          </div>
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.slice(0, 5).map((badge) => {
              const info = BADGE_INFO[badge.badge_type];
              return (
                <Badge
                  key={badge.id}
                  variant="secondary"
                  className="text-xs"
                  title={`${badge.badge_name} - Earned ${format(new Date(badge.earned_at), 'MMM d, yyyy')}`}
                >
                  {info?.icon || '🏅'} {badge.badge_name}
                </Badge>
              );
            })}
            {badges.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{badges.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Reading Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg text-center ${isStreakActive ? 'bg-orange-500/10' : 'bg-muted'}`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className={`h-6 w-6 ${isStreakActive ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'}`} />
            </div>
            <p className={`text-3xl font-bold ${isStreakActive ? 'text-orange-500' : 'text-muted-foreground'}`}>
              {currentStreak}
            </p>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </div>
          <div className="p-4 rounded-lg bg-muted text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-amber-500">{longestStreak}</p>
            <p className="text-xs text-muted-foreground">Longest Streak</p>
          </div>
        </div>

        {/* Progress to next milestone */}
        {currentStreak > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to {nextMilestone}-day badge</span>
              <span>{currentStreak}/{nextMilestone} days</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Last read */}
        {lastReadDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Last read: {format(parseISO(lastReadDate), 'MMMM d, yyyy')}</span>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Earned Badges</p>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => {
                const info = BADGE_INFO[badge.badge_type];
                return (
                  <Badge
                    key={badge.id}
                    variant="secondary"
                    className="text-sm py-1"
                    title={`Earned ${format(new Date(badge.earned_at), 'MMM d, yyyy')}`}
                  >
                    <span className="mr-1">{info?.icon || '🏅'}</span>
                    {badge.badge_name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* No streak message */}
        {currentStreak === 0 && !lastReadDate && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Start reading to build your streak! 📚
          </p>
        )}
      </CardContent>
    </Card>
  );
}
