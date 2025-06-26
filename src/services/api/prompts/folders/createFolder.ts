import { debug } from '@/core/config';
/**
* Create a new folder
*/

import { apiClient } from "@/services/api/ApiClient";

export async function createFolder(folderData: {
  title: string;
  description?: string;
  parent_folder_id?: number | null;
}): Promise<any> {

  try {
    if (!folderData.title) {
      return {
        success: false,
        message: 'Folder title is required',
      };
    }

    const payload = {
      title: folderData.title,
      ...(folderData.description ? { description: folderData.description } : {}),
      parent_folder_id: folderData.parent_folder_id ?? null,
    };
  debug("payload--->", payload);
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
  