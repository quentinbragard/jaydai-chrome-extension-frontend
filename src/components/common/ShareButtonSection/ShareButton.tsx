"use client"

import React from "react"

import { WhatsAppIcon, FacebookIcon, LinkedInIcon, EmailIcon } from "./ShareIcons"

interface ShareButtonProps {
  platform: string;
  variant?: 'default' | 'colorful' | 'minimal' | 'cards';
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ 
  platform,
  variant = 'default',
  onClick,
  onHover,
  onLeave
}) => {
  // Platform configuration
  const platformConfig: Record<string, { 
    icon: React.ReactNode, 
    color: string, 
    hoverColor: string, 
    bgColor: string, 
    label: string 
  }> = {
    
    facebook: { 
      icon: <FacebookIcon size={24} />, 
      color: "text-blue-600", 
      hoverColor: "hover:bg-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      label: "Facebook"
    },
    linkedin: { 
      icon: <LinkedInIcon size={24} />, 
      color: "text-blue-700", 
      hoverColor: "hover:bg-blue-700",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      label: "LinkedIn"
    },
    whatsapp: { 
      icon: <WhatsAppIcon size={24} />, 
      color: "text-green-500", 
      hoverColor: "hover:bg-green-500",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      label: "WhatsApp"
    },
    email: { 
      icon: <EmailIcon size={24} />, 
      color: "text-amber-600", 
      hoverColor: "hover:bg-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      label: "Email"
    }
  };

  const config = platformConfig[platform] || {
    icon: <Twitter size={24} />,
    color: "text-gray-600",
    hoverColor: "hover:bg-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    label: platform
  };

  // Generate class names based on variant
  const getButtonClasses = () => {
    switch(variant) {
      case 'colorful':
        return `${config.color} ${config.bgColor} p-4 rounded-full border border-transparent hover:text-white ${config.hoverColor} transition-colors duration-300 shadow-sm hover:shadow-md`;
      case 'minimal':
        return `${config.color} hover:bg-secondary/10 p-3 rounded-full transition-colors duration-300`;
      case 'cards':
        return `flex flex-col items-center gap-2 bg-card p-4 rounded-lg border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md`;
      default:
        return `p-3 rounded-full bg-secondary/10 hover:bg-secondary/20 text-foreground transition-colors`;
    }
  };

  return variant === 'cards' ? (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={getButtonClasses()}
      aria-label={`Share on ${config.label}`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.bgColor}`}>
        {config.icon}
      </div>
      <span className="text-foreground font-medium mt-1">{config.label}</span>
    </button>
  ) : (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={getButtonClasses()}
      aria-label={`Share on ${config.label}`}
    >
      {config.icon}
    </button>
  );
};

export default ShareButton