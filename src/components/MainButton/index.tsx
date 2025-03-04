import React from 'react';
import { Toaster } from "sonner";
import { useMainButtonLogic } from './useMainButtonLogic';
import ButtonIcon from './ButtonIcon';
import MenuPanel from './MenuPanel';
import { MainButtonProps } from './types';

const MainButton: React.FC<MainButtonProps> = ({ onSettingsClick, onSaveClick }) => {
  const {
    isOpen,
    activePanel,
    notificationCount,
    buttonRef,
    menuRef,
    toggleMenu,
    openPanel,
    handleClosePanel,
    handleImageLoad,
    handleImageError,
  } = useMainButtonLogic();

  const handleSaveClick = () => {
    onSaveClick && onSaveClick();
    handleClosePanel();
  };

  const handleSettingsClick = () => {
    onSettingsClick && onSettingsClick();
    handleClosePanel();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Wrap the button and panel in a relative container */}
      <div className="relative">
        {/* Panel that appears above the main button */}
        <MenuPanel
          isOpen={isOpen}
          activePanel={activePanel}
          notificationCount={notificationCount}
          menuRef={menuRef}
          openPanel={openPanel}
          handleClosePanel={handleClosePanel}
          handleSaveClick={handleSaveClick}
          handleSettingsClick={handleSettingsClick}
        />

        {/* Main Button with logo loaded from Supabase */}
        <ButtonIcon
          isOpen={isOpen}
          notificationCount={notificationCount}
          buttonRef={buttonRef}
          toggleMenu={toggleMenu}
          handleImageLoad={handleImageLoad}
          handleImageError={handleImageError}
        />
      </div>
      <Toaster />
    </div>
  );
};

export default MainButton;
