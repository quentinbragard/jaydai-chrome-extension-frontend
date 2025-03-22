// src/services/auth/AuthStateManager.ts
import { AuthState } from '@/types';

export class AuthStateManager {
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  };
  
  private listeners: Set<(state: AuthState) => void> = new Set();
  
  /**
   * Get the current auth state
   */
  public getState(): AuthState {
    return { ...this.authState };
  }
  
  /**
   * Update the auth state
   */
  public updateState(partialState: Partial<AuthState>): void {
    this.authState = {
      ...this.authState,
      ...partialState
    };
    
    this.notifyListeners();
  }
  
  /**
   * Subscribe to state changes
   */
  public subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately notify with current state
    callback(this.getState());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  /**
   * Clear all listeners
   */
  public clearListeners(): void {
    this.listeners.clear();
  }
  
  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    const state = this.getState();
    
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in auth state listener:', err);
      }
    });
  }
}