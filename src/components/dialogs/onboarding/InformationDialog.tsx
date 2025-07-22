// src/components/dialogs/onboarding/InformationDialog.tsx - Enhanced
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BaseDialog } from '../BaseDialog';
import { useDialog } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { Button } from '@/components/ui/button';
import { useShadowRoot } from '@/core/utils/componentInjector';
import { getMessage } from '@/core/utils/i18n';
import { useThemeDetector, useThemeClass } from '@/hooks/useThemeDetector';
import { cn } from '@/core/utils/classNames';

export const InformationDialog: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.INFORMATION);
  const shadowRoot = useShadowRoot();
  const isDarkMode = useThemeDetector();
  const themeClass = useThemeClass();
  const containerRef = useRef<HTMLDivElement>(null);

  const title = data?.title;
  const description = data?.description;
  const gifUrl = data?.gifUrl as string | undefined;
  const actionText = data?.actionText || getMessage('continue', undefined, 'Continue');
  const onAction = data?.onAction as (() => void) | undefined;
  const children = data?.children as React.ReactNode;

  // Apply theme class to the portal container
  useEffect(() => {
    if (containerRef.current) {
      // Ensure the portal container has the correct theme class
      containerRef.current.className = cn(
        'jaydai-portal-container',
        themeClass,
        isDarkMode ? 'dark' : 'light'
      );
      
      // Apply theme CSS variables
      const style = containerRef.current.style;
      style.setProperty('--theme-mode', isDarkMode ? 'dark' : 'light');
      style.setProperty('color-scheme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode, themeClass]);

  if (!isOpen) return null;

  const footer = (
    <div className="jd-flex jd-justify-end">
      <Button
        onClick={(e) => {
          e.stopPropagation();
          if (onAction) onAction();
          dialogProps.onOpenChange(false);
        }}
        className={cn(
          'jd-transition-colors',
          isDarkMode 
            ? 'jd-bg-primary hover:jd-bg-primary/90 jd-text-primary-foreground' 
            : 'jd-bg-primary hover:jd-bg-primary/90 jd-text-primary-foreground'
        )}
      >
        {actionText}
      </Button>
    </div>
  );

  const dialog = (
    <div 
      ref={containerRef}
      className={cn(
        'jaydai-portal-container',
        themeClass,
        isDarkMode ? 'dark' : 'light'
      )}
      style={{
        colorScheme: isDarkMode ? 'dark' : 'light',
        '--theme-mode': isDarkMode ? 'dark' : 'light'
      } as React.CSSProperties}
    >
      <BaseDialog
        open={isOpen}
        onOpenChange={dialogProps.onOpenChange}
        title={title}
        description={description}
        className={cn(
          "jd-max-w-5xl",
          // Ensure proper theme styling
          isDarkMode 
            ? 'jd-bg-background jd-text-foreground jd-border-border' 
            : 'jd-bg-background jd-text-foreground jd-border-border'
        )}
        footer={footer}
      >
        {gifUrl && (
          <div className={cn(
            "jd-w-full jd-mb-4 jd-rounded-md jd-overflow-hidden",
            isDarkMode ? 'jd-bg-muted/10' : 'jd-bg-muted/5'
          )}>
            <img
              src={gifUrl}
              alt={title || 'Information'}
              className={cn(
                "jd-w-full jd-object-contain jd-rounded-md",
                isDarkMode ? 'jd-opacity-90' : 'jd-opacity-100'
              )}
              onError={(e) => {
                // Handle image load errors gracefully
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {children && (
          <div className={cn(
            "jd-mt-4",
            isDarkMode 
              ? 'jd-text-foreground' 
              : 'jd-text-foreground'
          )}>
            {children}
          </div>
        )}
      </BaseDialog>
    </div>
  );

  // Use shadowRoot if available, otherwise fall back to document.body
  const portalTarget = shadowRoot || document.body;
  
  return createPortal(dialog, portalTarget);
};