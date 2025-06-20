// src/components/prompts/navigation/UnifiedNavigation.tsx
import React, { useState, useMemo } from 'react';
import { FolderOpen, PlusCircle, Plus, ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';

interface NavigationPath {
  id: number;
  name: string;
}

interface UnifiedNavigationProps {
  // Current state
  isAtRoot: boolean;
  currentFolderName?: string;
  navigationPath?: NavigationPath[];
  
  // Navigation handlers
  onNavigateToRoot?: () => void;
  onNavigateBack?: () => void;
  onNavigateToPathIndex?: (index: number) => void;
  
  // Action handlers
  onCreateTemplate?: () => void;
  onCreateFolder?: () => void;
  
  // Display options
  showCreateTemplate?: boolean;
  showCreateFolder?: boolean;
  className?: string;
}

/**
 * Unified navigation component that provides consistent navigation UI
 * Used by FolderItem and other components that need navigation controls
 */
export const UnifiedNavigation: React.FC<UnifiedNavigationProps> = ({
  isAtRoot,
  currentFolderName,
  navigationPath = [],
  onNavigateToRoot,
  onNavigateBack,
  onNavigateToPathIndex,
  onCreateTemplate,
  onCreateFolder,
  showCreateTemplate = false,
  showCreateFolder = false,
  className = ''
}) => {
  const [showAllBreadcrumbs, setShowAllBreadcrumbs] = useState(false);

  const breadcrumbItems = useMemo(() => {
    if (showAllBreadcrumbs || navigationPath.length <= 3) {
      return navigationPath.map((folder, index) => ({ folder, index }));
    }

    const lastTwo = navigationPath.slice(-2);
    return [
      { folder: navigationPath[0], index: 0 },
      { folder: { id: -1, name: '...' } as NavigationPath, index: -1 },
      { folder: lastTwo[0], index: navigationPath.length - 2 },
      { folder: lastTwo[1], index: navigationPath.length - 1 }
    ];
  }, [showAllBreadcrumbs, navigationPath]);

  const fullPathTitle = useMemo(
    () => navigationPath.map(p => p.name).join(' / '),
    [navigationPath]
  );

  return (
    <div className={`jd-space-y-2 ${className}`}>
      {/* Header with title and action buttons */}
      <div className="jd-flex jd-items-center jd-justify-between jd-text-sm jd-font-medium jd-text-muted-foreground jd-mb-2 jd-px-2">
        <div className="jd-flex jd-items-center">
          <FolderOpen className="jd-mr-2 jd-h-4 jd-w-4" />
          {isAtRoot ? 'My Templates' : currentFolderName}
        </div>
        <div className="jd-flex jd-items-center jd-gap-1">
          {showCreateTemplate && onCreateTemplate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onCreateTemplate}
              title={getMessage('newTemplate', undefined, 'New Template')}
            >
              <PlusCircle className="jd-h-4 jd-w-4" />
            </Button>
          )}
          {showCreateFolder && onCreateFolder && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onCreateFolder}
              title={getMessage('newFolder', undefined, 'New Folder')}
            >
              <Plus className="jd-h-4 jd-w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Breadcrumb */}
      {!isAtRoot && navigationPath.length > 0 && (
        <div className="jd-flex jd-items-center jd-gap-1 jd-px-2 jd-py-2 jd-mb-2 jd-bg-accent/20 jd-rounded-md jd-text-xs">
          {onNavigateToRoot && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onNavigateToRoot} 
              className="jd-h-6 jd-px-2 jd-text-muted-foreground hover:jd-text-foreground"
              title="Go to root"
            >
              <Home className="jd-h-3 jd-w-3" />
            </Button>
          )}
          
          <div
            className="jd-flex jd-items-center jd-gap-1 jd-flex-1 jd-min-w-0 jd-truncate"
            title={fullPathTitle}
          >
            {breadcrumbItems.map(({ folder, index }) => (
              <React.Fragment key={folder.id + '-' + index}>
                <ChevronRight className="jd-h-3 jd-w-3 jd-text-muted-foreground jd-flex-shrink-0" />
                {folder.name === '...'
                  ? (
                      <button
                        onClick={() => setShowAllBreadcrumbs(true)}
                        className="jd-text-muted-foreground jd-hover:jd-underline"
                        title="Show full path"
                      >
                        ...
                      </button>
                    )
                  : (
                      <button
                        onClick={() => index >= 0 && onNavigateToPathIndex?.(index)}
                        className={`jd-truncate jd-text-left jd-hover:jd-text-foreground jd-transition-colors ${
                          index === navigationPath.length - 1
                            ? 'jd-text-foreground jd-font-medium'
                            : 'jd-text-muted-foreground jd-hover:jd-underline'
                        }`}
                        title={folder.name}
                      >
                        {folder.name}
                      </button>
                    )}
              </React.Fragment>
            ))}
          </div>

          {onNavigateBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onNavigateBack} 
              className="jd-h-6 jd-px-2 jd-text-muted-foreground hover:jd-text-foreground jd-flex-shrink-0"
              title="Go back"
            >
              <ArrowLeft className="jd-h-3 jd-w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedNavigation;