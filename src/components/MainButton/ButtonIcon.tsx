import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// Use the Supabase public bucket URL for the logo
const SUPABASE_LOGO_URL = "https://gjszbwfzgnwblvdehzcq.supabase.co/storage/v1/object/public/chrome_extension_assets/archimind-logo.png";

interface ButtonIconProps {
  isOpen: boolean;
  notificationCount: number;
  buttonRef: React.RefObject<HTMLButtonElement>;
  toggleMenu: () => void;
  handleImageLoad: () => void;
  handleImageError: () => void;
}

const ButtonIcon: React.FC<ButtonIconProps> = ({
  isOpen,
  notificationCount,
  buttonRef,
  toggleMenu,
  handleImageLoad,
  handleImageError
}) => {
  return (
    <Button 
      ref={buttonRef}
      onClick={toggleMenu}
      className="h-16 w-16 rounded-full shadow-lg relative bg-white p-0 overflow-hidden flex items-center justify-center"
    >
      <img 
        src={SUPABASE_LOGO_URL} 
        alt="Archimind Logo" 
        className="w-full h-full object-cover"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      
      {/* Optional overlay icon when open */}
      {isOpen && (
        <div className="absolute top-1 right-1 bg-white rounded-full p-1 z-10">
          <X className="h-4 w-4 text-gray-800" />
        </div>
      )}
      
      {/* Notification badge when closed */}
      {notificationCount > 0 && !isOpen && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center z-10">
          {notificationCount > 9 ? '9+' : notificationCount}
        </span>
      )}
    </Button>
  );
};

export default ButtonIcon; 