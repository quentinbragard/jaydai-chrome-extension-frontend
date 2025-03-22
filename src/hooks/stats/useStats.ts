import { useState, useEffect, useCallback } from 'react';
import { Stats, StatsFilterOptions } from '@/types/stats';
import { useService } from '@/core/hooks/useService';
import { StatsService } from '@/services/analytics/StatsService';

/**
 * Hook for accessing and manipulating stats data
 */
export function useStats(defaultFilters?: StatsFilterOptions) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StatsFilterOptions>(defaultFilters || {
    timeRange: 'month'
  });
  
  // Get the stats service
  const statsService = useService<StatsService>('stats');

  // Load stats initially and when filters change
  useEffect(() => {
    if (!statsService) {
      setError('Stats service not available');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get current stats from service
      const currentStats = statsService.getStats(filters);
      setStats(currentStats);
      
      // Subscribe to updates
      const unsubscribe = statsService.onUpdate((newStats) => {
        setStats(newStats);
        setLoading(false);
      });
      
      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      setLoading(false);
    }
  }, [statsService, filters]);

  // Function to refresh stats data
  const refreshStats = useCallback(async () => {
    if (!statsService) {
      return;
    }
    
    setLoading(true);
    try {
      await statsService.refreshStats(filters);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh stats');
      setLoading(false);
    }
  }, [statsService, filters]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<StatsFilterOptions>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  return {
    stats,
    loading,
    error,
    filters,
    updateFilters,
    refreshStats
  };
}

export default useStats;