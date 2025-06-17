// src/hooks/prompts/queries/folders/useUserFolders.ts
import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { TemplateFolder, Template } from '@/types/prompts/templates';



export function useUserFolders() {
  const locale = getCurrentLanguage();

  return useQuery(QUERY_KEYS.USER_FOLDERS, async (): Promise<TemplateFolder[]> => {
    // Get folders
    const foldersResponse = await promptApi.getFolders('user', true, true, locale);
    console.log("foldersResponse", foldersResponse);
    if (!foldersResponse.success) {
      throw new Error(foldersResponse.message || 'Failed to load user folders');
    }
    return foldersResponse.data.folders.user || [];
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
    return foldersResponse.data.folders.user || [];
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load company folders: ${error.message}`);
    }
  });
}

export function useMixedFolders() {
  const locale = getCurrentLanguage();

  return useQuery(QUERY_KEYS.MIXED_FOLDERS, async (): Promise<TemplateFolder[]> => {
    // Get folders
    const foldersResponse = await promptApi.getFolders('mixed', true, true, locale);
    console.log("foldersResponse", foldersResponse);
    if (!foldersResponse.success) {
      throw new Error(foldersResponse.message || 'Failed to load mixed folders');
    }
    return foldersResponse.data.folders.user || [];
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load mixed folders: ${error.message}`);
    }
  });
}