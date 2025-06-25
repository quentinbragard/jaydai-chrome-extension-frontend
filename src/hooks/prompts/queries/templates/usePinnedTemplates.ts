import { useQuery } from 'react-query';
import { promptApi, userApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Template, TemplateFolder } from '@/types/prompts/templates';

function collectTemplates(folders: TemplateFolder[]): Template[] {
  const templates: Template[] = [];
  const traverse = (f: TemplateFolder) => {
    if (f.templates) templates.push(...f.templates);
    if (f.Folders) f.Folders.forEach(traverse);
  };
  folders.forEach(traverse);
  return templates;
}

export function usePinnedTemplates() {
  const userLocale = getCurrentLanguage();

  return useQuery(QUERY_KEYS.PINNED_TEMPLATES, async () => {
    const metadata = await userApi.getUserMetadata();
    if (!metadata.success) {
      throw new Error(metadata.error || 'Failed to get user metadata');
    }

    const genericIds = metadata.data?.pinned_template_ids || [];
    const legacyOrgIds = metadata.data?.pinned_organization_template_ids || [];
    const pinnedIds = Array.from(new Set([...genericIds, ...legacyOrgIds]));

    const templates: Template[] = [];

    if (pinnedIds.length > 0) {
      const [userResp, orgResp] = await Promise.all([
        promptApi.getFolders('user', true, true, userLocale),
        promptApi.getFolders('organization', true, true, userLocale),
      ]);

      if (userResp.success) {
        const folders = (userResp.data.folders.user || []) as TemplateFolder[];
        const all = collectTemplates(folders);
        templates.push(
          ...all.filter(t => pinnedIds.includes(t.id)).map(t => ({ ...t, is_pinned: true }))
        );
      }

      if (orgResp.success) {
        const folders = (orgResp.data.folders.organization || []) as TemplateFolder[];
        const all = collectTemplates(folders);
        templates.push(
          ...all.filter(t => pinnedIds.includes(t.id)).map(t => ({ ...t, is_pinned: true }))
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
