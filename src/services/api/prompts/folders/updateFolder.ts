import { apiClient } from "@/services/api/ApiClient";

/**
 * Update an existing folder's data
 */
export async function updateFolder(
  folderId: number,
  data: { name?: string; description?: string; parent_id?: number | null }
): Promise<{ success: boolean; message?: string; data?: any }> {
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
