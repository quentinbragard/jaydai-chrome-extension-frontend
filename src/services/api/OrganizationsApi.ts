// src/services/api/OrganizationsApi.ts
import { apiClient } from './ApiClient';

export interface Organization {
  id: string;
  name: string;
  image_url?: string;
  description?: string;
  created_at?: string;
}

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

export class OrganizationsApi {
  /**
   * Get all organizations the user has access to
   */
  async getOrganizations(): Promise<OrganizationsResponse> {
    try {
      const response = await apiClient.request<OrganizationsResponse>('/organizations');
      return response;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get a specific organization by ID
   */
  async getOrganizationById(organizationId: string): Promise<OrganizationResponse> {
    try {
      const response = await apiClient.request<OrganizationResponse>(`/organizations/${organizationId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching organization ${organizationId}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const organizationsApi = new OrganizationsApi();