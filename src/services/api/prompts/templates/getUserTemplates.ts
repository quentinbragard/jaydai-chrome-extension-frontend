import { apiClient } from "@/services/api/ApiClient";
import { normalizeTemplate } from '@/utils/prompts/templateUtils';

/**
 * Get all templates for the user
 * This allows us to explicitly handle templates with null folder_id
 */
export async function getUserTemplates(): Promise<any> {
  try {
    const response = await apiClient.request('/prompts/templates', {
      method: 'GET'
    });

    if (response.success && Array.isArray(response.data)) {
      response.data = response.data.map(t => normalizeTemplate(t));
    }

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