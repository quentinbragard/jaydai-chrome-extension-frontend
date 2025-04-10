// src/components/folders/FolderHeader.tsx
import { Folder, ChevronDown, ChevronRight } from "lucide-react";

export function FolderHeader({ folder, isExpanded, onToggle, actionButtons }: { folder: any, isExpanded: boolean, onToggle: () => void, actionButtons: React.ReactNode }) {
    return (
      <div 
        className="jd-group jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-cursor-pointer jd-rounded-sm"
        onClick={onToggle}
      >
        {isExpanded ? 
          <ChevronDown className="jd-h-4 jd-w-4 jd-mr-1 jd-flex-shrink-0" /> : 
          <ChevronRight className="jd-h-4 jd-w-4 jd-mr-1 jd-flex-shrink-0" />
        }
        <Folder className="jd-h-4 jd-w-4 jd-mr-2 jd-text-muted-foreground" />
        <span className="jd-text-sm jd-flex-1 jd-truncate">{folder.name}</span>
        
        {folder.templates?.length > 0 && (
          <span className="jd-text-xs jd-text-muted-foreground jd-mr-2">
            {folder.templates.length} {folder.templates.length === 1 ? 'template' : 'templates'}
          </span>
        )}
        
        {actionButtons}
      </div>
    );
  }