import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useUserInterests } from '@/hooks/useInterests';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { Button } from '@/components/ui/button';
import { Sparkles, Lock, Crown, PlusCircle, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface InterestsFeedProps {
  userId: string;
  isOwnProfile?: boolean;
}

// Placeholder interest post type - will be expanded when we add the posts table
interface InterestPost {
  id: string;
  content: string;
  interest_category: {
    name: string;
    color: string;
    icon: string;
  };
  created_at: string;
  like_count: number;
  comment_count: number;
}

export default function InterestsFeed({ userId, isOwnProfile = false }: InterestsFeedProps) {
  const { user } = useAuth();
  const { data: userInterests, isLoading: interestsLoading } = useUserInterests(userId);
  const { data: isPremium, isLoading: premiumLoading } = usePremiumStatus(userId);
  const { data: viewerIsPremium } = usePremiumStatus(user?.id);
  
  const isLoading = interestsLoading || premiumLoading;

  // For now, we'll show a placeholder since we haven't created interest_posts table yet
  const interestPosts: InterestPost[] = [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // Show user's interests as tags
  const interests = userInterests?.map((ui: any) => ui.interest_categories) || [];

  return (
    <div className="space-y-6">
      {/* User's Interests Display */}
      {interests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {interests.map((interest: any) => (
            <span
              key={interest.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: `${interest.color}20`,
                color: interest.color,
                borderColor: interest.color,
                borderWidth: 1
              }}
            >
              {interest.name}
            </span>
          ))}
        </div>
      )}

      {/* Premium gate for posting to interests */}
      {isOwnProfile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-5 rounded-xl border",
            isPremium 
              ? "border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5" 
              : "border-border bg-card"
          )}
        >
          {isPremium ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Share to Interests Feed</p>
                  <p className="text-sm text-muted-foreground">
                    Create content based on your interests
                  </p>
                </div>
              </div>
              <Button className="btn-gradient">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Unlock Interests Posting</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Premium to post to your interests feed
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link to="/pricing" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Upgrade
                </Link>
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Interest Posts List */}
      {interestPosts.length > 0 ? (
        <div className="space-y-4">
          {interestPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-border bg-card"
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${post.interest_category.color}20`,
                    color: post.interest_category.color 
                  }}
                >
                  {post.interest_category.name}
                </span>
              </div>
              <p className="text-foreground">{post.content}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Heart className="h-4 w-4" />
                  {post.like_count}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  {post.comment_count}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No interest posts yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {isOwnProfile 
              ? isPremium 
                ? "Share your first post to your interests feed!"
                : "Upgrade to Premium to start posting to your interests"
              : "This user hasn't posted any interest content yet"
            }
          </p>
          {isOwnProfile && !isPremium && (
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/pricing">
                <Sparkles className="h-4 w-4 mr-2" />
                View Premium
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
