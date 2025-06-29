// src/types/organizations.ts

/**
 * Organization interface matching the Supabase schema
 */
export interface Organization {
    id: string;
    name: string;
    image_url?: string;
    banner_url?: string;
    website_url?: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
  }
  
  /**
   * API response types for organizations
   */
  export interface OrganizationsResponse {
    success: boolean;
    data?: Organization[];
    message?: string;
  }
  
  export interface OrganizationResponse {
    success: boolean;
    data?: Organization;
    message?: string;
  }