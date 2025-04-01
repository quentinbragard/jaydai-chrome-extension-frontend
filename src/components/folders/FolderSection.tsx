// src/components/folders/FolderSection.tsx
import { ReactNode, useState } from 'react';
import { BookTemplate, Users, Folder, PlusCircle, ChevronDown, Building2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMessage } from '@/core/utils/i18n';

interface FolderSectionProps {
  title: string;
  iconType: 'official' | 'organization' | 'user';
  onBrowseMore?: () => void;
  onCreateTemplate?: () => void;
  showBrowseMore?: boolean;
  showCreateButton?: boolean;
  isEmpty?: boolean; // New prop to check if content is empty
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
  isEmpty = false,
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

  // Handle contact sales click
  const handleContactSales = () => {
    window.open('mailto:contact@jayd.ai?subject=Enterprise%20Templates%20Access', '_blank');
  };

  // Render organization CTA if it's an organization section and it's empty
  const renderOrganizationCTA = () => {
    if (iconType === 'organization' && isEmpty) {
      return (
        <div className="flex flex-col items-center justify-center py-3 px-3 text-center space-y-2 bg-gray-800/50 rounded-lg my-1 mx-1">
          <div className="rounded-full bg-gray-800 p-2">
            <Building2 className="h-4 w-4 text-gray-500" />
          </div>
          <div className="flex items-center gap-1 text-amber-400 text-xs font-medium">
            <Lock className="h-3 w-3" />
            {getMessage('enterprise_feature', undefined, 'Enterprise Feature')}
          </div>
          <h3 className="text-sm font-medium">
            {getMessage('organization_templates_title', undefined, 'Enterprise Templates')}
          </h3>
          <p className="text-xs text-gray-500 text-gray-400 max-w-xs">
            {getMessage('organization_templates_description', undefined, 
              'Access to organization templates is an enterprise feature. Contact us to enable this for your team.')}
          </p>
          <Button 
            variant="outline"
            size="sm"
            className="mt-1 flex items-center gap-1 text-xs py-1"
            onClick={handleContactSales}
          >
            <Mail className="h-3 w-3" />
            {getMessage('contact_enterprise_sales', undefined, 'Contact Sales')}
          </Button>
        </div>
      );
    }
    return null;
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
            {getMessage('browseMore', undefined, 'Browse More')}
          </Button>
        )}
        
        {/* Show Create button */}
        {showCreateButton && onCreateTemplate && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onCreateTemplate}
            title={getMessage('newTemplate', undefined, 'New Template')}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Organization CTA if applicable */}
      {renderOrganizationCTA()}
      
      {/* Show children only if not showing organization CTA */}
      {!(iconType === 'organization' && isEmpty) && children}
    </div>
  );
}