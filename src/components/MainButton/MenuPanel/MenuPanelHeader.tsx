import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";

interface MenuPanelHeaderProps {
  showBackButton: boolean;
  onBack: () => void;
  onClose: () => void;
  title?: string;
}

const MenuPanelHeader: React.FC<MenuPanelHeaderProps> = ({ 
  showBackButton, 
  onBack, 
  onClose, 
  title 
}) => {
  console.log('title', chrome.i18n.getMessage("templates"));
  return (
    <div className="flex items-center justify-between p-2 border-b dark:bg-white dark:text-black bg-gray-800 rounded-t-md">
      <div className="flex items-center">

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-8 w-8 p-0 mr-2"
            disabled={!showBackButton}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
    
        <span className="font-semibold text-sm text-white dark:text-black">{chrome.i18n.getMessage(title || '') ? chrome.i18n.getMessage(title|| '') : "Menu"}</span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClose}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MenuPanelHeader;