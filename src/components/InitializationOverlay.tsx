import React, { useEffect, useState } from 'react';
import { userApi } from '@/services/api';
import { apiClient } from '@/services/api/ApiClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQueryClient } from 'react-query';

const STORAGE_KEY = 'jaydai.initialized';

/**
 * Displays a loading screen on first load while initial data is fetched.
 */
const InitializationOverlay: React.FC = () => {
  const [show, setShow] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY], async result => {
      if (result[STORAGE_KEY]) return;

      setShow(true);
      try {
        const meta = await userApi.getUserMetadata();
        if (meta.success) {
          queryClient.setQueryData(
            QUERY_KEYS.PINNED_TEMPLATES,
            meta.data?.pinned_template_ids || []
          );
        }

        const checklist = await apiClient.request('/onboarding/checklist');
        if ((checklist as any).success) {
          queryClient.setQueryData('onboardingChecklist', (checklist as any).data);
        }

        chrome.storage.local.set({ [STORAGE_KEY]: true });
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setShow(false);
      }
    });
  }, [queryClient]);

  if (!show) return null;

  return (
    <div className="jd-absolute jd-inset-0 jd-flex jd-items-center jd-justify-center jd-z-20 jd-bg-background/80 jd-backdrop-blur">
      <div className="jd-text-center jd-space-y-4">
        <div className="jd-spinner">
          <div className="jd-double-bounce1"></div>
          <div className="jd-double-bounce2"></div>
        </div>
        <p className="jd-text-sm jd-font-medium jd-animate-pulse">Jaydai is initializing</p>
      </div>
    </div>
  );
};

export default InitializationOverlay;
