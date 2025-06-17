import { apiClient } from '@/services/api/ApiClient';

export async function reorderFolders(parentId: number | null, folderIds: number[]): Promise<any> {
  try {
    const response = await apiClient.request('/prompts/folders/reorder', {
      method: 'POST',
      body: JSON.stringify({ parent_id: parentId, folder_ids: folderIds })
    });
    return response;
  } catch (error) {
    console.error('Error reordering folders:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
