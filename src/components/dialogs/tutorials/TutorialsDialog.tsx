import React from 'react';
import { BaseDialog } from '../BaseDialog';
import { useDialog, useDialogManager } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';

const mockTutorials = [
  {
    id: 'full-tour',
    title: 'Full Tour',
    videoUrl:
      'https://www.loom.com/embed/c910c2ceeea042d99b977b12bd8dba3e?sid=527cefc8-71d7-41d6-a858-f428bed6e57b',
  },
  {
    id: 'templates',
    title: 'Templates',
    videoUrl:
      'https://www.loom.com/embed/af9a0a363d194ac29d6aee3d18b9cdbb?sid=b5879af0-38a7-4432-9983-e3d617401b5e',
  },
  {
    id: 'blocks',
    title: 'Blocks',
    videoUrl:
      'https://www.loom.com/embed/93ac2850b69d4307ba07f1d519a5ed67?sid=8c3c9fab-189f-4464-9449-13c911f2f9f9',
  },
  {
    id: 'folders-org',
    title: 'Folders & Organization',
    videoUrl:
      'https://www.loom.com/embed/63928ee9359345d9baa89a7ddab7979f?sid=e1796a60-3f1c-43f8-b194-6c9a73f29a0e',
  },
  {
    id: 'extension-popup',
    title: 'Extension Popup',
    videoUrl:
      'https://www.loom.com/embed/0113fa04ad104011810d9283df046fb2?sid=56d5ade1-d984-4765-ae00-77b81f21cbc1',
  },
  {
    id: 'stats',
    title: 'Stats',
    videoUrl:
      'https://www.loom.com/embed/c517179557a94a5ba2491a6c7a76f2b0?sid=f055137e-b4e3-4f2f-b4ee-9da6298b2960',
  },
];

export const TutorialsDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.TUTORIALS_LIST);
  const { openDialog } = useDialogManager();

  const openVideo = (videoUrl: string, title: string) => {
    openDialog(DIALOG_TYPES.TUTORIAL_VIDEO, { videoUrl, title });
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
            onClick={() => openVideo(t.videoUrl, t.title)}
          >
            {t.title}
          </Button>
        ))}
      </div>
    </BaseDialog>
  );
};
