// src/extension/popup/components/LoginForm.tsx
import React, { useState } from 'react';
import { 
  Mail,
  Lock,
  LogIn,
  UserPlus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { getMessage } from '@/core/utils/i18n';
import { authService } from '@/services/auth/AuthService';
import { AuthState } from '@/types';

interface LoginFormProps {
  authState: AuthState;
  onWelcomePageClick: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  authState, 
  onWelcomePageClick 
}) => {
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) {
      setLoginError(getMessage('invalidCredentials', undefined, 'Please enter both email and password'));
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const success = await authService.signInWithEmail(email, password);
      
      if (success) {
        toast.success(getMessage('signInSuccessful', undefined, 'Sign-in successful'));
      } else {
        // Error is set via authService subscription
        setLoginError(authState.error || getMessage('invalidCredentials', undefined, 'Invalid email or password'));
      }
    } catch (error) {
      setLoginError(getMessage('loginFailed', undefined, 'Login failed. Please try again.'));
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const success = await authService.signInWithGoogle();
      
      if (success) {
        toast.success(getMessage('signInSuccessful', undefined, 'Sign-in successful'));
      } else {
        // Error is set via authService subscription
        setLoginError(authState.error || getMessage('loginFailed', undefined, 'Google login failed'));
      }
    } catch (error) {
      setLoginError(getMessage('loginFailed', undefined, 'Login failed. Please try again.'));
      console.error('Google login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <CardContent className="jd-p-4 jd-space-y-4">
      {/* Login Form */}
      <div className="jd-space-y-3">
        {loginError && (
          <div className="jd-bg-red-500/10 jd-text-red-500 jd-border-red-300/20 jd-p-3 jd-rounded-lg jd-text-sm jd-font-medium jd-shadow-sm jd-backdrop-blur-sm jd-flex jd-items-start jd-space-x-2">
            <div className="jd-flex-shrink-0 jd-mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className="jd-flex-1">
              {loginError}
            </div>
          </div>
        )}
        
        <div className="jd-space-y-2 jd-text-foreground">
          <Label htmlFor="email-signin" className="jd-font-medium jd-text-sm">
            {getMessage('email', undefined, 'Email')}
          </Label>
          <div className="jd-relative jd-group">
            <Input 
              id="email-signin"
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-11 pr-4 py-2 bg-card/80 backdrop-blur-sm border-input focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all rounded-lg"
              disabled={isLoggingIn}
            />
            <div className="jd-absolute jd-left-3 jd-top-1/2 jd-translate-y-1/2 jd-text-muted-foreground group-focus-within:text-blue-500 jd-transition-colors">
              <Mail className="jd-h-5 jd-w-5" />
            </div>
          </div>
        </div>
        
        <div className="jd-space-y-2 jd-text-foreground">
          <div className="jd-flex jd-justify-between jd-items-center">
            <Label htmlFor="password-signin" className="jd-font-medium jd-text-sm">
              {getMessage('password', undefined, 'Password')}
            </Label>
            <Button variant="link" className="jd-p-0 jd-h-auto jd-text-xs jd-text-blue-500 hover:text-blue-400 jd-transition-colors">
              {getMessage('forgotPassword', undefined, 'Forgot?')}
            </Button>
          </div>
          <div className="jd-relative jd-group">
            <Input 
              id="password-signin"
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-11 pr-4 py-2 bg-card/80 backdrop-blur-sm border-input focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all rounded-lg"
              disabled={isLoggingIn}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEmailLogin();
                }
              }}
            />
            <div className="jd-absolute jd-left-3 jd-top-1/2 jd-translate-y-1/2 jd-text-muted-foreground group-focus-within:text-blue-500 jd-transition-colors">
              <Lock className="jd-h-5 jd-w-5" />
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleEmailLogin} 
          className="jd-w-full jd-bg-gradient-to-r jd-from-blue-600 jd-to-indigo-600 hover:jd-from-blue-700 hover:jd-to-indigo-700 jd-transition-all jd-duration-300 jd-py-5 jd-mt-3 jd-rounded-lg jd-relative jd-overflow-hidden jd-group jd-border-none"
          disabled={isLoggingIn}
        >
          <div className="jd-absolute jd-inset-0 jd-w-full jd-h-full jd-bg-gradient-to-r jd-from-blue-600/0 jd-via-blue-400/10 jd-to-blue-600/0 jd-transform jd-skew-x-12 jd-translate-x-full group-hover:jd-translate-x-full jd-transition-transform jd-duration-1000 jd-ease-out"></div>
          {isLoggingIn ? (
            <span className="jd-flex jd-items-center jd-justify-center">
              <div className="jd-spinner-sm jd-mr-2">
                <div className="jd-double-bounce1"></div>
                <div className="jd-double-bounce2"></div>
              </div>
              <span>{getMessage('signingIn', undefined, 'Signing in...')}</span>
            </span>
          ) : (
            <span className="jd-flex jd-items-center jd-justify-center">
              <LogIn className="jd-h-4 jd-w-4 jd-mr-2" />
              <span>{getMessage('signIn', undefined, 'Sign In')}</span>
            </span>
          )}
        </Button>
      </div>

      <div className="jd-relative jd-my-6">
        <div className="jd-absolute jd-inset-0 jd-flex jd-items-center">
          <div className="jd-w-full jd-border-t jd-border-muted"></div>
        </div>
        <div className="jd-relative jd-flex jd-justify-center jd-text-xs jd-font-medium">
          <span className="jd-px-4 jd-py-1 jd-bg-background jd-text-muted-foreground jd-rounded-full jd-border jd-border-muted">
            {getMessage('or', undefined, 'Or continue with')}
          </span>
        </div>
      </div>

      <div className="jd-grid jd-gap-3">
        <Button 
          variant="outline" 
          onClick={handleGoogleLogin} 
          className="jd-w-full jd-border-muted hover:jd-bg-muted/10 jd-transition-all jd-duration-300 jd-py-5 jd-rounded-lg jd-group jd-relative jd-overflow-hidden"
          disabled={isLoggingIn}
        >
          <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-red-500/5 jd-via-blue-500/5 jd-to-green-500/5 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity jd-duration-500"></div>
          <span className="jd-flex jd-items-center jd-justify-center jd-relative jd-z-10">
            <div className="jd-p-1.5 jd-bg-white jd-rounded-full jd-shadow-sm jd-mr-3 group-hover:jd-shadow group-hover:jd-scale-110 jd-transition-all jd-duration-300">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="jd-h-4 jd-w-4" />
            </div>
            <span className="jd-font-medium">{getMessage('signInWith', ['Google'], 'Sign in with Google')}</span>
          </span>
        </Button>
        
        <div className="jd-relative">
          <div className="jd-absolute jd-inset-x-0 jd-top-1/2 jd-h-px jd-bg-gradient-to-r jd-from-transparent jd-via-muted jd-to-transparent jd-translate-y-1/2"></div>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={onWelcomePageClick}
          className="jd-w-full jd-text-blue-600 hover:jd-text-blue-500 hover:jd-bg-blue-50/30 jd-dark:hover:jd-bg-blue-950/20 jd-transition-all jd-duration-300 jd-py-5 jd-rounded-lg jd-relative jd-overflow-hidden jd-group"
        >
          <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-blue-500/0 jd-via-blue-500/5 jd-to-blue-500/0 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity jd-duration-500"></div>
          <span className="jd-flex jd-items-center jd-justify-center jd-space-x-2 jd-relative jd-z-10">
            <UserPlus className="jd-h-4 jd-w-4 group-hover:jd-scale-110 jd-transition-transform jd-duration-300" />
            <span className="jd-font-medium">{getMessage('createAccount', undefined, 'Create Account')}</span>
          </span>
        </Button>
      </div>
    </CardContent>
  );
};