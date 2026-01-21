import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserPreferences {
  id?: string;
  user_id: string;
  theme: string;
  font_size: string;
  display_density: string;
  color_accent: string;
  autoplay_videos: boolean;
  content_filter: string;
  language: string;
  show_sensitive_content: boolean;
  reduced_motion: boolean;
  high_contrast: boolean;
  screen_reader_optimized: boolean;
  two_factor_enabled: boolean;
  login_alerts: boolean;
}

const defaultPreferences: Omit<UserPreferences, 'user_id'> = {
  theme: 'system',
  font_size: 'medium',
  display_density: 'comfortable',
  color_accent: 'purple',
  autoplay_videos: true,
  content_filter: 'standard',
  language: 'en',
  show_sensitive_content: false,
  reduced_motion: false,
  high_contrast: false,
  screen_reader_optimized: false,
  two_factor_enabled: false,
  login_alerts: true,
};

export function useUserPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data as UserPreferences);
      } else {
        // Create default preferences
        const newPreferences = { ...defaultPreferences, user_id: user.id };
        const { data: created, error: createError } = await supabase
          .from('user_preferences')
          .insert(newPreferences)
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(created as UserPreferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user || !preferences) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences({ ...preferences, ...updates });
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save preferences',
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    loading,
    saving,
    updatePreferences,
  };
}
