import { apiClient } from "@/services/api/ApiClient";
import { getCurrentLanguage } from "@/core/utils/i18n";

/**
 * Update an existing folder's data
 */
export async function updateFolder(
  folderId: number,
  data: { title?: string | Record<string, string>; description?: string | Record<string, string>; parent_folder_id?: number | null }
): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    const locale = getCurrentLanguage();
    const payload = {
      ...data,
      ...(data.title !== undefined
        ? {
            title:
              typeof data.title === 'string'
                ? { [locale]: data.title }
                : data.title,
          }
        : {}),
      ...(data.description !== undefined
        ? {
            description:
              typeof data.description === 'string'
                ? { [locale]: data.description }
                : data.description,
          }
        : {}),
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
