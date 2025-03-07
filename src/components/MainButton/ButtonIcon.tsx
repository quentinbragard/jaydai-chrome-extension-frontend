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
    <div className="relative w-16 h-16">
      <Button 
        ref={buttonRef}
        onClick={toggleMenu}
        className="w-full h-full rounded-full shadow-lg bg-white p-0 overflow-hidden flex items-center justify-center"
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
      </Button>
      
      {/* More Subtle Notification Badge */}
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
  );
};

export default ButtonIcon;