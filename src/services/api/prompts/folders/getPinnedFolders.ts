import { apiClient } from '@/services/api/ApiClient';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { TemplateFolder } from '@/types/prompts/folders';
import { normalizeFolders } from '@/utils/prompts/folderUtils';

export interface GetPinnedFoldersResponse {
  success: boolean;
  data: { folders: TemplateFolder[] }; // Updated to match expected structure
  message?: string;
  error?: string;
}

export async function getPinnedFolders(
  withSubfolders = false,
  withTemplates = false,
  locale?: string
): Promise<GetPinnedFoldersResponse> {
  try {
    const params = new URLSearchParams();
    
    if (withSubfolders) params.append('withSubfolders', 'true');
    if (withTemplates) params.append('withTemplates', 'true');
    
    const userLocale = locale || getCurrentLanguage();
    if (userLocale) params.append('locale', userLocale);

    // Build the endpoint with proper query parameter syntax
    const queryString = params.toString();
    const endpoint = queryString ? `/prompts/folders/pinned?${queryString}` : '/prompts/folders/pinned';
    
    
    const response = await apiClient.request(endpoint);
    

    // Handle the response structure based on what your backend returns
    if (response && response.success) {
      // Check if the response has the expected structure
      if (response.data?.folders) {
        // If folders is an array, normalize it
        if (Array.isArray(response.data.folders)) {
          const normalizedFolders = normalizeFolders(response.data.folders);
          return {
            success: true,
            data: { folders: normalizedFolders }
          };
        }
        // If folders is an object with keys, handle accordingly
        else if (typeof response.data.folders === 'object') {
          // Flatten all folder arrays into a single array
          const allFolders: TemplateFolder[] = [];
          Object.values(response.data.folders).forEach((folderArray: any) => {
            if (Array.isArray(folderArray)) {
              allFolders.push(...folderArray);
            }
          });
          
          const normalizedFolders = normalizeFolders(allFolders);
          return {
            success: true,
            data: { folders: normalizedFolders }
          };
        }
      }
      
      // If no folders in response, return empty array
      return {
        success: true,
        data: { folders: [] }
      };
    }

    // Handle error response
    return {
      success: false,
      data: { folders: [] },
      message: response?.message || response?.error || 'Failed to fetch pinned folders'
    };
    
  } catch (error) {
    console.error('❌ Error fetching pinned folders:', error);
    return {
      success: false,
      data: { folders: [] },
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}