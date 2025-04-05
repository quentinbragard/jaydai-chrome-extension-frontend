import React, { useState, useEffect } from 'react';
import { 
  Mail,
  Lock,
  LogIn,
  LogOut,
  UserPlus,
  ExternalLink
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import './popup.css';
import { getMessage } from '@/core/utils/i18n';
import { authService } from '@/services/auth/AuthService';
import { AuthState } from '@/types';

// AI Tool Configuration
const AI_TOOLS = [
  {
    name: 'ChatGPT',
    icon: <img src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//chatgpt_logo.png" alt="ChatGPT" className="h-6 w-6" />,
    url: 'https://chat.openai.com/',
    description: 'OpenAI\'s conversational AI',
    disabled: false
  },
  {
    name: 'Claude',
    icon: <img src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//claude_logo.png" alt="Claude" className="h-6 w-6" />,
    url: 'https://claude.ai/',
    description: 'Anthropic\'s AI assistant',
    disabled: true
  },
  {
    name: 'Gemini',
    icon: <img src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//gemini_logo.png" alt="Gemini" className="h-6 w-6" />,
    url: 'https://gemini.google.com/',
    description: 'Google\'s generative AI',
    disabled: true
  },
  {
    name: 'Mistral',
    icon: <img src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//mistral_logo.png" alt="Mistral" className="h-6 w-6" />,
    url: 'https://chat.mistral.ai/',
    description: 'Mistral AI\'s conversational model',
    disabled: true
  },
  {
    name: 'Perplexity',
    icon: <img src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//perplexity_logo.png" alt="Perplexity" className="h-6 w-6" />,
    url: 'https://www.perplexity.ai/',
    description: 'AI-powered search and chat',
    disabled: true
  }
];

const ExtensionPopup: React.FC = () => {
  // Auth state
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe(state => {
      setAuthState(state);
    });

    // Initialize auth service if needed
    if (!authService.isInitialized()) {
      authService.initialize();
    }

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, []);

  const openTool = (url: string) => {
    chrome.tabs.create({ url });
  };

  const openWelcomePage = () => {
    chrome.tabs.create({ url: 'welcome.html' });
  };

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

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast.success(getMessage('signedOut', undefined, 'Signed out successfully'));
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(getMessage('logoutFailed', undefined, 'Failed to sign out'));
    }
  };

  // Loading state
  if (authState.isLoading) {
    return (
      <div className="w-80 bg-background flex flex-col items-center justify-center h-64 p-4 space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Authenticated view
  if (authState.isAuthenticated && authState.user) {
    return (
      <div className="w-80 bg-background">
        <Card className="w-full border-none shadow-lg">
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg">
            <CardTitle className="text-white text-xl font-bold text-center">
              {getMessage('aiToolLauncher', undefined, 'AI Tool Launcher')}
            </CardTitle>
            <div className="text-sm text-blue-100 text-center">
              {getMessage('signedInAs', undefined, 'Signed in as')}: {authState.user.email || authState.user.name}
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3 mt-2">
            {AI_TOOLS.map((tool) => (
              <div key={tool.name} className="relative">
                <Button 
                  variant={tool.disabled ? "outline" : "default"}
                  className={`w-full justify-start space-x-3 py-6 ${tool.disabled ? 'opacity-70 hover:opacity-70 cursor-not-allowed' : 'hover:shadow-md transition-all'}`}
                  onClick={() => !tool.disabled && openTool(tool.url)}
                  disabled={tool.disabled}
                >
                  <div className="flex items-center w-full">
                    <div className="flex-shrink-0 mr-3">
                      {tool.icon}
                    </div>
                    <div className="flex-grow text-left">
                      <div className="font-semibold">{tool.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {tool.description}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {!tool.disabled && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </Button>
                {tool.disabled && (
                  <Badge 
                    className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none text-xs font-medium px-2 py-1 rounded-full shadow-md coming-soon-badge"
                  >
                    Coming Soon
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter className="border-t pt-3 pb-3 flex justify-center">
            <Button 
              variant="ghost" 
              className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {getMessage('signOut', undefined, 'Sign Out')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Unauthenticated view
  return (
    <div className="w-80 bg-background">
      <Card className="w-full border-none shadow-lg">
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg">
          <CardTitle className="text-white text-xl font-bold text-center">
            {getMessage('welcomeToArchimind', undefined, 'Welcome to Archimind')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 mt-2">
          {/* Login Form */}
          <div className="space-y-3">
            {loginError && (
              <div className="bg-red-500/10 text-red-500 border border-red-300/20 p-3 rounded-md text-sm font-medium">
                {loginError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email-signin" className="text-foreground font-medium">
                {getMessage('email', undefined, 'Email')}
              </Label>
              <div className="relative">
                <Input 
                  id="email-signin"
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background border-input focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoggingIn}
                />
                <Mail className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password-signin" className="text-foreground font-medium">
                {getMessage('password', undefined, 'Password')}
              </Label>
              <div className="relative">
                <Input 
                  id="password-signin"
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background border-input focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoggingIn}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleEmailLogin();
                    }
                  }}
                />
                <Lock className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            
            <Button 
              onClick={handleEmailLogin} 
              className="w-full bg-blue-600 hover:bg-blue-700 transition-colors py-5 mt-2"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {getMessage('signingIn', undefined, 'Signing in...')}
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  {getMessage('signIn', undefined, 'Sign In')}
                </span>
              )}
            </Button>
          </div>
  
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                {getMessage('or', undefined, 'Or')}
              </span>
            </div>
          </div>
  
          <div className="grid gap-2">
            <Button 
              variant="outline" 
              onClick={handleGoogleLogin} 
              className="w-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors py-5"
              disabled={isLoggingIn}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5 mr-2" />
              {getMessage('signInWith', ['Google'], 'Sign in with Google')}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={openWelcomePage}
              className="w-full mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 transition-colors py-5"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {getMessage('createAccount', undefined, 'Create Account')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExtensionPopup;