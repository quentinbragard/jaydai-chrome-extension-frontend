import React from 'react';
import { BaseDialog } from '../BaseDialog';
import { useDialog, useDialogManager } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';

const mockTutorials = [
  { id: 'intro', title: 'Getting Started', videoId: 'dQw4w9WgXcQ' },
  { id: 'advanced', title: 'Advanced Tips', videoId: 'oHg5SJYRHA0' },
];

export const TutorialsDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.TUTORIALS_LIST);
  const { openDialog } = useDialogManager();

  const openVideo = (videoId: string, title: string) => {
    openDialog(DIALOG_TYPES.TUTORIAL_VIDEO, { videoId, title });
  };

  const openSubstack = () => {
    window.open(
      'https://thetunnel.substack.com/?utm_source=jaydai-extension',
      '_blank'
    );
  };

  if (!isOpen) return null;

  const footer = (
    <Button onClick={openSubstack}>{getMessage('aiNews', undefined, 'AI News')}</Button>
  );

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title={getMessage('tutorials', undefined, 'Tutorials')}
      className="jd-max-w-md"
      footer={footer}
    >
      <div className="jd-flex jd-flex-col jd-space-y-2">
        {mockTutorials.map((t) => (
          <Button
            key={t.id}
            variant="ghost"
            className="jd-justify-start"
            onClick={() => openVideo(t.videoId, t.title)}
          >
            {t.title}
          </Button>
        ))}
      </div>
    </BaseDialog>
  );
};
