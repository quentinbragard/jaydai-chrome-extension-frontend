import { serviceManager } from '../managers/ServiceManager';
import { BaseService } from '@/services/BaseService';

/**
 * Hook for accessing registered services
 */
export function useService<T extends BaseService>(serviceName: string): T | undefined {
  return serviceManager.getService<T>(serviceName);
}