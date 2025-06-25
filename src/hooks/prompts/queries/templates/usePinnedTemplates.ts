import { useQuery } from 'react-query';
import { promptApi, userApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Template, TemplateFolder } from '@/types/prompts/templates';


export function usePinnedTemplates() {
  const userLocale = getCurrentLanguage();

  return useQuery(QUERY_KEYS.PINNED_TEMPLATES, async () => {
    const metadata = await userApi.getUserMetadata();
    if (!metadata.success) {
      throw new Error(metadata.error || 'Failed to get user metadata');
    }

    const pinnedIds: number[] = metadata.data?.pinned_template_ids || [];

    let templates: Array<Template & { type: 'company' | 'organization' | 'user' }> = [];

    if (pinnedIds.length > 0) {
      const [userRes, orgRes, companyRes] = await Promise.all([
        promptApi.getFolders('user', true, true, userLocale),
        promptApi.getFolders('organization', true, true, userLocale),
        promptApi.getFolders('company', true, true, userLocale)
      ]);

      const extractTemplates = (folders: TemplateFolder[] = [], type: 'company' | 'organization' | 'user') => {
        const result: Array<Template & { type: 'company' | 'organization' | 'user' }> = [];

        const traverse = (folder: TemplateFolder) => {
          if (Array.isArray(folder.templates)) {
            folder.templates.forEach(t => {
              if (pinnedIds.includes(t.id)) {
                result.push({ ...t, type });
              }
            });
          }

          if (Array.isArray(folder.Folders)) {
            folder.Folders.forEach(traverse);
          }
        };

        folders.forEach(traverse);
        return result;
      };

      if (userRes.success) {
        templates = templates.concat(
          extractTemplates((userRes.data.folders.user || []) as TemplateFolder[], 'user')
        );
      }

      if (orgRes.success) {
        templates = templates.concat(
          extractTemplates((orgRes.data.folders.organization || []) as TemplateFolder[], 'organization')
        );
      }

      if (companyRes.success) {
        templates = templates.concat(
          extractTemplates((companyRes.data.folders.company || []) as TemplateFolder[], 'company')
        );
      }
    }

    return { templates, pinnedIds };
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load pinned templates: ${error.message}`);
    }
  });
}
