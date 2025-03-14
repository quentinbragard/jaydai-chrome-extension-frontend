// src/core/env/index.ts

/**
 * Environment variables
 * 
 * These are replaced at build time by Vite
 */
export const ENV = {
    // Use process.env for Vite's replacement
    API_URL: process.env.VITE_API_URL || 'http://localhost:8000',
    DEBUG: process.env.VITE_DEBUG === 'true' || process.env.NODE_ENV !== 'production',
    APP_VERSION: process.env.VITE_APP_VERSION || '1.0.0',
    NODE_ENV: process.env.NODE_ENV || 'development'
  };