import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import AuthModal from '@/extension/welcome/auth/AuthModal';
import { MoveRight, LogIn, Zap, BookOpen, TrendingUp, Sparkles, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { getMessage } from '@/core/utils/i18n';
import { authService } from '@/services/auth/AuthService';
import { AuthState } from '@/types';
import "./welcome.css";

const WelcomePage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [taskIndex, setTaskIndex] = useState(0);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });
  
  // Tasks are now localized using getMessage
  const tasks = React.useMemo(
    () => [
      getMessage('aiTask1', undefined, 'write professional emails'),
      getMessage('aiTask2', undefined, 'organize complex data'),
      getMessage('aiTask3', undefined, 'create content'),
      getMessage('aiTask4', undefined, 'summarize documents'),
      getMessage('aiTask5', undefined, 'draft reports')
    ],
    []
  );

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

  // Animation effect for changing tasks
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTaskIndex((prevIndex) => 
        prevIndex === tasks.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [taskIndex, tasks]);

  const handleGetStarted = () => {
    setAuthMode('signup');
    setIsAuthOpen(true);
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setIsAuthOpen(true);
  };

  const openChatGPT = () => {
    chrome.tabs.create({ url: 'https://chat.openai.com' });
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Loading state
  if (authState.isLoading) {
    return (
      <div className="jd-min-h-screen jd-bg-background jd-text-foreground jd-flex jd-items-center jd-justify-center jd-font-sans">
        <div className="jd-text-center">
          <div className="jd-spinner-welcome">
            <div className="jd-double-bounce1"></div>
            <div className="jd-double-bounce2"></div>
          </div>
          <p className="jd-text-gray-300 jd-mt-4 jd-animate-pulse">
            {getMessage('loading', undefined, 'Loading...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="jd-min-h-screen jd-bg-background jd-text-foreground jd-flex jd-items-center jd-justify-center jd-font-sans">
      <div className="jd-w-full jd-mx-auto jd-px-4">
        <div className="jd-flex jd-flex-col jd-items-center jd-py-16">
          {/* Logo */}
          <div className="jd-logo-container jd-bg-gray-900 jd-border jd-border-gray-800 jd-mb-8">
            <img 
              src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//jaydai-extension-logo.png" 
              alt={getMessage('appName', undefined, 'Archimind Logo')} 
              className="jd-w-16 jd-h-16 jd-object-contain"
            />
          </div>
          
          {/* Main Title - Different for logged in users */}
          <h1 className="jd-text-5xl md:jd-text-6xl jd-font-medium jd-text-white jd-text-center jd-mb-6 jd-font-heading">
            {authState.isAuthenticated
              ? getMessage('welcomeBack', undefined, 'Welcome Back!')
              : getMessage('welcomeTitle', undefined, 'Welcome to Archimind')}
          </h1>
          
          {/* Logged in state: Display user info and CTA */}
          {authState.isAuthenticated && authState.user ? (
            <div className="jd-text-center jd-mb-12">
              <div className="jd-bg-blue-600/20 jd-backdrop-blur-sm jd-rounded-lg jd-p-6 jd-border jd-border-blue-500/20 jd-max-w-2xl jd-mx-auto jd-mb-8">
                <Sparkles className="jd-w-8 jd-h-8 jd-text-blue-400 jd-mx-auto jd-mb-4" />
                <h2 className="jd-text-2xl jd-font-medium jd-text-white jd-mb-2 jd-font-heading">
                  {getMessage('accountReady', undefined, 'Your AI companion is ready!')}
                </h2>
                <p className="jd-text-lg jd-text-gray-300 jd-mb-6 jd-font-sans">
                  {getMessage('loggedInAs', [authState.user.email || authState.user.name || ''], 
                    'You\'re logged in as {0}. You can now launch AI tools with enhanced capabilities.')}
                </p>
                
                <div className="jd-flex jd-flex-col sm:jd-flex-row jd-gap-4 jd-justify-center">
                  <Button 
                    size="lg"
                    onClick={openChatGPT}
                    className="jd-gap-2 jd-bg-gradient-to-r jd-from-green-600 jd-to-emerald-600 hover:jd-from-green-500 hover:jd-to-emerald-500 jd-transition-all jd-duration-300 jd-py-6 jd-rounded-lg jd-relative jd-overflow-hidden jd-group jd-min-w-52 jd-font-heading"
                  >
                    <div className="jd-absolute jd-inset-0 jd-w-full jd-h-full jd-bg-gradient-to-r jd-from-green-600/0 jd-via-green-400/10 jd-to-green-600/0 jd-transform jd-skew-x-12 jd-translate-x-full group-hover:jd-translate-x-full jd-transition-transform jd-duration-1000 jd-ease-out"></div>
                    <span className="jd-flex jd-items-center jd-justify-center jd-text-lg">
                      <img 
                        src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//chatgpt_logo.png" 
                        alt="ChatGPT" 
                        className="jd-h-6 jd-w-6 jd-mr-2" 
                      />
                      <span>{getMessage('openChatGPT', undefined, 'Open ChatGPT')}</span>
                      <ExternalLink className="jd-w-4 jd-h-4 jd-ml-2" />
                    </span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleSignOut}
                    className="jd-border-gray-700 jd-text-white hover:jd-bg-gray-800 jd-min-w-32 jd-font-heading"
                  >
                    {getMessage('signOut', undefined, 'Sign Out')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Animation Section with Single Line - Only for non-logged in users */}
              <div className="jd-animation-container jd-mb-10 jd-w-full">
                <div className="jd-w-full jd-text-3xl md:jd-text-4xl jd-text-blue-500 jd-font-semibold jd-whitespace-nowrap jd-font-heading jd-flex jd-justify-center">
                  <span>{getMessage('useAIToPrefix', undefined, 'Use AI to')} </span>
                  <span className="jd-relative jd-inline-block jd-min-w-60 jd-text-left">
                    {tasks.map((task, index) => (
                      <motion.span
                        key={index}
                        className="jd-absolute jd-left-0 jd-whitespace-nowrap jd-ml-1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: taskIndex === index ? 1 : 0,
                          y: taskIndex === index ? 0 : 20
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {task}
                      </motion.span>
                    ))}
                    {/* This maintains space even when animation is changing */}
                    <span className="jd-invisible">{tasks[0]}</span>
                  </span>
                </div>
              </div>

              <p className="jd-text-lg jd-text-gray-300 jd-max-w-2xl jd-text-center jd-mb-12 jd-font-sans">
                {getMessage('welcomeDescription', undefined, 'Your Intelligent AI Usage Companion. Our goal is to help you harness the power of AI while maintaining your unique human expertise.')}
              </p>
            </>
          )}
          
          {/* Feature Cards - Shown to all users */}
          <div className="jd-grid md:jd-grid-cols-3 jd-gap-6 jd-max-w-6xl jd-mx-auto jd-mb-12">
            <div className="jd-bg-gray-900 jd-rounded-lg jd-border jd-border-gray-800 jd-shadow-md jd-p-6 jd-text-left jd-feature-card">
              <div className="jd-flex jd-items-start jd-mb-4">
                <Zap className="jd-h-6 jd-w-6 jd-text-blue-500 jd-mr-4 jd-mt-0.5 jd-flex-shrink-0" />
                <h3 className="jd-text-lg jd-font-medium jd-text-white jd-font-heading">{getMessage('energyInsights', undefined, 'Energy Insights')}</h3>
              </div>
              <p className="jd-text-gray-300 jd-text-sm jd-font-sans">
                {getMessage('energyInsightsDesc', undefined, 'Track and optimize your AI usage with real-time energy consumption metrics.')}
              </p>
            </div>
            
            <div className="jd-bg-gray-900 jd-rounded-lg jd-border jd-border-gray-800 jd-shadow-md jd-p-6 jd-text-left jd-feature-card">
              <div className="jd-flex jd-items-start jd-mb-4">
                <BookOpen className="jd-h-6 jd-w-6 jd-text-blue-500 jd-mr-4 jd-mt-0.5 jd-flex-shrink-0" />
                <h3 className="jd-text-lg jd-font-medium jd-text-white jd-font-heading">{getMessage('smartTemplates', undefined, 'Smart Templates')}</h3>
              </div>
              <p className="jd-text-gray-300 jd-text-sm jd-font-sans">
                {getMessage('smartTemplatesDesc', undefined, 'Access a library of curated prompt templates to enhance your AI interactions.')}
              </p>
            </div>
            
            <div className="jd-bg-gray-900 jd-rounded-lg jd-border jd-border-gray-800 jd-shadow-md jd-p-6 jd-text-left jd-feature-card">
              <div className="jd-flex jd-items-start jd-mb-4">
                <TrendingUp className="jd-h-6 jd-w-6 jd-text-blue-500 jd-mr-4 jd-mt-0.5 jd-flex-shrink-0" />
                <h3 className="jd-text-lg jd-font-medium jd-text-white jd-font-heading">{getMessage('skillDevelopment', undefined, 'Skill Development')}</h3>
              </div>
              <p className="jd-text-gray-300 jd-text-sm jd-font-sans">
                {getMessage('skillDevelopmentDesc', undefined, 'Receive personalized recommendations to upskill and maintain human expertise.')}
              </p>
            </div>
          </div>
          
          {/* Call-to-Action Buttons - Only for non-logged in users */}
          {!authState.isAuthenticated && (
            <div className="jd-flex jd-flex-row jd-gap-4 jd-mb-8">
              <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                <div className="jd-flex jd-gap-4">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="jd-gap-2 jd-min-w-32 jd-text-white jd-border-gray-700 hover:jd-bg-gray-800 jd-font-heading"
                    onClick={handleSignIn}
                  >
                    {getMessage('signIn', undefined, 'Sign in')} <LogIn className="jd-w-4 jd-h-4 jd-ml-1" />
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
          )}
          
          {/* Footer */}
          <div className="jd-text-center jd-text-sm jd-text-gray-500 jd-font-sans">
            &copy; {new Date().getFullYear()} Archimind. {getMessage('allRightsReserved', undefined, 'All rights reserved')}
          </div>
        </div>
      </div>
      
      <Toaster richColors />
    </div>
  );
};

export default WelcomePage;