import { useUserStats } from './queries';

/**
 * Backwards compatible hook returning user stats
 */
export function useStats(enabled = true) {
  return useUserStats(enabled);
}

export default useStats;
