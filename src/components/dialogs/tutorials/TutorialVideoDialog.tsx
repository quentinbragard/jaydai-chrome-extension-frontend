import React, { useEffect } from 'react';
import { BaseDialog } from '../BaseDialog';
import { useDialog } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/analytics';

export const TutorialVideoDialog: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.TUTORIAL_VIDEO);

  useEffect(() => {
    if (isOpen) {
      trackEvent(EVENTS.TUTORIAL_VIDEO_PLAYED, {
        video_title: data?.title,
      });
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const url = data?.url || '';
  const title = data?.title || getMessage('tutorials', undefined, 'Tutorial');

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title={title}
      className="jd-max-w-xl"
    >
      <div className="jd-relative jd-w-full jd-h-0 jd-pb-[56.25%]">
        <iframe
          className="jd-absolute jd-top-0 jd-left-0 jd-w-full jd-h-full"
          src={url}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </BaseDialog>
  );
};
