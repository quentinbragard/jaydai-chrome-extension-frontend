
// src/components/folders/FolderSection.tsx
import { ReactNode, useEffect } from 'react';
import { BookTemplate, Users, Folder, PlusCircle, ChevronDown, Building2, Mail, Lock , FolderPlus} from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming this is your Shadcn UI Button
import { getMessage } from '@/core/utils/i18n';
import { cn } from '@/core/utils/classNames'; // Import cn if needed for combining classes
import { OrganizationImage } from '@/components/organizations';
import { Organization } from '@/types/organizations';
import { trackEvent, EVENTS } from '@/utils/analytics';

interface FolderSectionProps {
  title: string;
  iconType: 'company' | 'organization' | 'user';
  onBrowseMore?: () => void;
  onCreateTemplate?: () => void;
  showBrowseMore?: boolean;
  showCreateButton?: boolean;
  isEmpty?: boolean;
  children: ReactNode;
  organizations?: Organization[]; // Use centralized type
}

export function FolderSection({
  title,
  iconType,
  onBrowseMore,
  onCreateTemplate,
  onCreateFolder,
  showBrowseMore = false,
  showCreateButton = false,
  showCreateFolderButton = false,
  isEmpty = false,
  children
}: FolderSectionProps) {

  useEffect(() => {
    if (iconType === 'organization') {
      trackEvent(EVENTS.ENTERPRISE_LIBRARY_ACCESSED, { action: 'viewed' });
    }
  }, [iconType]);

  const renderIcon = () => {
    // ... (renderIcon function remains the same)
     switch (iconType) {
      case 'company':
        return <BookTemplate className="jd-mr-2 jd-h-4 jd-w-4" />;
      case 'organization':
        return <Users className="jd-mr-2 jd-h-4 jd-w-4" />;
      case 'user':
      default:
        return <Folder className="jd-mr-2 jd-h-4 jd-w-4" />;
    }
  };

  const handleContactSales = () => {
    trackEvent(EVENTS.ENTERPRISE_LIBRARY_ACCESSED, { action: 'contact_sales' });
    trackEvent(EVENTS.ENTERPRISE_CTA_CLICKED, { source: 'folder_section' });
    window.open('https://www.jayd.ai/#Contact', '_blank');
  };

  const renderOrganizationCTA = () => {
    // ... (renderOrganizationCTA function remains the same)
     if (iconType === 'organization' && isEmpty) {
      return (
        <div className="jd-flex jd-flex-col jd-gap-3 jd-p-4 jd-my-2 jd-rounded-lg jd-bg-gradient-to-br jd-from-slate-50 jd-to-slate-100 jd-dark:jd-from-gray-800/60 jd-dark:jd-to-gray-900/60 jd-border jd-border-slate-200/80 jd-dark:jd-border-amber-500/20 jd-shadow-sm">
          {/* Header with icon and badge */}
          <div className="jd-flex jd-items-center jd-gap-2">
            <div className="jd-flex jd-items-center jd-justify-center jd-w-8 jd-h-8 jd-rounded-full jd-bg-amber-100 jd-dark:jd-bg-amber-900/30">
              <Building2 className="jd-w-4 jd-h-4 jd-text-amber-600 jd-dark:jd-text-amber-400" />
            </div>
            <div className="jd-flex jd-flex-col">
              <h3 className="jd-text-sm jd-font-medium jd-text-amber-500">
                {getMessage('organization_templates_title', undefined, 'Enterprise Templates')}
              </h3>
              <div className="jd-flex jd-items-center jd-gap-1">
                <Lock className="jd-h-2.5 jd-w-2.5 jd-text-amber-600 jd-dark:jd-text-amber-400" />
                <span className="jd-text-xs jd-font-medium jd-text-amber-600 jd-dark:jd-text-amber-400">
                  {getMessage('enterprise_feature', undefined, 'Enterprise Feature')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <p className="jd-text-xs jd-text-gray-600 jd-dark:jd-text-gray-300">
            {getMessage('organization_templates_description', undefined, 
              'Access to organization templates is an enterprise feature. Contact us to enable this for your team.')}
          </p>
          
          {/* Action button */}
          <Button 
            variant="outline"
            size="sm"
            className="mt-1 jd-w-full jd-bg-white/70 jd-dark:jd-bg-gray-800/40 jd-border-amber-200 jd-dark:jd-border-amber-800/30 jd-text-amber-700 jd-dark:jd-text-amber-400 hover:jd-bg-amber-50 jd-dark:hover:jd-bg-amber-900/20 hover:jd-text-amber-800 jd-dark:hover:jd-text-amber-300 jd-transition-colors"
            onClick={handleContactSales}
          >
            <Mail className="jd-h-3 jd-w-3 jd-mr-2" />
            {getMessage('contact_enterprise_sales', undefined, 'Contact Sales')}
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="jd-flex jd-items-center jd-justify-between jd-text-sm jd-font-medium jd-text-muted-foreground jd-mb-2 jd-px-2">
        {/* Left side: Icon + Title */}
        <div className="jd-flex jd-items-center">
          {renderIcon()}
          {title}
        </div>

        {/* Right side: Buttons */}
        <div className="jd-flex jd-items-center jd-gap-1"> {/* Added gap for spacing */}
          {/* Show Browse More button */}
          {showBrowseMore && onBrowseMore && (
            <Button
              // --- CHANGE: Use secondary variant for more visibility ---
              variant="secondary"
              size="sm"
              // Adjust padding/height if needed, remove explicit text color if variant handles it
              className="jd-h-7 jd-px-2 jd-text-xs"
              onClick={onBrowseMore}
            >
              <ChevronDown className="jd-h-4 jd-w-4 jd-mr-1" />
              {getMessage('browseMore', undefined, 'Browse More')}
            </Button>
          )}

          {/* Show Create button */}
          {showCreateButton && onCreateTemplate && (
            <Button
               // --- CHANGE: Use secondary variant for more visibility ---
              variant="secondary"
              size="sm"
              // Keep size adjustments for icon button
              onClick={onCreateTemplate}
              title={getMessage('newTemplate', undefined, 'New Template')}
            >
              <PlusCircle className="jd-h-4 jd-w-4" /> {/* Ensure icon color contrasts */}
            </Button>
          )}

          {showCreateFolderButton && onCreateFolder && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onCreateFolder}
              title={getMessage('newFolder', undefined, 'New Folder')}
            >
              <FolderPlus className="jd-h-4 jd-w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Organization CTA if applicable */}
      {renderOrganizationCTA()}

      {/* Show children only if not showing organization CTA */}
      {!(iconType === 'organization' && isEmpty) && children}
    </div>
  );
}