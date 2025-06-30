// src/components/MainButton.tsx

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Move } from "lucide-react";
import PanelManager from '@/components/panels/PanelManager';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useMainButtonState } from '@/hooks/ui/useMainButtonState';
import { getMessage } from '@/core/utils/i18n';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { cn } from '@/core/utils/classNames';

/**
 * Main floating button component that opens various panels
 */
const MainButton = () => {
  const {
    isOpen,
    panelType,
    notificationCount,
    buttonRef,
    toggleMenu,
    handleClosePanel,
  } = useMainButtonState();

  // Position chosen by the user (persisted in localStorage)
  const [savedPosition, setSavedPosition] = useState<{ x: number; y: number } | null>(null);
  // Actual position rendered on screen after clamping to the viewport
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const movedRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragHandleRef = useRef<HTMLDivElement>(null);



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
    // Only allow dragging from the three dots drag handle (and only when it's visible)
    if (!dragHandleRef.current?.contains(e.target as Node) || isOpen) return;
    
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDragging(true);
    movedRef.current = false;
    
    // Prevent button click when starting drag
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (event: PointerEvent) => {
      movedRef.current = true;
      const newPos = {
        x: event.clientX - offsetRef.current.x,
        y: event.clientY - offsetRef.current.y,
      };
      setPosition(newPos);
    };

    const handleUp = (event: PointerEvent) => {
      setIsDragging(false);
      if (movedRef.current) {
        const newPos = {
          x: event.clientX - offsetRef.current.x,
          y: event.clientY - offsetRef.current.y,
        };
        setPosition(newPos);
        setSavedPosition(newPos);
        try {
          window.localStorage.setItem('mainButtonPosition', JSON.stringify(newPos));
        } catch (error) {
          console.error('Error storing main button position:', error);
        }
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDragging]);

  // Load persisted position and update the on-screen position within viewport bounds
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('mainButtonPosition');
      if (stored) {
        setSavedPosition(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error reading main button position:', error);
    }
  }, []);

  useEffect(() => {
    const clampPosition = () => {
      if (!savedPosition) {
        setPosition(null);
        return;
      }
      const size = buttonRef.current?.offsetWidth || 80;
      const maxX = window.innerWidth - size;
      const maxY = window.innerHeight - size;
      let { x, y } = savedPosition;
      x = Math.min(Math.max(0, x), maxX);
      y = Math.min(Math.max(0, y), maxY);
      setPosition({ x, y });
    };

    clampPosition();
    window.addEventListener('resize', clampPosition);
    return () => window.removeEventListener('resize', clampPosition);
  }, [savedPosition, buttonRef]);

  // Removed showDragHandle state and related effects since three dots are always visible

  // Choose the appropriate logo based on the detected theme
  const darkLogo = chrome.runtime.getURL('images/letter-logo-white.png');
  const lightLogo = chrome.runtime.getURL('images/letter-logo-dark.png');
  const logoSrc = isDarkMode ? darkLogo : lightLogo;

  return (
    <ErrorBoundary>
      <div
        className={cn(
          'jd-fixed jd-z-[9999] jd-select-none  jd-rounded-md jd-group',
          // Always ensure bottom-right positioning when no custom position is set
          !position && 'jd-bottom-6 jd-right-6',
          isDragging && 'jd-cursor-grabbing'
        )}
        style={position ? { 
          top: `${position.y}px`, 
          left: `${position.x}px`,
          bottom: 'auto',
          right: 'auto'
        } : {
          // Explicit positioning for bottom-right when no saved position
          top: 'auto',
          left: 'auto'
        }}
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

          {/* Main Button Container */}
          <div className="jd-relative jd-w-20 jd-h-20">
            {/* Three dots drag handle - top right corner, hidden when panel is open */}
            {!isOpen && (
              <div
                ref={dragHandleRef}
                className={cn(
                  'jd-absolute jd-top-1 jd-right-1 jd-z-30',
                  'jd-w-5 jd-h-5 jd-flex jd-items-center jd-justify-center',
                  'jd-bg-white/90 jd-backdrop-blur-sm jd-rounded-full jd-cursor-grab',
                  'jd-shadow-md jd-border jd-border-gray-200/50',
                  'jd-transition-all jd-duration-200 jd-ease-in-out',
                  'jd-opacity-0 jd-pointer-events-none group-hover:jd-opacity-100 group-hover:jd-pointer-events-auto',
                  'hover:jd-bg-white hover:jd-shadow-lg hover:jd-scale-110',
                  isDragging && 'jd-cursor-grabbing jd-scale-110 jd-shadow-xl jd-bg-white jd-opacity-100 jd-pointer-events-auto'
                )}
                title={getMessage('dragToMove', undefined, 'Drag to move')}
              >
                <Move className={cn(
                  'jd-w-3 jd-h-3 jd-text-gray-500',
                  'jd-transition-all jd-duration-200',
                  isDragging && 'jd-text-gray-700'
                )} />
              </div>
            )}

            {/* Main Button with logo - only clickable, not draggable */}
            <Button 
              ref={buttonRef}
              onClick={handleMainButtonClick}
              className={cn(
                'jd-bg-transparent hover:jd-bg-transparent jd-transition-all jd-duration-300',
                'jd-w-full jd-h-full jd-rounded-full jd-p-0 jd-overflow-hidden',
                'jd-flex jd-items-center jd-justify-center jd-z-20',
                'hover:jd-scale-110 hover:jd-shadow-lg',
                'jd-cursor-pointer',
                isDragging && 'jd-scale-105'
              )}
            >
              <img 
                src={logoSrc}
                alt={getMessage('appName', undefined, 'Jaydai Chrome Extension')} 
                className={cn(
                  'jd-w-full jd-h-full jd-object-cover jd-pointer-events-none',
                  'jd-transition-all jd-duration-300',
                  isDragging && 'jd-opacity-80'
                )}
                draggable={false}
              />
              
              {/* Close icon when panel is open */}
              {isOpen && (
                <div className="jd-absolute jd-top-1 jd-right-1 jd-bg-white jd-rounded-full jd-p-1 jd-z-10 jd-shadow-sm">
                  <X className="jd-h-4 jd-w-4 jd-text-gray-800" />
                </div>
              )}
            </Button>
            
            {/* Notification Badge - positioned to avoid conflict with drag handle */}
            {notificationCount > 0 && !isOpen && (
              <span 
                className="jd-absolute jd-top-1 jd-left-1 
                  jd-bg-red-500 jd-text-white 
                  jd-text-xs jd-font-semibold 
                  jd-rounded-full 
                  jd-w-5 jd-h-5 
                  jd-flex jd-items-center jd-justify-center 
                  jd-z-40 
                  jd-border-2 jd-border-white 
                  jd-shadow-sm 
                  hover:jd-bg-red-600 
                  jd-transition-colors jd-duration-200
                  jd-pointer-events-none"
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