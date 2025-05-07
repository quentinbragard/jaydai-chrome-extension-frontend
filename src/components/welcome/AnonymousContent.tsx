 // Anonymous content shown to non-logged in users
 import { AnimatedTaskText } from '@/components/welcome/AnimatedTaskText';
 import { getMessage } from '@/core/utils/i18n';
import { FeatureGrid } from '@/components/welcome/FeatureGrid';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import AuthModal from '@/extension/welcome/auth/AuthModal';
import { useAuthModal } from '@/hooks/auth/useAuthModal';
export const AnonymousContent: React.FC = () => {
    // Auth modal state
    const {
        authMode,
        isAuthOpen,
        setIsAuthOpen,
        handleGetStarted,
        handleSignIn
      } = useAuthModal();

  return (
    <>
      {/* Animation Section with Single Line - Only for non-logged in users */}
      <AnimatedTaskText />
      <FeatureGrid />

      <p className="jd-text-lg jd-text-gray-300 jd-max-w-2xl jd-text-center jd-mb-12 jd-font-sans">
        {getMessage('welcomeDescription', undefined, 'Your Intelligent AI Usage Companion. Our goal is to help you harness the power of AI while maintaining your unique human expertise.')}
      </p>

      <div className="jd-flex jd-flex-row jd-gap-4 jd-mb-8">
          <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
            <div className="jd-flex jd-gap-4">
              <Button 
                size="lg" 
                className="jd-gap-2 jd-bg-blue-600 hover:jd-bg-blue-700 jd-min-w-32 jd-font-heading"
                onClick={handleGetStarted}
              >
                {getMessage('getStarted', undefined, 'Get Started')}
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="jd-gap-2 jd-min-w-32 jd-text-white jd-border-gray-700 hover:jd-bg-gray-800 jd-font-heading"
                onClick={handleSignIn}
              >
                {getMessage('signIn', undefined, 'Sign In')}
              </Button>
            </div>
            <DialogContent className="sm:jd-max-w-md jd-bg-gray-950 jd-border-gray-800">
              <AuthModal 
                onClose={() => setIsAuthOpen(false)} 
                initialMode={authMode}
              />
            </DialogContent>
          </Dialog>
        </div>
    </>
  );
};