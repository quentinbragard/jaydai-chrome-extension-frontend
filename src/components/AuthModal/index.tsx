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

interface AuthModalProps {
  onClose?: () => void;
  initialMode?: 'signin' | 'signup';
  // New prop to handle session expired case
  isSessionExpired?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  onClose, 
  initialMode = 'signin',
  isSessionExpired = false 
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'error' | 'success' | 'info'} | null>(
    isSessionExpired 
      ? { text: chrome.i18n.getMessage('sessionExpired'), type: 'info' }
      : null
  );
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    setActiveTab(initialMode);
  }, [initialMode]);

  useEffect(() => {
    // Set message when session expired flag changes
    if (isSessionExpired) {
      setMessage({ text: chrome.i18n.getMessage('sessionExpired'), type: 'info' });
    }
  }, [isSessionExpired]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setMessage(null);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    resetForm();
  };

  const validateSignInInputs = (): boolean => {
    if (!email.trim()) {
      setMessage({text: chrome.i18n.getMessage('enterEmail'), type: 'error'});
      return false;
    }
    
    if (!password) {
      setMessage({text: chrome.i18n.getMessage('enterPassword'), type: 'error'});
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage({text: chrome.i18n.getMessage('invalidEmail'), type: 'error'});
      return false;
    }
    
    return true;
  }

  const validateSignUpInputs = (): boolean => {
    if (!validateSignInInputs()) {
      return false;
    }
    
    if (password.length < 8) {
      setMessage({text: chrome.i18n.getMessage('passwordTooShort'), type: 'error'});
      return false;
    }
    
    return true;
  }

  const handleEmailSignIn = async () => {
    if (!validateSignInInputs()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      chrome.runtime.sendMessage(
        { action: "emailSignIn", email: email.trim(), password }, 
        (response) => {
          setIsLoading(false);
          
          if (response.success) {
            toast.success(chrome.i18n.getMessage('signInSuccessful'), {
              description: chrome.i18n.getMessage('youCanNowAccess')
            });
            onClose?.();
          } else {
            // Handle specific error codes
            if (response.errorCode === 'INVALID_CREDENTIALS') {
              setMessage({
                text: chrome.i18n.getMessage('invalidCredentials'), 
                type: 'error'
              });
            } else if (response.errorCode === 'EMAIL_NOT_VERIFIED') {
              setMessage({
                text: chrome.i18n.getMessage('emailNotVerified'), 
                type: 'error'
              });
            } else {
              setMessage({
                text: response.error || chrome.i18n.getMessage('unableToProcess'), 
                type: 'error'
              });
            }
          }
        }
      );
    } catch (error) {
      setIsLoading(false);
      setMessage({
        text: chrome.i18n.getMessage('unableToProcess'), 
        type: 'error'
      });
      console.error('Auth modal error:', error);
    }
  };

  const handleSignUp = async () => {
    if (!validateSignUpInputs()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      chrome.runtime.sendMessage(
        { action: "signUp", email: email.trim(), password, name: name.trim() }, 
        (response) => {
          setIsLoading(false);
          
          if (response.success) {
            setSignupSuccess(true);
            setMessage({
              text: chrome.i18n.getMessage('signUpSuccessful'), 
              type: 'success'
            });
          } else {
            if (response.errorCode === 'EMAIL_IN_USE') {
              setMessage({
                text: chrome.i18n.getMessage('emailAlreadyInUse'), 
                type: 'error'
              });
            } else {
              setMessage({
                text: response.error || chrome.i18n.getMessage('signUpFailed'), 
                type: 'error'
              });
            }
          }
        }
      );
    } catch (error) {
      setIsLoading(false);
      setMessage({
        text: chrome.i18n.getMessage('unableToProcess'), 
        type: 'error'
      });
      console.error('Auth modal error:', error);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      chrome.runtime.sendMessage(
        { action: "googleSignIn" }, 
        (response) => {
          setIsLoading(false);
          
          if (response.success) {
            toast.success(chrome.i18n.getMessage('signInSuccessful'), {
              description: chrome.i18n.getMessage('youCanNowAccess')
            });
            onClose?.();
          } else {
            setMessage({
              text: response.error || chrome.i18n.getMessage('unableToProcess'), 
              type: 'error'
            });
          }
        }
      );
    } catch (error) {
      setIsLoading(false);
      setMessage({
        text: chrome.i18n.getMessage('unableToProcess'), 
        type: 'error'
      });
      console.error('Auth modal error:', error);
    }
  };

  // If signup is successful, show confirmation message
  if (signupSuccess) {
    return (
      <div className="py-6 flex flex-col items-center">
        <div className="bg-green-600/10 rounded-full p-3 mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-medium text-white mb-3 font-heading">
          {chrome.i18n.getMessage('emailVerificationSent')}
        </h2>
        <p className="text-gray-300 text-center mb-6 max-w-sm font-sans">
          {chrome.i18n.getMessage('emailVerificationInstructions')}
        </p>
        <Button 
          onClick={() => onClose?.()} 
          className="w-full font-heading bg-blue-600 hover:bg-blue-700"
        >
          {chrome.i18n.getMessage('close')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <h2 className="text-center text-2xl font-bold text-white font-heading mb-6">
        {activeTab === 'signin' 
          ? chrome.i18n.getMessage('signIn') 
          : chrome.i18n.getMessage('signUp')}
      </h2>
      
      <Tabs 
        defaultValue={activeTab} 
        value={activeTab} 
        onValueChange={handleTabChange} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800">
          <TabsTrigger 
            value="signin" 
            className="font-heading text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {chrome.i18n.getMessage('signIn')}
          </TabsTrigger>
          <TabsTrigger 
            value="signup" 
            className="font-heading text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {chrome.i18n.getMessage('signUp')}
          </TabsTrigger>
        </TabsList>
        
        {message && (
          <div 
            className={`p-3 rounded-md mb-4 flex items-start gap-2 ${
              message.type === 'error' 
                ? 'bg-red-900/30 text-red-300 border border-red-700/50' 
                : message.type === 'success'
                  ? 'bg-green-900/30 text-green-300 border border-green-700/50'
                  : 'bg-blue-900/30 text-blue-300 border border-blue-700/50'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="h-5 w-5 shrink-0" />
            ) : message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <RefreshCw className="h-5 w-5 shrink-0" />
            )}
            <span className="text-sm font-sans">{message.text}</span>
          </div>
        )}
        
        <TabsContent value="signin" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email-signin" className="text-gray-300 font-sans">
                {chrome.i18n.getMessage('email')}
              </Label>
              <div className="relative">
                <Input 
                  id="email-signin"
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white font-sans focus:border-blue-500 focus:ring-blue-500"
                />
                <Mail className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password-signin" className="text-gray-300 font-sans">
                {chrome.i18n.getMessage('password')}
              </Label>
              <div className="relative">
                <Input 
                  id="password-signin"
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white font-sans focus:border-blue-500 focus:ring-blue-500"
                />
                <Lock className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleEmailSignIn} 
            className="w-full font-heading bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {chrome.i18n.getMessage('signingIn')}
              </span>
            ) : chrome.i18n.getMessage('signIn')}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400 font-sans">
                {chrome.i18n.getMessage('or')}
              </span>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn} 
            className="w-full font-heading border-gray-700 text-white hover:bg-gray-800"
            disabled={isLoading}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5 mr-2" />
            {chrome.i18n.getMessage('signInWith', ['Google'])}
          </Button>
        </TabsContent>
        
        <TabsContent value="signup" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name-signup" className="text-gray-300 font-sans">
                {chrome.i18n.getMessage('name')}
              </Label>
              <div className="relative">
                <Input 
                  id="name-signup"
                  type="text" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white font-sans focus:border-blue-500 focus:ring-blue-500"
                />
                <User className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email-signup" className="text-gray-300 font-sans">
                {chrome.i18n.getMessage('email')}
              </Label>
              <div className="relative">
                <Input 
                  id="email-signup"
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white font-sans focus:border-blue-500 focus:ring-blue-500"
                />
                <Mail className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password-signup" className="text-gray-300 font-sans">
                {chrome.i18n.getMessage('password')}
              </Label>
              <div className="relative">
                <Input 
                  id="password-signup"
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white font-sans focus:border-blue-500 focus:ring-blue-500"
                />
                <Lock className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 mt-1 font-sans">
                {chrome.i18n.getMessage('passwordRequirements')}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleSignUp} 
            className="w-full font-heading bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {chrome.i18n.getMessage('signingUp')}
              </span>
            ) : chrome.i18n.getMessage('signUp')}
          </Button>
          
          <p className="text-xs text-center text-gray-400 font-sans">
            {chrome.i18n.getMessage('bySigningUp')}
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthModal;