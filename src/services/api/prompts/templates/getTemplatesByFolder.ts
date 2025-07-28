import { apiClient } from '@/services/api/ApiClient';
import { normalizeTemplate } from '@/utils/prompts/templateUtils';

/**
 * Fetch templates that belong to a specific folder

 */
export async function getTemplatesByFolder(folderId: number): Promise<any> {
  try {
    const response = await apiClient.request(`/prompts/templates?folder_id=${folderId}`, {
      method: 'GET',
    });
    if (response.success && Array.isArray(response.data)) {
      response.data = response.data.map(t => normalizeTemplate(t));
    }
    return response;
  } catch (error) {
    console.error('Error fetching templates by folder:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
