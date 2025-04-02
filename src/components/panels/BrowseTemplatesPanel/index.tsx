// src/components/panels/BrowseTemplatesPanel/index.tsx
import React, { useCallback, memo } from 'react';
import { FolderOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import BasePanel from '../BasePanel';
import { 
  useFolderSearch,
  useAllFoldersOfType,
  useFolderMutations,
  useTemplateActions
} from '@/hooks/prompts';
import {
  FolderList,
  FolderSearch
} from '@/components/folders';
import { LoadingState } from '@/components/panels/TemplatesPanel/LoadingState';
import { EmptyMessage } from '@/components/panels/TemplatesPanel/EmptyMessage';

interface BrowseTemplatesPanelProps {
  folderType: 'official' | 'organization';
  pinnedFolderIds?: number[];
  onPinChange?: (folderId: number, isPinned: boolean) => Promise<void>;
  onBackToTemplates: () => void;
  maxHeight?: string;
}

/**
 * Panel for browsing and pinning template folders
 * Updated to use new hook structure with performance optimizations
 */
const BrowseTemplatesPanel: React.FC<BrowseTemplatesPanelProps> = ({
  folderType,
  pinnedFolderIds = [],
  onPinChange,
  onBackToTemplates,
  maxHeight = '75vh'
}) => {
  // Fetch all folders of this type using React Query
  const {
    data: folders = [],
    isLoading,
    error
  } = useAllFoldersOfType(folderType);
  
  // Use folder search hook for filtering
  const {
    searchQuery,
    setSearchQuery,
    filteredFolders,
    clearSearch
  } = useFolderSearch(folders);
  
  // Get folder mutations (instead of direct useToggleFolderPin)
  const { toggleFolderPin } = useFolderMutations();
  
  // Template actions
  const { useTemplate } = useTemplateActions();
  
  // Handle toggling pin status - memoized to prevent recreation on each render
  const handleTogglePin = useCallback((folderId: number, isPinned: boolean) => {
    toggleFolderPin.mutate({ folderId, isPinned, type: folderType });
    
    // Call the onPinChange prop if provided
    if (onPinChange) {
      onPinChange(folderId, isPinned);
    }
  }, [toggleFolderPin, folderType, onPinChange]);

  // Add pinned status to folders
  const foldersWithPinStatus = React.useMemo(() => {
    if (!folders?.length) return [];
    
    return folders.map(folder => ({
      ...folder,
      is_pinned: pinnedFolderIds.includes(folder.id)
    }));
  }, [folders, pinnedFolderIds]);

  return (
    <BasePanel
      title={folderType === 'official' ? 'Official Templates' : 'Organization Templates'}
      icon={FolderOpen}
      showBackButton={true}
      onBack={onBackToTemplates}
      className="w-80"
      maxHeight={maxHeight}
    >
      {/* Search input */}
      <FolderSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholderText={`Search ${folderType} folders...`}
        onReset={clearSearch}
      />
      
      <Separator />
      
      {/* Content area with conditional rendering based on state */}
      <div className="overflow-y-auto">
        {isLoading ? (
          <LoadingState message={`Loading ${folderType} folders...`} />
        ) : error ? (
          <EmptyMessage>
            Error loading folders: {error instanceof Error ? error.message : 'Unknown error'}
          </EmptyMessage>
        ) : filteredFolders.length === 0 ? (
          <EmptyMessage>
            {searchQuery
              ? `No folders matching "${searchQuery}"`
              : `No ${folderType} folders available`}
          </EmptyMessage>
        ) : (
          <FolderList
            folders={filteredFolders}
            type={folderType}
            onTogglePin={handleTogglePin}
            onUseTemplate={useTemplate}
            showPinControls={true}
          />
        )}
      </div>
    </BasePanel>
  );
};

// Wrap with memo for performance optimization
export default memo(BrowseTemplatesPanel);