/**
* Create a new folder
*/

import { apiClient } from "@/services/api/ApiClient";
import { getCurrentLanguage } from "@/core/utils/i18n";

export async function createFolder(folderData: {
  title: string | Record<string, string>;
  description?: string | Record<string, string>;
  parent_folder_id?: number | null;
}): Promise<any> {
  try {
    if (!folderData.title) {
      return {
        success: false,
        message: 'Folder title is required',
      };
    }

    const locale = getCurrentLanguage();
    const payload = {
      ...folderData,
      title:
        typeof folderData.title === 'string'
          ? { [locale]: folderData.title }
          : folderData.title,
      ...(folderData.description
        ? {
            description:
              typeof folderData.description === 'string'
                ? { [locale]: folderData.description }
                : folderData.description,
          }
        : {}),
    };

    const response = await apiClient.request('/prompts/folders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  } catch (error) {
    console.error('Error creating folder:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
  