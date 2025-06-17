import { apiClient } from '@/services/api/ApiClient';

export async function updateFolder(folderId: number, data: Record<string, any>): Promise<any> {
  try {
    const response = await apiClient.request(`/prompts/folders/${folderId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response;
  } catch (error) {
    console.error('Error updating folder:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
