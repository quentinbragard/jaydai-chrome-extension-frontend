// src/extension/welcome/auth/AuthDialog.tsx

import React from 'react';
import { 
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { BaseDialog } from '../../../components/dialogs/BaseDialog';
import AuthForm from './AuthForm';
import { getMessage } from '@/core/utils/i18n';

/**
 * Props for the AuthDialog component
 */
interface AuthDialogProps {
  onClose?: () => void;
  options?: {
    initialMode?: 'signin' | 'signup';
    isSessionExpired?: boolean;
  };
  dialogProps?: any;
}

/**
 * AuthDialog component that uses the Dialog system
 * This is a wrapper around the shared AuthForm component
 */
export const AuthDialog: React.FC<AuthDialogProps> = ({ onClose, options, dialogProps }) => {
  const initialMode = options?.initialMode || 'signin';
  const isSessionExpired = options?.isSessionExpired || false;
  
  return (
    <BaseDialog {...dialogProps}>
      <DialogHeader>
        <DialogTitle className="jd-text-center jd-text-2xl jd-font-bold jd-text-white jd-font-heading jd-mb-6">
          {initialMode === 'signin' 
            ? getMessage('signIn', undefined, 'Sign In')
            : getMessage('signUp', undefined, 'Sign Up')}
        </DialogTitle>
      </DialogHeader>
      
      <AuthForm
        initialMode={initialMode}
        isSessionExpired={isSessionExpired}
        onClose={onClose}
        onSuccess={() => {
          // Any additional dialog-specific success handling
          if (onClose) onClose();
        }}
      />
    </BaseDialog>
  );
};

export default AuthDialog;