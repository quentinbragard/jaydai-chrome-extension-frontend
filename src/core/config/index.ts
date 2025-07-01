// src/core/config/index.ts

/**
 * Application configuration
 */
import { ENV } from '../env';

/**
 * Application configuration
 */
export interface AppConfig {
  apiUrl: string;
  debug: boolean;
  version: string;
  features: Record<string, boolean>;
}

// Default configuration using the ENV module
const defaultConfig: AppConfig = {
  apiUrl: ENV.API_URL,
  debug: ENV.DEBUG,
  version: ENV.APP_VERSION,
  features: {
    analytics: true,
    templates: true,
    notifications: true
  }
};

/**
 * Environment-specific overrides (loaded from .env files)
 */
  const envConfig: Partial<AppConfig> = {
    apiUrl: process.env.API_URL || defaultConfig.apiUrl
  };
  
  /**
   * Merged configuration
   */
  export const config: AppConfig = {
    ...defaultConfig,
    ...envConfig
  };
  
  /**
   * Feature flag checker
   */
  export function isFeatureEnabled(featureName: string): boolean {
    return config.features[featureName] === true;
  }