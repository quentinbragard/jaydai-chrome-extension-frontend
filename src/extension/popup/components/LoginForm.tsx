// src/extension/popup/components/LoginForm.tsx
import { useState } from 'react';
import { getMessage } from '@/core/utils/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!email || !password) {
      setLoginError(getMessage('invalidCredentials'));
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement email login
      console.log('Email login:', email, password);
    } catch (error) {
      setLoginError(getMessage('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement Google login
      console.log('Google login');
    } catch (error) {
      setLoginError(getMessage('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{getMessage('email')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{getMessage('password')}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {loginError && (
          <p className="text-sm text-red-500">{loginError}</p>
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? getMessage('signingIn') : getMessage('signIn')}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {getMessage('or')}
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        <img 
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
          alt="Google" 
          className="mr-2 h-4 w-4" 
        />
        {getMessage('signInWith', ['Google'])}
      </Button>

      <Button
        variant="link"
        type="button"
        className="w-full"
        onClick={() => window.open('https://archimind.ai/signup', '_blank')}
      >
        {getMessage('createAccount')}
      </Button>
    </div>
  );
}