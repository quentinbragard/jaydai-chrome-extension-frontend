"use client"

import React from "react"
import { Copy, Check } from "lucide-react"

interface CopyButtonProps {
  copied: boolean;
  onClick: () => void;
  variant?: 'default' | 'colorful' | 'minimal' | 'cards';
  copiedText?: string;
  copyText?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ 
  copied, 
  onClick, 
  variant = 'default',
  copiedText = 'Copié!',
  copyText = 'Copier'
}) => {
  // Generate class names based on variant
  const getButtonClasses = () => {
    switch(variant) {
      case 'colorful':
        return `text-gray-600 bg-gray-100 dark:bg-gray-800 p-4 rounded-full border border-transparent hover:text-white hover:bg-gray-600 transition-colors duration-300 shadow-sm hover:shadow-md`;
      case 'minimal':
        return `text-gray-600 hover:bg-secondary/10 p-3 rounded-full transition-colors duration-300`;
      case 'cards':
        return `flex flex-col items-center gap-2 bg-card p-4 rounded-lg border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md`;
      default:
        return `p-3 rounded-full bg-secondary/10 hover:bg-secondary/20 text-foreground transition-colors`;
    }
  };

  return variant === 'cards' ? (
    <button
      onClick={onClick}
      className={getButtonClasses()}
      aria-label="Copy link"
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary/20">
        {copied ? <Check size={24} className="text-green-500" /> : <Copy size={24} className="text-foreground" />}
      </div>
      <span className="text-foreground font-medium mt-1">
        {copied ? copiedText : copyText}
      </span>
    </button>
  ) : (
    <button
      onClick={onClick}
      className={getButtonClasses()}
      aria-label="Copy link"
    >
      {copied ? <Check size={24} className="text-green-500" /> : <Copy size={24} className="text-foreground" />}
    </button>
  );
};

export default CopyButton