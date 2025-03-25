// src/hooks/stats/useStats.ts

import { useState, useEffect, useCallback } from 'react';
import { useService } from '@/core/hooks/useService';

/**
 * Hook for accessing and manipulating stats data
 */
export function useStats(defaultFilters?: any) {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>(defaultFilters || {
    timeRange: 'month'
  });
  
  // Get the stats service
  const statsService = useService('stats');

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
      const currentStats = statsService.getStats();
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
      return () => {}; // Empty cleanup function
    }
  }, [statsService, filters]);

  // Function to refresh stats data
  const refreshStats = useCallback(async () => {
    if (!statsService) {
      return;
    }
    
    setLoading(true);
    try {
      await statsService.refreshStats();
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh stats');
      setLoading(false);
    }
  }, [statsService]);

  // Update filters
  const updateFilters = useCallback((newFilters: any) => {
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