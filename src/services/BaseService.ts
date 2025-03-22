// src/services/BaseService.ts
export interface BaseService {
  initialize(): Promise<void>;
  cleanup(): void;
  isInitialized(): boolean;
}

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
  
  protected abstract onInitialize(): Promise<void>;
  protected abstract onCleanup(): void;
}