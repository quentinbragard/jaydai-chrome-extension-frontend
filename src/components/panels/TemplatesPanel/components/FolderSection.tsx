// src/components/panels/TemplatesPanel/components/FolderSection.tsx

import React from 'react';
import { BookTemplate, Users, Folder, PlusCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Template, TemplateFolder } from '@/types/templates';
import FolderTree from './FolderTree';

interface FolderSectionProps {
  title: string;
  iconType: 'official' | 'organization' | 'user';
  folders: TemplateFolder[];
  type: 'official' | 'organization' | 'user';
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
  onTogglePin?: (folderId: number, isPinned: boolean) => Promise<void>;
  onDeleteFolder?: (folderId: number) => Promise<boolean>;
  onBrowseMore?: () => void;
  onCreateTemplate?: () => void;
  showBrowseMore?: boolean;
  showCreateButton?: boolean;
  showPinControls?: boolean;
  showDeleteControls?: boolean;
}

/**
 * Component for rendering a section of template folders with appropriate controls
 */
const FolderSection: React.FC<FolderSectionProps> = ({
  title,
  iconType,
  folders,
  type,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onTogglePin,
  onDeleteFolder,
  onBrowseMore,
  onCreateTemplate,
  showBrowseMore = false,
  showCreateButton = false,
  showPinControls = false,
  showDeleteControls = false
}) => {
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
      
      {folders && folders.length > 0 ? (
        <FolderTree
          folders={folders}
          type={type}
          onUseTemplate={onUseTemplate}
          onEditTemplate={onEditTemplate}
          onDeleteTemplate={onDeleteTemplate}
          onTogglePin={onTogglePin}
          onDeleteFolder={onDeleteFolder}
          showPinControls={showPinControls}
          showDeleteControls={showDeleteControls}
        />
      ) : (
        <div className="text-center py-2 text-xs text-muted-foreground px-2">
          {iconType === 'official' ? (
            chrome.i18n.getMessage('noPinnedOfficialTemplates') || 'No pinned official templates. Click Browse More to add some.'
          ) : iconType === 'organization' ? (
            chrome.i18n.getMessage('noPinnedOrganizationTemplates') || 'No pinned organization templates. Click Browse More to add some.'
          ) : (
            chrome.i18n.getMessage('noUserTemplates') || 'No user templates. Create a template to get started.'
          )}
        </div>
      )}
    </div>
  );
};

export default FolderSection;