// src/extension/welcome/auth/AuthForm.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Lock, 
  User, 
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from "sonner";
import { getMessage } from '@/core/utils/i18n';
import { authService } from '@/services/auth/AuthService';
import { userApi } from '@/services/api/UserApi';

export interface AuthFormProps {
  initialMode?: 'signin' | 'signup';
  isSessionExpired?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

export interface AuthMessage {
  text: string; 
  type: 'error' | 'success' | 'info';
}

// The AuthForm component using the AuthService
export const AuthForm: React.FC<AuthFormProps> = ({ 
  initialMode = 'signin',
  isSessionExpired = false,
  onSuccess,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<AuthMessage | null>(
    isSessionExpired 
      ? { text: getMessage('sessionExpired', undefined, 'Session expired'), type: 'info' }
      : null
  );

  useEffect(() => {
    setActiveTab(initialMode);
  }, [initialMode]);

  useEffect(() => {
    // Set message when session expired flag changes
    if (isSessionExpired) {
      setMessage({ 
        text: getMessage('sessionExpired', undefined, 'Session expired'), 
        type: 'info' 
      });
    }
  }, [isSessionExpired]);

  // Listen for auth state changes
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((state) => {
      if (state.error) {
        setMessage({
          text: state.error,
          type: 'error'
        });
      } else if (state.user && state.isAuthenticated) {
        // Success state - user is authenticated
        if (onSuccess) {
          onSuccess();
        }
      }
    });
    
    // Clean up subscription
    return () => {
      unsubscribe();
      authService.clearError();
    };
  }, [onSuccess]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setMessage(null);
    authService.clearError();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    resetForm();
  };

  // Form validation functions
  const validateSignInInputs = (): boolean => {
    if (!email.trim()) {
      setMessage({
        text: getMessage('enterEmail', undefined, 'Please enter your email'), 
        type: 'error'
      });
      return false;
    }
    
    if (!password) {
      setMessage({
        text: getMessage('enterPassword', undefined, 'Please enter your password'), 
        type: 'error'
      });
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage({
        text: getMessage('invalidEmail', undefined, 'Invalid email address'), 
        type: 'error'
      });
      return false;
    }
    
    return true;
  }

  const validateSignUpInputs = (): boolean => {
    if (!validateSignInInputs()) {
      return false;
    }
    
    if (password.length < 8) {
      setMessage({
        text: getMessage('passwordTooShort', undefined, 'Password must be at least 8 characters'), 
        type: 'error'
      });
      return false;
    }
    
    return true;
  }

