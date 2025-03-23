// src/components/templates/FolderSection.tsx
import React, { ReactNode } from 'react';
import { BookTemplate, Users, Folder, PlusCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateFolder } from '@/types/templates';

interface FolderSectionProps {
  title: string;
  iconType: 'official' | 'organization' | 'user';
  onBrowseMore?: () => void;
  onCreateTemplate?: () => void;
  showBrowseMore?: boolean;
  showCreateButton?: boolean;
  children: ReactNode;
}

/**
 * Component for rendering a section of template folders with appropriate controls
 */
export function FolderSection({
  title,
  iconType,
  onBrowseMore,
  onCreateTemplate,
  showBrowseMore = false,
  showCreateButton = false,
  children
}: FolderSectionProps) {
  // Select the appropriate icon based on the iconType
  const renderIcon = () => {
    switch (iconType) {
      case 'official':
        return <BookTemplate className="mr-2 h-4 w-4" />;
      case 'organization':
        return <Users className="mr-2 h-4 w-4" />;
      case 'user':
      default:
        return <Folder className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-2 px-2">
        <div className="flex items-center">
          {renderIcon()}
          {title}
        </div>
        
        {/* Show Browse More button */}
        {showBrowseMore && onBrowseMore && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onBrowseMore}
          >
            <ChevronDown className="h-3.5 w-3.5 mr-1" />
            {chrome.i18n.getMessage('browseMore') || 'Browse More'}
          </Button>
        )}
        
        {/* Show Create button */}
        {showCreateButton && onCreateTemplate && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onCreateTemplate}
            title={chrome.i18n.getMessage('newTemplate') || 'New Template'}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Content (folder list or empty message) */}
      {children}
    </div>
  );
}