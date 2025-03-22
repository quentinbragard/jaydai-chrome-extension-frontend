import React from 'react';
import { 
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useDialog } from '@/core/hooks/useDialog';
import { BaseDialog } from '../dialogs/BaseDialog';
import AuthForm from './AuthForm';

/**
 * AuthDialog component that uses the Dialog system
 * This is a wrapper around the shared AuthForm component
 */
export const AuthDialog: React.FC = () => {
  const { isOpen, options, closeDialog, dialogProps } = useDialog('auth');
  const initialMode = options?.initialMode || 'signin';
  const isSessionExpired = options?.isSessionExpired || false;
  
  return (
    <BaseDialog {...dialogProps}>
      <DialogHeader>
        <DialogTitle className="text-center text-2xl font-bold text-white font-heading mb-6">
          {initialMode === 'signin' 
            ? chrome.i18n.getMessage('signIn') || 'Sign In'
            : chrome.i18n.getMessage('signUp') || 'Sign Up'}
        </DialogTitle>
      </DialogHeader>
      
      <AuthForm
        initialMode={initialMode}
        isSessionExpired={isSessionExpired}
        onClose={closeDialog}
        onSuccess={() => {
          // Any additional dialog-specific success handling
          closeDialog();
        }}
      />
    </BaseDialog>
  );
};

export default AuthDialog;