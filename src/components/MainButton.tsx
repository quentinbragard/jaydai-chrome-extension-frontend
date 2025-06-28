// src/components/MainButton.tsx

import { useEffect, useState, useRef } from 'react';
import { Toaster } from "sonner";
import { Button } from '@/components/ui/button';
import { X } from "lucide-react";
import PanelManager from '@/components/panels/PanelManager';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useMainButtonState } from '@/hooks/ui/useMainButtonState';
import { getMessage } from '@/core/utils/i18n';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { useLocalStorage } from '@/core/hooks/useLocalStorage';
import { cn } from '@/core/utils/classNames';


/**
 * Main floating button component that opens various panels
 */
const MainButton = () => {
  const {
    isOpen,
    panelType,
    setPanelType,
    notificationCount,
    buttonRef,
    toggleMenu,
    handleClosePanel,
  } = useMainButtonState();

  const [position, setPosition] = useLocalStorage<{ x: number; y: number } | null>('mainButtonPosition', null);
  const [isDragging, setIsDragging] = useState(false);
  const movedRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Use our theme detector hook to get the current theme
  const isDarkMode = useThemeDetector();
  const handleMainButtonClick = () => {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    trackEvent(EVENTS.MAIN_BUTTON_CLICKED, { darkMode: isDarkMode });
    toggleMenu();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDragging(true);
    movedRef.current = false;
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (event: PointerEvent) => {
      movedRef.current = true;
      setPosition({ x: event.clientX - offsetRef.current.x, y: event.clientY - offsetRef.current.y });
    };
    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDragging, setPosition]);

  // We don't need this event listener anymore because it's handled in useMainButtonState
  // But keeping the component structure for reference
  useEffect(() => {
    // Any additional component-specific initialization can go here
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Choose the appropriate logo based on the detected theme
  const darkLogo = chrome.runtime.getURL('images/letter-logo-white.png');
  const lightLogo = chrome.runtime.getURL('images/letter-logo-dark.png');
  const logoSrc = isDarkMode ? darkLogo : lightLogo;

  return (
    <ErrorBoundary>
      <div
        className={cn(
          'jd-fixed jd-z-[9999]',
          !position && 'jd-bottom-6 jd-right-8'
        )}
        style={position ? { top: position.y, left: position.x } : undefined}
        onPointerDown={handlePointerDown}
      >
        <div className="jd-relative">
          {/* Panel Manager */}
          <PanelManager
            isOpen={isOpen}
            onClose={handleClosePanel}
            notificationCount={notificationCount}
            activePanelType={panelType}
          />

          {/* Main Button with logo */}
          <div className="jd-relative jd-w-20 jd-h-20">
            <Button 
              ref={buttonRef}
              onClick={handleMainButtonClick}
              className="jd-bg-transparent hover:jd-bg-transparent hover:jd-scale-125 jd-transition-all jd-duration-300 jd-w-full jd-h-full jd-rounded-full jd-p-0 jd-overflow-hidden jd-flex jd-items-center jd-justify-center"
            >
              <img 
                src={logoSrc}
                alt={getMessage('appName', undefined, 'Jaydai Chrome Extension')} 
                className="jd-w-full jd-h-full jd-object-cover"
              />
              
              {/* Optional overlay icon when open */}
              {isOpen && (
                <div className="jd-absolute jd-top-1 jd-right-1 jd-bg-white jd-rounded-full jd-p-1 jd-z-10">
                  <X className="jd-h-4 jd-w-4 jd-text-gray-800" />
                </div>
              )}
            </Button>
            
            {/* Notification Badge */}
            {notificationCount > 0 && !isOpen && (
              <span 
                className="jd-absolute jd-top-1 jd-right-1 
                  jd-bg-red-500 jd-text-white 
                  jd-text-xs jd-font-semibold 
                  jd-rounded-full 
                  jd-w-5 jd-h-5 
                  jd-flex jd-items-center jd-justify-center 
                  jd-z-20 
                  jd-border jd-border-white 
                  jd-shadow-sm 
                  hover:jd-bg-red-600 
                  jd-transition-colors jd-duration-200"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default MainButton;