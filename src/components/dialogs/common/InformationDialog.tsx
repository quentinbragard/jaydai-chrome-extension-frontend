import React from 'react';
import { Button } from '@/components/ui/button';
import { useDialog } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { BaseDialog } from '../BaseDialog';
import { getMessage } from '@/core/utils/i18n';

export const InformationDialog: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.INFORMATION);

  const title = data?.title || getMessage('information', undefined, 'Information');
  const description = data?.description || '';
  const imageUrl = data?.imageUrl;
  const actionText = data?.actionText || getMessage('continue', undefined, 'Continue');
  const onAction = data?.onAction || (() => {});
  const hideAction = data?.hideAction || false;

  if (!isOpen) return null;

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction();
    dialogProps.onOpenChange(false);
  };

  const footer = hideAction ? undefined : (
    <div className="jd-flex jd-justify-end jd-space-x-2">
      <Button onClick={handleAction}>{actionText}</Button>
    </div>
  );

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title={title}
      description={description}
      className="jd-max-w-lg"
      footer={footer}
    >
      {imageUrl && (
        <img src={imageUrl} alt="" className="jd-max-w-full jd-rounded-md jd-mx-auto" />
      )}
    </BaseDialog>
  );
};

export default InformationDialog;
