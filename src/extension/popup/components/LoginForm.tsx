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
    <CardContent className="p-4 space-y-4">
      {/* Login Form */}
      <div className="space-y-3">
        {loginError && (
          <div className="bg-red-500/10 text-red-500 border-red-300/20 p-3 rounded-lg text-sm font-medium shadow-sm backdrop-blur-sm flex items-start space-x-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className="flex-1">
              {loginError}
            </div>
          </div>
        )}
        
        <div className="space-y-2 text-foreground">
          <Label htmlFor="email-signin" className="font-medium text-sm">
            {getMessage('email', undefined, 'Email')}
          </Label>
          <div className="relative group">
            <Input 
              id="email-signin"
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-11 pr-4 py-2 bg-card/80 backdrop-blur-sm border-input focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all rounded-lg"
              disabled={isLoggingIn}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors">
              <Mail className="h-5 w-5" />
            </div>
          </div>
        </div>
        
        <div className="space-y-2 text-foreground">
          <div className="flex justify-between items-center">
            <Label htmlFor="password-signin" className="font-medium text-sm">
              {getMessage('password', undefined, 'Password')}
            </Label>
            <Button variant="link" className="p-0 h-auto text-xs text-blue-500 hover:text-blue-400 transition-colors">
              {getMessage('forgotPassword', undefined, 'Forgot?')}
            </Button>
          </div>
          <div className="relative group">
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
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors">
              <Lock className="h-5 w-5" />
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleEmailLogin} 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 py-5 mt-3 rounded-lg relative overflow-hidden group border-none"
          disabled={isLoggingIn}
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600/0 via-blue-400/10 to-blue-600/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
          {isLoggingIn ? (
            <span className="flex items-center justify-center">
              <div className="spinner-sm mr-2">
                <div className="double-bounce1"></div>
                <div className="double-bounce2"></div>
              </div>
              <span>{getMessage('signingIn', undefined, 'Signing in...')}</span>
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <LogIn className="h-4 w-4 mr-2" />
              <span>{getMessage('signIn', undefined, 'Sign In')}</span>
            </span>
          )}
        </Button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted"></div>
        </div>
        <div className="relative flex justify-center text-xs font-medium">
          <span className="px-4 py-1 bg-background text-muted-foreground rounded-full border border-muted">
            {getMessage('or', undefined, 'Or continue with')}
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        <Button 
          variant="outline" 
          onClick={handleGoogleLogin} 
          className="w-full border-muted hover:bg-muted/10 transition-all duration-300 py-5 rounded-lg group relative overflow-hidden"
          disabled={isLoggingIn}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-blue-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <span className="flex items-center justify-center relative z-10">
            <div className="p-1.5 bg-white rounded-full shadow-sm mr-3 group-hover:shadow group-hover:scale-110 transition-all duration-300">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-4 w-4" />
            </div>
            <span className="font-medium">{getMessage('signInWith', ['Google'], 'Sign in with Google')}</span>
          </span>
        </Button>
        
        <div className="relative">
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-muted to-transparent -translate-y-1/2"></div>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={onWelcomePageClick}
          className="w-full text-blue-600 hover:text-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all duration-300 py-5 rounded-lg relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <span className="flex items-center justify-center space-x-2 relative z-10">
            <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-medium">{getMessage('createAccount', undefined, 'Create Account')}</span>
          </span>
        </Button>
      </div>
    </CardContent>
  );
};