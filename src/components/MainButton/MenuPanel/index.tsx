// src/features/MainButton/components/MenuPanel/index.tsx
import React from 'react';
import { useMenuPanel } from '../hooks/useMenuPanel';
import MenuPanelHeader from './MenuPanelHeader';
import MenuPanelMenu from './MenuPanelMenu';
import TemplatesPanel from '@/components/MainButton/MenuPanel/TemplatesPanel';
import NotificationsPanel from '@/components/MainButton/MenuPanel/NotificationsPanel';

export interface MenuPanelProps {
  isOpen: boolean;
  notificationCount: number;
  menuRef: React.RefObject<HTMLDivElement>;
  onClosePanel: () => void;
  onSaveClick: () => void;
  onSettingsClick: () => void;
  setIsPlaceholderEditorOpen: (isOpen: boolean) => void;
}

const MenuPanel: React.FC<MenuPanelProps> = ({
  isOpen,
  notificationCount,
  menuRef,
  onClosePanel,
  onSaveClick,
  onSettingsClick,
  setIsPlaceholderEditorOpen,
}) => {
  const {
    navStack,
    currentPanel,
    pushPanel,
    popPanel,
    getTitle,
  } = useMenuPanel();

  // Render the appropriate content based on the current panel
  const renderContent = () => {
    switch (currentPanel.type) {
      case 'menu':
        return (
          <MenuPanelMenu
            onSelect={(panel) => {
              if (panel === 'templates') {
                pushPanel({ type: 'templates' });
              } else if (panel === 'notifications') {
                pushPanel({ type: 'notifications' });
              }
            }}
            notificationCount={notificationCount}
            onSaveClick={onSaveClick}
            onSettingsClick={onSettingsClick}
          />
        );
      case 'templates':
      case 'browse-official':
      case 'browse-organization':
        return (
          <TemplatesPanel
            view={currentPanel.type}
            onViewChange={(newView) => {
              pushPanel({ type: newView });
            }}
            setIsPlaceholderEditorOpen={setIsPlaceholderEditorOpen}
          />
        );
      case 'notifications':
        return <NotificationsPanel />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute backdrop-blur-sm bottom-full mb-2 right-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150"
    >
      <MenuPanelHeader
        showBackButton={navStack.length > 1}
        onBack={popPanel}
        onClose={onClosePanel}
        title={getTitle()}
      />
      <div className="p-2 dark:bg-white dark:text-black bg-gray-800 rounded-b-md">{renderContent()}</div>
    </div>
  );
};

export default MenuPanel;