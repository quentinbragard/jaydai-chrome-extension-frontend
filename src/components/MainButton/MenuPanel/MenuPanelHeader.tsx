import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";

interface MenuPanelHeaderProps {
  showBackButton: boolean;
  onBack: () => void;
  onClose: () => void;
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const MenuPanelHeader: React.FC<MenuPanelHeaderProps> = ({ 
  showBackButton, 
  onBack, 
  onClose, 
  title,
  icon: Icon 
}) => {
  // Try to use i18n, fall back to provided title or "Menu"
  const displayTitle = chrome.i18n.getMessage(title || '') || title || "Menu";
  
  return (
    <div className="flex items-center justify-between p-2 border-b dark:bg-white dark:text-black bg-gray-800 rounded-t-md">
      <div className="flex items-center">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-8 w-8 p-0 mr-2 text-white hover:text-white hover:bg-gray-700 dark:text-black dark:hover:bg-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <span className="font-semibold text-sm text-white dark:text-black flex items-center">
          {Icon && <Icon className="h-4 w-4 mr-2" />}
          {displayTitle}
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClose}
        className="h-8 w-8 p-0 text-white hover:text-white hover:bg-gray-700 dark:text-black dark:hover:bg-gray-200"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MenuPanelHeader;