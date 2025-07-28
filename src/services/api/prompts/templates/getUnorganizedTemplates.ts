
import { apiClient } from "@/services/api/ApiClient";
import { normalizeTemplate } from '@/utils/prompts/templateUtils';

/**
 * Get templates with null folder_id (unorganized templates)
 */
export async function getUnorganizedTemplates(): Promise<any> {
  try {
    // Endpoint specifically for templates without a folder
    const response = await apiClient.request('/prompts/templates', {
      method: 'GET'
    });

    if (response.success && Array.isArray(response.data)) {
      response.data = response.data.map(t => normalizeTemplate(t));
    }

    return response;
  } catch (error) {
    console.error('Error fetching unorganized templates:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}