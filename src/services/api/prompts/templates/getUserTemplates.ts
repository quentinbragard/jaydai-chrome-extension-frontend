import { apiClient } from "@/services/api/ApiClient";

/**
 * Get all templates for the user
 * This allows us to explicitly handle templates with null folder_id
 */
export async function getUserTemplates(): Promise<any> {
    try {
      const response = await apiClient.request('/prompts/templates', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Error fetching user templates:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }