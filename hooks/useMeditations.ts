import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Meditation, Category } from '@/lib/supabase';

export function useMeditations() {
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Mark component as mounted
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const safeSetState = useCallback((setter: () => void) => {
    if (mounted) {
      setter();
    }
  }, [mounted]);

  const loadData = useCallback(async () => {
    if (!mounted) return;
    
    try {
      safeSetState(() => {
        setLoading(true);
        setError(null);
      });

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        throw categoriesError;
      }

      // Load meditations with category info
      const { data: meditationsData, error: meditationsError } = await supabase
        .from('meditations')
        .select(`
          *,
          categories!inner(id, name)
        `)
        .order('created_at', { ascending: false });

      if (meditationsError) {
        throw meditationsError;
      }

      if (!mounted) return;

      // Transform data to match app format
      const transformedMeditations: Meditation[] = meditationsData.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category_id,
        length: `${item.duration_minutes}m`,
        audioUrl: item.audio_url,
        imageUrl: item.image_url,
        featured: item.featured,
        createdAt: item.created_at,
      }));

      safeSetState(() => {
        setCategories(categoriesData || []);
        setMeditations(transformedMeditations);
      });
    } catch (err: any) {
      console.error('Error loading meditations:', err);
      if (mounted) {
        safeSetState(() => {
          setError(err.message || 'Failed to load meditations');
        });
      }
    } finally {
      if (mounted) {
        safeSetState(() => {
          setLoading(false);
        });
      }
    }
  }, [mounted, safeSetState]);

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted, loadData]);

  const refreshData = useCallback(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted, loadData]);

  return {
    meditations,
    categories,
    loading,
    error,
    refreshData,
  };
}