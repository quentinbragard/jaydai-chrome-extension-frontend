import React from 'react';
import AuthForm from './AuthForm';

interface AuthModalProps {
  onClose?: () => void;
  initialMode?: 'signin' | 'signup';
  isSessionExpired?: boolean;
}

/**
 * AuthModal component used for the standalone modal version
 * This is a thin wrapper around the shared AuthForm component
 */
const AuthModal: React.FC<AuthModalProps> = ({ 
  onClose, 
  initialMode = 'signin',
  isSessionExpired = false 
}) => {
  return (
    <AuthForm
      initialMode={initialMode}
      isSessionExpired={isSessionExpired}
      onClose={onClose}
      onSuccess={() => {
        // Any additional modal-specific success handling
        if (onClose) onClose();
      }}
    />
  );
};

export default AuthModal;