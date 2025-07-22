import React, { useEffect } from 'react';
import { userApi, promptApi } from '@/services/api';
import { blocksApi } from '@/services/api/BlocksApi';
import { apiClient } from '@/services/api/ApiClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQueryClient } from 'react-query';
import { getCurrentLanguage, getMessage } from '@/core/utils/i18n';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useInitialization } from '@/state/InitializationContext';

/**
 * Displays a loading screen while initial data is fetched.
 */
const InitializationOverlay: React.FC = () => {
  const queryClient = useQueryClient();
  const { loading, setLoading } = useInitialization();

  useEffect(() => {
    const loadData = async () => {
      const needFolders = !queryClient.getQueryData(QUERY_KEYS.ALL_FOLDERS);
      const needTemplates = !queryClient.getQueryData(QUERY_KEYS.USER_TEMPLATES);
      const needBlocks = !queryClient.getQueryData('blocks');
      const needChecklist = !queryClient.getQueryData('onboardingChecklist');

      if (!needFolders && !needTemplates && !needBlocks && !needChecklist) {
        return;
      }

      setLoading(true);
      try {
        const userLocale = getCurrentLanguage();

        const metaPromise = userApi.getUserMetadata();
        const foldersPromise = promptApi.getFolders('organization', true, true, userLocale);
        const templatesPromise = promptApi.getUserTemplates();
        const blocksPromise = blocksApi.getBlocks({ published: true });
        const checklistPromise = apiClient.request('/onboarding/checklist');

        const [meta, folders, templates, blocks, checklist] = await Promise.all([
          metaPromise,
          foldersPromise,
          templatesPromise,
          blocksPromise,
          checklistPromise
        ]);

        if (meta.success) {
          queryClient.setQueryData(
            QUERY_KEYS.PINNED_TEMPLATES,
            meta.data?.pinned_template_ids || []
          );
        }

        if (folders.success) {
          queryClient.setQueryData(QUERY_KEYS.ALL_FOLDERS, {
            organization: folders.data.folders.organization || []
          });
        }

        if (templates.success) {
          queryClient.setQueryData(QUERY_KEYS.USER_TEMPLATES, templates.data);
        }

        if (blocks.success) {
          queryClient.setQueryData('blocks', blocks.data);
        }

        if ((checklist as any).success) {
          queryClient.setQueryData('onboardingChecklist', (checklist as any).data);
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [queryClient, setLoading]);

  if (!loading) return null;

  return (
    <div className="jd-absolute jd-inset-0 jd-flex jd-items-center jd-justify-center jd-z-20 jd-bg-background/80 jd-backdrop-blur">
      <LoadingSpinner message={getMessage('loading', undefined, 'Loading...')} />
    </div>
  );
};

export default InitializationOverlay;
