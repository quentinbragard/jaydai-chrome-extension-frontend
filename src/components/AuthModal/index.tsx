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
      setMessage("Please enter both email and password.");
      return;
    }

    try {
      // Send message to background script for authentication
      chrome.runtime.sendMessage(
        { action: "emailSignIn", email, password }, 
        (response) => {
          if (response.success) {
            toast.success("Sign-in successful!", {
              description: "You can now access your ChatGPT conversations.",
              action: {
                label: "Open ChatGPT",
                onClick: () => window.open("https://chatgpt.com/", "_blank")
              }
            });
            onClose?.();
          } else {
            toast.error("Sign-in failed", {
              description: response.error || "An error occurred during sign-in."
            });
          }
        }
      );
    } catch (error) {
      toast.error("Authentication Error", {
        description: "Unable to process sign-in at this moment."
      });
    }
  };

  const handleGoogleSignIn = () => {
    try {
      chrome.runtime.sendMessage(
        { action: "googleSignIn" }, 
        (response) => {
          if (response.success) {
            toast.success("Google Sign-in successful!", {
              description: "You can now access your ChatGPT conversations.",
              action: {
                label: "Open ChatGPT",
                onClick: () => window.open("https://chatgpt.com/", "_blank")
              }
            });
            onClose?.();
          } else {
            toast.error("Google Sign-in failed", {
              description: response.error || "An error occurred during sign-in."
            });
          }
        }
      );
    } catch (error) {
      toast.error("Authentication Error", {
        description: "Unable to process Google sign-in at this moment."
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
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button 
        onClick={handleEmailSignIn} 
        className="w-full"
      >
        Sign In
      </Button>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            Or continue with
          </span>
        </div>
      </div>
      <Button 
        variant="outline" 
        onClick={handleGoogleSignIn} 
        className="w-full"
      >
        Sign In with Google
      </Button>
    </div>
  );
};

export default AuthModal;