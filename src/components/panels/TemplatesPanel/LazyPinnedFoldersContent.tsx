// src/components/panels/TemplatesPanel/LazyPinnedFoldersContent.tsx
import React, { useState, useMemo } from 'react';
import { useAllPinnedFolders } from '@/hooks/prompts';
import { useOrganizations } from '@/hooks/organizations';
import { FolderItem } from '@/components/prompts/folders/FolderItem';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { Template } from '@/types/prompts/templates';
import { getMessage } from '@/core/utils/i18n';

interface LazyPinnedFoldersContentProps {
  onSelectTemplate: (template: Template) => void;
}

export const LazyPinnedFoldersContent: React.FC<LazyPinnedFoldersContentProps> = ({
  onSelectTemplate
}) => {
  const { dialogProps } = useDialog(DIALOG_TYPES.INFORMATION);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  // Use lightweight hook that doesn't fetch unnecessary data
  const { allPinnedFolders, allPinnedFolderIds } = useAllPinnedFolders();
  const { data: organizations = [] } = useOrganizations();

  // Memoize folders to prevent unnecessary re-renders
  const memoizedFolders = useMemo(() => allPinnedFolders, [allPinnedFolders]);

  const toggleExpanded = (id: number) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); 
      else next.add(id);
      return next;
    });
  };

  const handleUseTemplate = (template: Template) => {
    dialogProps.onOpenChange(false);
    onSelectTemplate(template);
  };

  // Show loading state while folders are being fetched
  if (!memoizedFolders.length) {
    return (
      <div className="jd-p-4 jd-text-center">
        <div className="jd-animate-spin jd-h-4 jd-w-4 jd-border-2 jd-border-primary jd-border-t-transparent jd-rounded-full jd-mx-auto"></div>
        <p className="jd-text-sm jd-text-muted-foreground jd-mt-2">
          {getMessage('loadingFolders', undefined, 'Loading folders...')}
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="jd-text-sm jd-mb-2">
        {getMessage('searchTemplatesHint', undefined, 'You can search among hundreds of templates with the search bar. We recommend starting with one of these folders.')}
      </p>
      <div className="jd-max-h-72 jd-overflow-y-auto jd-space-y-1 jd-px-2">
        {memoizedFolders.map(folder => (
          <FolderItem
            key={`onboard-folder-${folder.id}`}
            folder={folder}
            type={folder.folderType as any}
            enableNavigation={false}
            onToggleExpand={toggleExpanded}
            isExpanded={expandedFolders.has(folder.id)}
            onUseTemplate={handleUseTemplate}
            organizations={organizations}
            showEditControls={false}
            showDeleteControls={false}
            showPinControls={false}
            pinnedFolderIds={allPinnedFolderIds}
          />
        ))}
      </div>
    </>
  );
};