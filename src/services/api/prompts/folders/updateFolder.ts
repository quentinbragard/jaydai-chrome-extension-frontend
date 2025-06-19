import { apiClient } from "@/services/api/ApiClient";

/**
 * Update an existing folder's data
 */
export async function updateFolder(
  folderId: number,
  data: { title?: string; description?: string; parent_folder_id?: number | null }
): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    const payload = {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      parent_folder_id: data.parent_folder_id ?? null,
    };

    const response = await apiClient.request(`/prompts/folders/${folderId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
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
