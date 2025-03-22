import { BaseService } from '@/services/BaseService';

/**
 * Centralized service management
 */
class ServiceManager {
  private services: Map<string, BaseService> = new Map();
  private isInitializing: boolean = false;
  
  /**
   * Register a service 
   */
  public registerService(name: string, service: BaseService): void {
    if (this.services.has(name)) {
      console.warn(`Service '${name}' is already registered. Overwriting.`);
    }
    this.services.set(name, service);
  }
  
  /**
   * Get a registered service
   */
  public getService<T extends BaseService>(name: string): T | undefined {
    return this.services.get(name) as T | undefined;
  }
  
  /**
   * Initialize all registered services in proper order
   */
  public async initializeAll(initOrder?: string[]): Promise<void> {
    if (this.isInitializing) {
      throw new Error('Services are already being initialized');
    }
    
    this.isInitializing = true;
    
    try {
      // Default initialization order if not provided
      const order = initOrder || [
        'auth',         // Authentication should be first
        'network',      // Network handling comes second 
        'chat',         // Chat service depends on network
        'user',         // User info service
        'messages',     // Message handling
        'templates',    // Template service
        'notifications', // Notifications
        'stats'         // Stats service last
      ];

      console.log('Initializing services in order:', order);
      
      // Initialize services in order
      for (const serviceName of order) {
        const service = this.services.get(serviceName);
        
        if (service) {
          console.log(`Initializing service: ${serviceName}`);
          await service.initialize();
          console.log(`Service initialized: ${serviceName}`);
        } else {
          // Just log a warning if service doesn't exist, don't fail
          console.warn(`Service '${serviceName}' not found during initialization`);
        }
      }
      
      // Initialize any remaining services not in the ordered list
      for (const [name, service] of this.services.entries()) {
        if (!order.includes(name) && !service.isInitialized()) {
          console.log(`Initializing additional service: ${name}`);
          await service.initialize();
        }
      }
      
      console.log('All services initialized successfully');
    } catch (error) {
      console.error('Error initializing services:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }
  
  /**
   * Clean up all services
   */
  public cleanupAll(): void {
    // Cleanup in reverse initialization order
    const serviceEntries = Array.from(this.services.entries());
    
    // Go through services in reverse to ensure proper cleanup order
    for (let i = serviceEntries.length - 1; i >= 0; i--) {
      const [name, service] = serviceEntries[i];
      if (service.isInitialized()) {
        console.log(`Cleaning up service: ${name}`);
        service.cleanup();
      }
    }
    
    console.log('All services cleaned up');
  }
}

// Export a singleton instance
export const serviceManager = new ServiceManager();