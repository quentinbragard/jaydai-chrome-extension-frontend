import { apiClient } from '@/services/api/ApiClient';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { TemplateFolder } from '@/types/prompts/folders';
import { normalizeFolders } from '@/utils/prompts/folderUtils';

export interface GetFoldersResponse {
  success: boolean;
  data: { folders: Record<string, TemplateFolder[]> };
  message?: string;
}

export async function getPinnedFolders(
  withSubfolders = false,
  withTemplates = false,
  locale?: string
): Promise<GetFoldersResponse> {
  try {
    const params = new URLSearchParams();
    if (withSubfolders) params.append('withSubfolders', 'true');
    if (withTemplates) params.append('withTemplates', 'true');
    const userLocale = locale || getCurrentLanguage();
    if (userLocale) params.append('locale', userLocale);

    const endpoint = `/prompts/folders/pinned?${params.toString()}`;
    const response = await apiClient.request(endpoint);

    if (response && response.success && response.data?.folders) {
      const normalized: Record<string, TemplateFolder[]> = {};
      for (const key of Object.keys(response.data.folders)) {
        normalized[key] = normalizeFolders(response.data.folders[key]);
      }
      response.data.folders = normalized;
    }

    console.log('getFolders response ❤️❤️❤️❤️❤️', params.toString());
    return response as GetFoldersResponse;
  } catch (error) {
    console.error('Error fetching folders:', error);
    return {
      success: false,
      data: { folders: {} },
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
