// src/components/panels/BrowseTemplatesPanel/index.tsx
import React from 'react';
import { FolderOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import BasePanel from '../BasePanel';
import { 
  // Import all hooks directly from the templates hooks module
  useFolderSearch,
  useAllFoldersOfType, 
  useToggleFolderPin,
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
  onPinChange?: (folderId: number, isPinned: boolean) => Promise<void>;
  onBackToTemplates: () => void;
  maxHeight?: string;
}

/**
 * Panel for browsing and pinning template folders
 * Simplified with React Query and smaller components
 */
const BrowseTemplatesPanel: React.FC<BrowseTemplatesPanelProps> = ({
  folderType,
  onBackToTemplates,
  maxHeight = '400px'
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
  
  // Mutation for toggling pin status
  const { mutate: togglePin } = useToggleFolderPin();
  
  // Template actions
  const { useTemplate } = useTemplateActions();
  
  // Handle toggling pin status
  const handleTogglePin = (folderId: number, isPinned: boolean) => {
    togglePin({ folderId, isPinned, type: folderType });
  };

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
      
      {/* Content area */}
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

export default BrowseTemplatesPanel;