// src/components/dialogs/auth/AuthDialog.tsx
import React from 'react';
import { DIALOG_TYPES } from '../DialogRegistry';
import { useDialogStore } from '@/store/dialogStore';
import AuthForm from '@/extension/welcome/auth/AuthForm';
import { getMessage } from '@/core/utils/i18n';
import { BaseDialog } from '../BaseDialog';

/**
 * Dialog for authentication (sign in/sign up)
 */
export const AuthDialog: React.FC = () => {
  const isOpen = useDialogStore(state => state[DIALOG_TYPES.AUTH].isOpen);
  const data = useDialogStore(state => state[DIALOG_TYPES.AUTH].data);
  const closeDialog = useDialogStore(state => state.closeDialog);
  
  // Safe extraction of dialog data with defaults
  const initialMode = data?.initialMode || 'signin';
  const isSessionExpired = data?.isSessionExpired || false;
  const onSuccess = data?.onSuccess || (() => {});
  
  if (!isOpen) return null;
  
  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeDialog(DIALOG_TYPES.AUTH);
      }}
      title={initialMode === 'signin' 
        ? getMessage('signIn', undefined, 'Sign In')
        : getMessage('signUp', undefined, 'Sign Up')}
      className="jd-max-w-md"
    >
      <div className="jd-mt-4" onClick={(e) => e.stopPropagation()}>
        <AuthForm
          initialMode={initialMode}
          isSessionExpired={isSessionExpired}
          onClose={() => closeDialog(DIALOG_TYPES.AUTH)}
          onSuccess={() => {
            onSuccess();
            closeDialog(DIALOG_TYPES.AUTH);
          }}
        />
      </div>
    </BaseDialog>
  );
};