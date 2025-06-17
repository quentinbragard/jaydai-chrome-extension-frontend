import { apiClient } from '@/services/api/ApiClient';

export async function reorderTemplates(folderId: number | null, templateIds: number[]): Promise<any> {
  try {
    const response = await apiClient.request('/prompts/templates/reorder', {
      method: 'POST',
      body: JSON.stringify({ folder_id: folderId, template_ids: templateIds })
    });
    return response;
  } catch (error) {
    console.error('Error reordering templates:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
