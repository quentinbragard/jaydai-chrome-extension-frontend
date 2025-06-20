// src/hooks/prompts/queries/folders/useUserCompanyOrganizationFolders.ts
import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { TemplateFolder } from '@/types/prompts/templates';



export function useUserFolders() {
  const locale = getCurrentLanguage();

  return useQuery(QUERY_KEYS.USER_FOLDERS, async (): Promise<TemplateFolder[]> => {
    // Get folders
    const foldersResponse = await promptApi.getFolders('user', true, true, locale);
    console.log("foldersResponse", foldersResponse);
    if (!foldersResponse.success) {
      throw new Error(foldersResponse.message || 'Failed to load user folders');
    }
    const folders = foldersResponse.data.folders.user || [];
    return folders.filter(f => !f.parent_folder_id);
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load user folders: ${error.message}`);
    }
  });
}

export function useCompanyFolders() {
  const locale = getCurrentLanguage();

  return useQuery(QUERY_KEYS.COMPANY_FOLDERS, async (): Promise<TemplateFolder[]> => {
    // Get folders
    const foldersResponse = await promptApi.getFolders('company', true, true, locale);
    console.log("foldersResponse", foldersResponse);
    if (!foldersResponse.success) {
      throw new Error(foldersResponse.message || 'Failed to load company folders');
    }
    const folders = foldersResponse.data.folders.company || [];
    return folders.filter(f => !f.parent_folder_id);
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load company folders: ${error.message}`);
    }
  });
}

export function useOrganizationFolders() {
  const locale = getCurrentLanguage();

  return useQuery(QUERY_KEYS.ORGANIZATION_FOLDERS, async (): Promise<TemplateFolder[]> => {
    // Get folders
    const foldersResponse = await promptApi.getFolders('organization', true, true, locale);
    console.log("foldersResponse", foldersResponse);
    if (!foldersResponse.success) {
      throw new Error(foldersResponse.message || 'Failed to load organization folders');
    }
    const folders = foldersResponse.data.folders.organization || [];
    return folders.filter(f => !f.parent_folder_id);
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load organization folders: ${error.message}`);
    }
  });
}
