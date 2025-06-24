// src/extension/welcome/layout/WelcomeLayout.tsx
import React from 'react';
import { Toaster } from "@/components/ui/sonner";
import { Logo } from '@/components/welcome/Logo';

interface WelcomeLayoutProps {
  children: React.ReactNode;
}

export const WelcomeLayout: React.FC<WelcomeLayoutProps> = ({ children }) => {
  return (
    <div className="jd-min-h-screen jd-bg-background jd-text-foreground jd-flex jd-items-center jd-justify-center jd-font-sans">
      <div className="jd-w-full jd-mx-auto jd-px-4">
        <div className="jd-flex jd-flex-col jd-items-center jd-py-16">
          {/* Logo */}
          <Logo />
          
          {/* Main Content */}
          {children}
        </div>
      </div>
      
      <Toaster richColors />
    </div>
  );
};