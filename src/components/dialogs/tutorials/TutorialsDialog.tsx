import React from 'react';
import { BaseDialog } from '../BaseDialog';
import { useDialog, useDialogManager } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';

const GIF_URL =
  'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//shortchut_demo.gif';

const videos = [
  { id: 'v1', title: 'Video 1', videoId: 'dQw4w9WgXcQ' },
  { id: 'v2', title: 'Video 2', videoId: 'oHg5SJYRHA0' },
  { id: 'v3', title: 'Video 3', videoId: 'dQw4w9WgXcQ' },
  { id: 'v4', title: 'Video 4', videoId: 'oHg5SJYRHA0' },
  { id: 'v5', title: 'Video 5', videoId: 'dQw4w9WgXcQ' },
  { id: 'v6', title: 'Video 6', videoId: 'oHg5SJYRHA0' },
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
      className="jd-max-w-5xl"
      footer={footer}
    >
      <div className="jd-flex jd-flex-col jd-space-y-6">
        <div className="jd-grid jd-grid-cols-3 jd-gap-4">

          {Array.from({ length: 3 }).map((_, i) => (
            <img
              key={i}
              src={GIF_URL}
              alt={`Tutorial gif ${i + 1}`}
              className="jd-w-full jd-h-48 md:jd-h-56 jd-rounded jd-object-cover jd-transition-transform hover:jd-scale-110"

            />
          ))}
        </div>

        <div className="jd-grid jd-grid-cols-2 md:jd-grid-cols-3 jd-gap-4">
          {videos.map((v) => (
            <button
              key={v.id}
              onClick={() => openVideo(v.videoId, v.title)}
              className="jd-flex jd-flex-col jd-items-center jd-space-y-2 focus:jd-outline-none"
            >
              <img
                src={`https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`}
                alt={v.title}
                className="jd-w-full jd-rounded"
              />
              <span className="jd-text-sm jd-text-center">{v.title}</span>
            </button>
          ))}
        </div>
      </div>
    </BaseDialog>
  );
};