  // Check if user needs onboarding
  const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
    try {
      const status = await userApi.getUserOnboardingStatus();
      return !status.hasCompleted;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false; // Default to not requiring onboarding on error
    }
  };

  // Auth submission handlers using the authService
  const handleEmailSignIn = async () => {
    if (!validateSignInInputs()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      const success = await authService.signInWithEmail(email.trim(), password);

      if (success) {
        // Get the user's state to check if onboarding is needed
        const state = authService.getAuthState();
        const needsOnboarding = state.user ? await checkOnboardingStatus(state.user.id) : false;
        
        toast.success(
          getMessage('signInSuccessful', undefined, 'Sign-in successful'), 
          {
            description: needsOnboarding 
              ? getMessage('completeOnboarding', undefined, 'Please complete the onboarding process')
              : getMessage('youCanNowAccess', undefined, 'You can now access your conversations')
          }
        );
        
        // Only open ChatGPT if onboarding is not required
        if (!needsOnboarding) {
          window.open('https://chat.openai.com', '_blank');
        }
        
        if (onClose) {
          onClose();
        }
      }
      // If not successful, the AuthService subscription will update the message
    } catch (error) {
      setMessage({
        text: getMessage('invalidCredentials', undefined, 'Invalid email or password'),
        type: 'error'
      });
      console.error('Auth form error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateSignUpInputs()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      const success = await authService.signUp(email.trim(), password, name.trim());
      
      if (success) {
        toast.success(
          getMessage('signUpSuccessful', undefined, 'Sign-up successful'),
          {
            description: getMessage('completeOnboarding', undefined, 'Please complete the onboarding process')
          }
        );
        // Automatically sign in the newly created user to trigger onboarding
        await handleEmailSignIn();
      }
      // If not successful, the AuthService subscription will update the message
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : String(error),
        type: 'error'
      });
      console.error('Auth form error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const success = await authService.signInWithGoogle();
      
      if (success) {
        // Get the user's state to check if onboarding is needed
        const state = authService.getAuthState();
        const needsOnboarding = state.user ? await checkOnboardingStatus(state.user.id) : false;
        
        toast.success(
          getMessage('signInSuccessful', undefined, 'Sign-in successful'), 
          {
            description: needsOnboarding 
              ? getMessage('completeOnboarding', undefined, 'Please complete the onboarding process')
              : getMessage('youCanNowAccess', undefined, 'You can now access your conversations')
          }
        );
        
        // Only open ChatGPT if onboarding is not required
        if (!needsOnboarding) {
          window.open('https://chat.openai.com', '_blank');
        }
        
        if (onClose) {
          onClose();
        }
      }
      // If not successful, the AuthService subscription will update the message
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : String(error),
        type: 'error'
      });
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-2 bg-background bg-opacity-100">
      <Tabs 
        defaultValue={activeTab} 
        value={activeTab} 
        onValueChange={handleTabChange} 
        className="jd-w-full"
      >
        <TabsList className="jd-grid jd-w-full jd-grid-cols-2 jd-mb-6 jd-bg-gray-800">
          <TabsTrigger 
            value="signin" 
            className="jd-font-heading jd-text-sm data-[state=active]:jd-bg-blue-600 data-[state=active]:jd-text-white"
          >
            <LogIn className="jd-h-4 jd-w-4 jd-mr-2" />
            {getMessage('signIn', undefined, 'Sign In')}
          </TabsTrigger>
          <TabsTrigger 
            value="signup" 
            className="jd-font-heading jd-text-sm data-[state=active]:jd-bg-blue-600 data-[state=active]:jd-text-white"
          >
            <UserPlus className="jd-h-4 jd-w-4 jd-mr-2" />
              {getMessage('signUp', undefined, 'Sign Up')}
          </TabsTrigger>
        </TabsList>
        
        {message && (
          <div 
            className={`jd-p-3 jd-rounded-md jd-mb-4 jd-flex jd-items-start jd-gap-2 ${
              message.type === 'error' 
                ? 'jd-bg-red-900/30 jd-text-red-300 jd-border jd-border-red-700/50' 
                : message.type === 'success'
                  ? 'jd-bg-green-900/30 jd-text-green-300 jd-border jd-border-green-700/50'
                  : 'jd-bg-blue-900/30 jd-text-blue-300 jd-border jd-border-blue-700/50'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="jd-h-5 jd-w-5 jd-shrink-0" />
            ) : message.type === 'success' ? (
              <CheckCircle className="jd-h-5 jd-w-5 jd-shrink-0" />
            ) : (
              <RefreshCw className="jd-h-5 jd-w-5 jd-shrink-0" />
            )}
            <span className="jd-text-sm ">{message.text}</span>
          </div>
        )}
        
        <TabsContent value="signin" className="space-y-4">
          <div className="jd-space-y-3">
            <div className="jd-space-y-1">
              <Label htmlFor="email-signin" className="jd-text-gray-300 ">
                {getMessage('email', undefined, 'Email')}
              </Label>
              <div className="jd-relative">
                <Input 
                  id="email-signin"
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="jd-pl-2 jd-bg-gray-800 jd-border-gray-700 jd-text-white focus:jd-border-blue-500 focus:jd-ring-blue-500 jd-text-sm"
                />
              </div>
            </div>
            <div className="jd-space-y-1">
              <Label htmlFor="password-signin" className="jd-text-gray-300 ">
                {getMessage('password', undefined, 'Password')}
              </Label>
              <div className="jd-relative">
                <Input 
                  id="password-signin"
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="jd-pl-2 jd-bg-gray-800 jd-border-gray-700 jd-text-white  focus:jd-border-blue-500 focus:jd-ring-blue-500 jd-text-sm"
                />
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleEmailSignIn} 
            className="jd-w-full jd-font-heading jd-bg-blue-600 hover:jd-bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="jd-flex jd-items-center">
                <svg className="jd-animate-spin jd-ml-1 jd-mr-3 jd-h-4 jd-w-4 jd-text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="jd-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="jd-opacity-75 jd-fill-current jd-text-white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {getMessage('signingIn', undefined, 'Signing in...')}
              </span>
            ) : getMessage('signIn', undefined, 'Sign In')}
          </Button>

          <div className="jd-relative jd-my-4">
            <div className="jd-absolute jd-inset-0 jd-flex jd-items-center">
              <div className="jd-w-full jd-border-t jd-border-gray-700"></div>
            </div>
            <div className="jd-relative jd-flex jd-justify-center jd-jd-text-sm">
              <span className="jd-px-2 jd-bg-gray-900 jd-text-gray-400 ">
                {getMessage('or', undefined, 'Or continue with')}
              </span>
            </div>
          </div>

          <div className="jd-grid jd-gap-2">
            <Button 
              variant="outline" 
              onClick={handleGoogleSignIn} 
              className="jd-w-full jd-font-heading jd-border-gray-700 jd-text-white hover:jd-bg-gray-800"
              disabled={isLoading}
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                className="jd-h-5 jd-w-5 jd-mr-2" 
              />
              {getMessage('signInWith', ['Google']) || 'Sign in with Google'}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="signup" className="space-y-4">
        <div className="jd-space-y-3">
          <div className="jd-space-y-1">
            <Label htmlFor="name-signup" className="jd-text-gray-300 ">
              {getMessage('name', undefined, 'Name')}
            </Label>
            <div className="jd-relative">
              <Input 
                id="name-signup"
                type="text" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="jd-pl-2 jd-bg-gray-800 jd-border-gray-700 jd-text-white  focus:jd-border-blue-500 focus:jd-ring-blue-500 jd-text-sm"
              />
            </div>
          </div>
          
          <div className="jd-space-y-1">
            <Label htmlFor="email-signup" className="jd-text-gray-300 ">
              {getMessage('email', undefined, 'Email')}
            </Label>
            <div className="jd-relative">
              <Input 
                id="email-signup"
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="jd-pl-2 jd-bg-gray-800 jd-border-gray-700 jd-text-white  focus:jd-border-blue-500 focus:jd-ring-blue-500 jd-text-sm"
              />
            </div>
          </div>
          
          <div className="jd-space-y-1">
            <Label htmlFor="password-signup" className="jd-text-gray-300 ">
              {getMessage('password', undefined, 'Password')}
            </Label>
            <div className="jd-relative">
              <Input 
                id="password-signup"
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="jd-pl-2 jd-bg-gray-800 jd-border-gray-700 jd-text-white  focus:jd-border-blue-500 focus:jd-ring-blue-500 jd-text-sm"
              />
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleSignUp} 
          className="jd-w-full jd-font-heading jd-bg-blue-600 hover:jd-bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="jd-flex jd-items-center">
              <svg className="jd-animate-spin jd-ml-1 jd-mr-3 jd-h-4 jd-w-4 jd-text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="jd-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="jd-opacity-75 jd-fill-current jd-text-white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {getMessage('signingUp', undefined, 'Creating account...')}
            </span>
          ) : getMessage('signUp', undefined, 'Sign Up')}
        </Button>

        <div className="jd-relative jd-my-4">
          <div className="jd-absolute jd-inset-0 jd-flex jd-items-center">
            <div className="jd-w-full jd-border-t jd-border-gray-700"></div>
          </div>
          <div className="jd-relative jd-flex jd-justify-center jd-jd-text-sm">
            <span className="jd-px-2 jd-bg-gray-900 jd-text-gray-400 ">
              {getMessage('or', undefined, 'Or sign up with')}
            </span>
          </div>
        </div>
        
        <div className="jd-grid jd-gap-2">
          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn}
            className="jd-w-full jd-font-heading jd-border-gray-700 jd-text-white hover:jd-bg-gray-800"
            disabled={isLoading}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="jd-h-5 jd-w-5 jd-mr-2" />
            {getMessage('signUpWith', ['Google']) || 'Sign up with Google'}
          </Button>
        </div>
      </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthForm;