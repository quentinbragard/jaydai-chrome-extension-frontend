// src/extension/welcome/hooks/useInitializeServices.ts
import { useState, useEffect } from 'react';
import { serviceManager } from '@/core/managers/ServiceManager';
import { debug } from '@/core/config';
import { registerServices } from '@/services';

// Flag to ensure we only initialize services once
let servicesInitialized = false;

export function useInitializeServices() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initServices = async () => {
      if (servicesInitialized) {
        debug('Services already initialized, skipping');
        setIsInitialized(true);
        setIsLoading(false);
        return true;
      }
      
      debug('Starting service initialization...');
      try {
        // Register services if needed
        if (!serviceManager.hasService('api.client')) {
          debug('Registering services...');
          registerServices();
        }
        
        // Initialize services in the correct order
        debug('Initializing API client first...');
        const apiClient = serviceManager.getService('api.client');
        if (apiClient && !apiClient.isInitialized()) {
          await apiClient.initialize();
        }
        
        debug('Initializing Token service...');
        const tokenService = serviceManager.getService('auth.token');
        if (tokenService && !tokenService.isInitialized()) {
          await tokenService.initialize();
        }
        
        debug('Initializing Auth service...');
        const authService = serviceManager.getService('auth.state');
        if (authService && !authService.isInitialized()) {
          await authService.initialize();
        }
        
        debug('All critical services initialized');
        servicesInitialized = true;
        setIsInitialized(true);
        setIsLoading(false);
        return true;
      } catch (error) {
        console.error('Error initializing services:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize services');
        setIsLoading(false);
        return false;
      }
    };
    
    initServices();
  }, []);

  return { isLoading, initError };
}

