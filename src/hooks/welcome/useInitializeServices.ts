// src/extension/welcome/hooks/useInitializeServices.ts
import { useState, useEffect } from 'react';
import { serviceManager } from '@/core/managers/ServiceManager';

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
        console.log('Services already initialized, skipping');
        setIsInitialized(true);
        setIsLoading(false);
        return true;
      }
      
      console.log('Starting service initialization...');
      try {
        // Register services if needed
        if (!serviceManager.hasService('api.client')) {
          console.log('Registering services...');
          registerServices();
        }
        
        // Initialize services in the correct order
        console.log('Initializing API client first...');
        const apiClient = serviceManager.getService('api.client');
        if (apiClient && !apiClient.isInitialized()) {
          await apiClient.initialize();
        }
        
        console.log('Initializing Token service...');
        const tokenService = serviceManager.getService('auth.token');
        if (tokenService && !tokenService.isInitialized()) {
          await tokenService.initialize();
        }
        
        console.log('Initializing Auth service...');
        const authService = serviceManager.getService('auth.state');
        if (authService && !authService.isInitialized()) {
          await authService.initialize();
        }
        
        console.log('All critical services initialized');
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

