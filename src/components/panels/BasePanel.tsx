import React from 'react';

export interface BasePanelProps {
  onClose?: () => void;
  className?: string;
}

/**
 * Base Panel component that all panels should extend
 */
export const BasePanel: React.FC<BasePanelProps> = ({ 
  onClose,
  className,
  children 
}) => {
  return (
    <div className={`panel-container ${className || ''}`}>
      {children}
    </div>
  );
};