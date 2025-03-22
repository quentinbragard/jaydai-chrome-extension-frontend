export interface BaseService {
    /**
     * Initialize the service
     * @returns A promise that resolves when initialization is complete
     */
    initialize(): Promise<void>;
    
    /**
     * Clean up service resources
     */
    cleanup(): void;
    
    /**
     * Check if service is initialized
     */
    isInitialized(): boolean;
  }
  
  /**
   * Abstract base class that services can extend
   */
  export abstract class AbstractBaseService implements BaseService {
    protected _initialized: boolean = false;
    
    public async initialize(): Promise<void> {
      if (this._initialized) return;
      await this.onInitialize();
      this._initialized = true;
    }
    
    public cleanup(): void {
      if (!this._initialized) return;
      this.onCleanup();
      this._initialized = false;
    }
    
    public isInitialized(): boolean {
      return this._initialized;
    }
    
    /**
     * Override in subclasses to implement initialization logic
     */
    protected abstract onInitialize(): Promise<void>;
    
    /**
     * Override in subclasses to implement cleanup logic
     */
    protected abstract onCleanup(): void;
  }