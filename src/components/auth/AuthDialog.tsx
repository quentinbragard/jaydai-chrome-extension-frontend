import React from 'react';
import { 
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useDialog } from '@/core/hooks/useDialog';
import { BaseDialog } from '../dialogs/BaseDialog';
import AuthForm from './AuthForm';
import { getMessage } from '@/core/utils/i18n';

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
            ? getMessage('signIn', undefined, 'Sign In')
            : getMessage('signUp', undefined, 'Sign Up')}
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