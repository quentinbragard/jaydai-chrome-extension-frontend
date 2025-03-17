import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AuthModalProps {
  onClose?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setMessage(chrome.i18n.getMessage('enterEmailPassword'));
      return;
    }

    try {
      // Send message to background script for authentication
      chrome.runtime.sendMessage(
        { action: "emailSignIn", email, password }, 
        (response) => {
          if (response.success) {
            toast.success(chrome.i18n.getMessage('signInSuccessful'), {
              description: chrome.i18n.getMessage('youCanNowAccess'),
              action: {
                label: chrome.i18n.getMessage('openChatGPT'),
                onClick: () => window.open("https://chatgpt.com/", "_blank")
              }
            });
            onClose?.();
          } else {
            toast.error(chrome.i18n.getMessage('signInFailed'), {
              description: response.error || chrome.i18n.getMessage('unableToProcess')
            });
          }
        }
      );
    } catch (error) {
      toast.error(chrome.i18n.getMessage('authError'), {
        description: chrome.i18n.getMessage('unableToProcess')
      });
    }
  };

  const handleGoogleSignIn = () => {
    try {
      chrome.runtime.sendMessage(
        { action: "googleSignIn" }, 
        (response) => {
          if (response.success) {
            toast.success(chrome.i18n.getMessage('signInSuccessful', { provider: 'Google' }), {
              description: chrome.i18n.getMessage('youCanNowAccess'),
              action: {
                label: chrome.i18n.getMessage('openChatGPT'),
                onClick: () => window.open("https://chatgpt.com/", "_blank")
              }
            });
            onClose?.();
          } else {
            toast.error(chrome.i18n.getMessage('signInFailed'), {
              description: response.error || chrome.i18n.getMessage('unableToProcess')
            });
          }
        }
      );
    } catch (error) {
      toast.error(chrome.i18n.getMessage('authError'), {
        description: chrome.i18n.getMessage('unableToProcess')
      });
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="text-red-500 text-sm mb-4">
          {message}
        </div>
      )}
      <div className="space-y-2">
        <Input 
          type="email" 
          placeholder={chrome.i18n.getMessage('email')} 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input 
          type="password" 
          placeholder={chrome.i18n.getMessage('password')} 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button 
        onClick={handleEmailSignIn} 
        className="w-full"
      >
        {chrome.i18n.getMessage('signIn')}
      </Button>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            {chrome.i18n.getMessage('or')}
          </span>
        </div>
      </div>
      <Button 
        variant="outline" 
        onClick={handleGoogleSignIn} 
        className="w-full"
      >
        {chrome.i18n.getMessage('signInWith', 'Google')}
      </Button>
    </div>
  );
};

export default AuthModal;