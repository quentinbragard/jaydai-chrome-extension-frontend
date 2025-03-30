// src/components/layout/MainButton.tsx

import { Toaster } from "sonner";
import { Button } from '@/components/ui/button';
import { X } from "lucide-react";
import PanelManager from '@/components/panels/PanelManager';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useMainButtonState } from '@/hooks/ui/useMainButtonState';

/**
 * Main floating button component that opens various panels
 */

const MainButton = () => {
  const {
    isOpen,
    notificationCount,
    buttonRef,
    toggleMenu,
    handleClosePanel,
  } = useMainButtonState();

  return (
    <ErrorBoundary>
      <div className="fixed bottom-6 right-2 z-[9999]">
        <div className="relative">
          {/* Panel Manager */}
          <PanelManager
            isOpen={isOpen}
            onClose={handleClosePanel}
            notificationCount={notificationCount}
          />

          {/* Main Button with logo */}
          <div className="relative w-16 h-16">
            <Button 
              ref={buttonRef}
              onClick={toggleMenu}
              className="bg-transparent w-full h-full rounded-full shadow-lg p-0 overflow-hidden flex items-center justify-center"
            >
              <img 
                src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images/jaydai-extension-logo.png" 
                alt="Archimind Logo" 
                className="w-full h-full object-cover"
              />
              
              {/* Optional overlay icon when open */}
              {isOpen && (
                <div className="absolute top-1 right-1 bg-white rounded-full p-1 z-10">
                  <X className="h-4 w-4 text-gray-800" />
                </div>
              )}
            </Button>
            
            {/* Notification Badge */}
            {notificationCount > 0 && !isOpen && (
              <span 
                className="absolute -top-1 -right-1 
                  bg-red-500 text-white 
                  text-xs font-semibold 
                  rounded-full 
                  w-5 h-5 
                  flex items-center justify-center 
                  z-20 
                  border border-white 
                  shadow-sm 
                  hover:bg-red-600 
                  transition-colors duration-200"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    </ErrorBoundary>
  );
};

export default MainButton;