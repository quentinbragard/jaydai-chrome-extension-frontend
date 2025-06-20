// src/components/prompts/folders/FolderNavigation.tsx
import React from 'react';
import { FolderOpen, ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FolderPath {
  id: number;
  name: string;
}

interface FolderNavigationProps {
  path: FolderPath[];
  onNavigateToRoot: () => void;
  onNavigateBack: () => void;
  onNavigateToPath: (index: number) => void;
  className?: string;
}

/**
 * Navigation component for folder breadcrumbs and navigation
 */
export function FolderNavigation({
  path,
  onNavigateToRoot,
  onNavigateBack,
  onNavigateToPath,
  className = ''
}: FolderNavigationProps) {
  if (path.length === 0) {
    return null;
  }

  return (
    <div className={`jd-flex jd-items-center jd-gap-1 jd-px-2 jd-py-2 jd-mb-2 jd-bg-accent/20 jd-rounded-md jd-text-xs ${className}`}>
      {/* Home button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onNavigateToRoot} 
        className="jd-h-6 jd-px-2 jd-text-muted-foreground hover:jd-text-foreground"
        title="Go to root"
      >
        <Home className="jd-h-3 jd-w-3" />
      </Button>

      {/* Breadcrumb trail */}
      <div className="jd-flex jd-items-center jd-gap-1 jd-flex-1 jd-min-w-0">
        {path.map((folder, index) => (
          <React.Fragment key={folder.id}>
            <ChevronRight className="jd-h-3 jd-w-3 jd-text-muted-foreground jd-flex-shrink-0" />
            <button
              onClick={() => onNavigateToPath(index)}
              className={`jd-truncate jd-text-left jd-hover:jd-text-foreground jd-transition-colors ${
                index === path.length - 1 
                  ? 'jd-text-foreground jd-font-medium' 
                  : 'jd-text-muted-foreground jd-hover:jd-underline'
              }`}
              title={folder.title}
            >
              {folder.title}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Back button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onNavigateBack} 
        className="jd-h-6 jd-px-2 jd-text-muted-foreground hover:jd-text-foreground jd-flex-shrink-0"
        title="Go back"
      >
        <ArrowLeft className="jd-h-3 jd-w-3" />
      </Button>
    </div>
  );
}