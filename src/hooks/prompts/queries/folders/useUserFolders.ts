// src/hooks/prompts/queries/folders/useUserFolders.ts
import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/constants/queryKeys'; // Updated import
import { TemplateFolder } from '@/types/prompts/templates';

export function useUserFolders() {
  return useQuery(QUERY_KEYS.USER_FOLDERS, async () => {
    const response = await promptApi.getUserFolders();
    if (!response.success) {
      throw new Error(response.message || 'Failed to load user folders');
    }
    
    // Also fetch user templates to properly handle templates with null folder_id
    const templatesResponse = await promptApi.getUserTemplates();

    if (templatesResponse.success && templatesResponse.data) {
      // Map folder ID to folder object and track existing template IDs to avoid duplicates
      const folderMap = new Map<number, { folder: TemplateFolder; idSet: Set<number> }>();

      response.data.forEach((folder: TemplateFolder) => {
        const templatesArray = Array.isArray(folder.templates) ? folder.templates : [];
        folder.templates = templatesArray;
        const idSet = new Set<number>(templatesArray.map(t => t.id));
        folderMap.set(folder.id, { folder, idSet });
      });

      // Assign templates to their folders, skipping duplicates and unorganized templates
      templatesResponse.data.forEach(template => {
        if (template.folder_id === null) {
          return; // unorganized template handled elsewhere
        }

        const mapEntry = folderMap.get(template.folder_id);
        if (mapEntry && !mapEntry.idSet.has(template.id)) {
          mapEntry.folder.templates.push(template);
          mapEntry.idSet.add(template.id);
        }
      });
    }
    
    return response.data;
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load user folders: ${error.message}`);
    }
  });
}