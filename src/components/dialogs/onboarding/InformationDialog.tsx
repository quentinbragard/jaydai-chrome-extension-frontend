// src/components/dialogs/onboarding/InformationDialog.tsx
import React from 'react';
import { createPortal } from 'react-dom';
import { BaseDialog } from '../BaseDialog';
import { useDialog } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { Button } from '@/components/ui/button';
import { useShadowRoot } from '@/core/utils/componentInjector';
import { getMessage } from '@/core/utils/i18n';

export const InformationDialog: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.INFORMATION);
  const shadowRoot = useShadowRoot();

  const title = data?.title;
  const description = data?.description;
  const gifUrl = data?.gifUrl as string | undefined;
  const actionText = data?.actionText || getMessage('continue', undefined, 'Continue');
  const onAction = data?.onAction as (() => void) | undefined;

  if (!isOpen) return null;

  const footer = (
    <div className="jd-flex jd-justify-end">
      <Button
        onClick={(e) => {
          e.stopPropagation();
          if (onAction) onAction();
          dialogProps.onOpenChange(false);
        }}
      >
        {actionText}
      </Button>
    </div>
  );

  const dialog = (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title={title}
      description={description}
      className="jd-max-w-lg"
      footer={footer}
    >
      {gifUrl && (
        <img
          src={gifUrl}
          alt={title}
          className="jd-w-full jd-max-h-80 jd-object-contain jd-rounded-md"
        />
      )}
    </BaseDialog>
  );

  return createPortal(dialog, shadowRoot || document.body);
};
