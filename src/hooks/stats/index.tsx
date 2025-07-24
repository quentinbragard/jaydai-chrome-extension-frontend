/**
 * Export all stats hooks for easy importing elsewhere
 */

export { default as useStats } from './useStats';
export * from './queries';

// Also export types for convenience
export type { 
  Stats, 
  StatsFilterOptions,
  TimeSeriesData,
  DataPoint,
  ModelEnergyUsage
} from '@/types/stats';