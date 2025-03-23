// src/components/dialogs/auth/AuthDialog.tsx
import React from 'react';
import { 
  Dialog,
  DialogContent
} from "@/components/ui/dialog";
import { useDialog } from '@/components/dialogs/core/DialogContext';
import { DIALOG_TYPES } from '@/core/dialogs/registry';
import AuthForm from '@/components/auth/AuthForm';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getMessage } from '@/core/utils/i18n';

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
    <Dialog {...dialogProps}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-white font-heading mb-6">
            {initialMode === 'signin' 
              ? getMessage('signIn', undefined, 'Sign In')
              : getMessage('signUp', undefined, 'Sign Up')}
          </DialogTitle>
        </DialogHeader>
        
        <AuthForm
          initialMode={initialMode}
          isSessionExpired={isSessionExpired}
          onClose={() => dialogProps.onOpenChange(false)}
          onSuccess={() => {
            onSuccess();
            dialogProps.onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};