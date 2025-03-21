import React from 'react';
import { Toaster } from "sonner";
import ButtonIcon from './ButtonIcon';
import MenuPanel from './MenuPanel';
import { useMainButtonState } from './hooks/useMainButtonState';
import { MainButtonProps } from './types';

/**
 * Main floating button component that opens various panels
 */
const MainButton: React.FC<MainButtonProps> = ({ onSettingsClick, onSaveClick }) => {
  const {
    isOpen,
    notificationCount,
    buttonRef,
    menuRef,
    toggleMenu,
    handleClosePanel,
    handleImageLoad,
    handleImageError,
    handleSaveClick,
    handleSettingsClick,
    isPlaceholderEditorOpen,
    setIsPlaceholderEditorOpen
  } = useMainButtonState({ onSettingsClick, onSaveClick });

  return (
    <div className="fixed bottom-6 right-2 z-[9999]">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Panel that appears above the main button */}
        {isOpen && (
          <MenuPanel
            isOpen={isOpen}
            notificationCount={notificationCount}
            menuRef={menuRef}
            onClosePanel={handleClosePanel}
            onSaveClick={handleSaveClick}
            onSettingsClick={handleSettingsClick}
            setIsPlaceholderEditorOpen={setIsPlaceholderEditorOpen}
          />
        )}

        {/* Main Button with logo */}
        <ButtonIcon
          isOpen={isOpen}
          notificationCount={notificationCount}
          buttonRef={buttonRef}
          toggleMenu={toggleMenu}
          handleImageLoad={handleImageLoad}
          handleImageError={handleImageError}
        />
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
};

export default MainButton;