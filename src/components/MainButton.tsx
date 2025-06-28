// src/components/MainButton.tsx

import { useEffect, useState, useRef } from 'react';
import { Toaster } from "sonner";
import { Button } from '@/components/ui/button';
import { X, GripVertical, Move, EllipsisVertical } from "lucide-react";
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

  // Removed showDragHandle state and related effects since three dots are always visible

  // Choose the appropriate logo based on the detected theme
  const darkLogo = chrome.runtime.getURL('images/letter-logo-white.png');
  const lightLogo = chrome.runtime.getURL('images/letter-logo-dark.png');
  const logoSrc = isDarkMode ? darkLogo : lightLogo;

  return (
    <ErrorBoundary>
      <div
        className={cn(
          'jd-fixed jd-z-[9999] jd-select-none',
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
          bottom: '24px',
          right: '24px',
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
                  'jd-w-6 jd-h-6 jd-flex jd-items-center jd-justify-center',
                  'jd-bg-white/90 jd-backdrop-blur-sm jd-rounded-full jd-cursor-grab',
                  'jd-shadow-md jd-border jd-border-gray-200/50',
                  'jd-transition-all jd-duration-200 jd-ease-in-out',
                  'hover:jd-bg-white hover:jd-shadow-lg hover:jd-scale-110',
                  isDragging && 'jd-cursor-grabbing jd-scale-110 jd-shadow-xl jd-bg-white'
                )}
                title="Drag to move"
              >
                <EllipsisVertical className={cn(
                  'jd-w-3.5 jd-h-3.5 jd-text-gray-500',
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