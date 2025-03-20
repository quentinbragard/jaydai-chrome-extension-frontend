import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";

interface MenuPanelHeaderProps {
  showBackButton: boolean;
  onBack: () => void;
  onClose: () => void;
  title?: string;
}

const MenuPanelHeader: React.FC<MenuPanelHeaderProps> = ({ showBackButton, onBack, onClose, title }) => {
  return (
    <div className="flex items-center justify-between p-2 border-b">
      <div className="flex items-center">
        {showBackButton && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {title && <span className="ml-2 font-semibold">{title}</span>}
      </div>
      <Button variant="ghost" size="sm" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MenuPanelHeader;
