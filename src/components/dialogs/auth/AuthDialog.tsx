// src/components/dialogs/auth/AuthDialog.tsx
import React from 'react';
import { useDialog } from '@/components/dialogs/core/DialogContext';
import { DIALOG_TYPES } from '@/core/dialogs/registry';
import AuthForm from '@/extension/welcome/auth/AuthForm';
import { getMessage } from '@/core/utils/i18n';
import { BaseDialog } from '../BaseDialog';

/**
 * Dialog for authentication (sign in/sign up)
 */
export const AuthDialog: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.AUTH);
  
  // Safe extraction of dialog data with defaults
  const initialMode = data?.initialMode || 'signin';
  const isSessionExpired = data?.isSessionExpired || false;
  const onSuccess = data?.onSuccess || (() => {});
  
  if (!isOpen) return null;
  
  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title={initialMode === 'signin' 
        ? getMessage('signIn', undefined, 'Sign In')
        : getMessage('signUp', undefined, 'Sign Up')}
      className="jd-max-w-md"
    >
      <div className="jd-mt-4">
        <AuthForm
          initialMode={initialMode}
          isSessionExpired={isSessionExpired}
          onClose={() => dialogProps.onOpenChange(false)}
          onSuccess={() => {
            onSuccess();
            dialogProps.onOpenChange(false);
          }}
        />
      </div>
    </BaseDialog>
  );
};