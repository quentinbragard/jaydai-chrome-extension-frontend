// src/components/panels/BrowseTemplatesPanel/BrowseTemplatesPanel.tsx
import React, { useCallback, memo, useState, useEffect } from 'react';
import { FolderOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import BasePanel from '../BasePanel';
import { 
  useAllFoldersOfType,
  useFolderMutations,
  useTemplateActions,
  usePinnedFolders
} from '@/hooks/prompts';
import { useOrganizations } from '@/hooks/organizations';
import { FolderSearch } from '@/components/prompts/folders';
import { LoadingState } from '@/components/panels/TemplatesPanel/LoadingState';
import { EmptyMessage } from '@/components/panels/TemplatesPanel/EmptyMessage';
import { FolderItem } from '@/components/prompts/folders/FolderItem';
import { useFolderSearch } from '@/hooks/prompts/utils/useFolderSearch';

interface BrowseTemplatesPanelProps {
  folderType: 'organization' | 'company';
  pinnedFolderIds?: number[];
  onPinChange?: (folderId: number, isPinned: boolean) => Promise<void>;
  onBackToTemplates: () => void;
  maxHeight?: string;
}

/**
 * Unified Browse Templates Panel using the new unified components
 * Provides consistent display for browsing and pinning template folders
 */
const BrowseTemplatesPanel: React.FC<BrowseTemplatesPanelProps> = ({
  folderType,
  pinnedFolderIds = [],
  onPinChange,
  onBackToTemplates,
  maxHeight = '75vh'
}) => {
  // Local state to track pinned folders (initialized with prop)
  const [localPinnedIds, setLocalPinnedIds] = useState<number[]>(pinnedFolderIds);
  
  // If the pinnedFolderIds prop changes, update our local state
  useEffect(() => {
    setLocalPinnedIds(pinnedFolderIds);
  }, [pinnedFolderIds]);
  
  // Fetch all folders of this type using React Query
  const {
    data: folders = [],
    isLoading,
    error,
    refetch: refetchFolders
  } = useAllFoldersOfType(folderType);

  const { data: organizations = [] } = useOrganizations();

  // Map folder ID to its actual type (organization or company)
  const folderTypeMap = React.useMemo(() => {
    const map: Record<number, 'organization' | 'company'> = {};
    folders.forEach(f => {
      map[f.id] = (f.type === 'company') ? 'company' : 'organization';
    });
    return map;
  }, [folders]);
  
  // Get pinned folders query client for invalidation
  const { refetch: refetchPinnedFolders } = usePinnedFolders();
  
  // Use folder search hook for filtering
  const {
    searchQuery,
    setSearchQuery,
    filteredFolders,
    clearSearch
  } = useFolderSearch(folders);
  
  // Get folder mutations
  const { toggleFolderPin } = useFolderMutations();
  
  // Template actions
  const { useTemplate } = useTemplateActions();
  
  // Handle toggling pin status
  const handleTogglePin = useCallback(async (folderId: number, isPinned: boolean) => {
    // Update local state immediately for better UX
    if (isPinned) {
      // If currently pinned, remove from local pinned IDs
      setLocalPinnedIds(prev => prev.filter(id => id !== folderId));
    } else {
      // If not pinned, add to local pinned IDs
      setLocalPinnedIds(prev => [...prev, folderId]);
    }
    
    try {
      // Call the mutation to update the backend
      // Use the original folderType (don't map it)
      await toggleFolderPin.mutateAsync({
        folderId,
        isPinned,
        type: folderType
      });
      
      // Call the onPinChange prop if provided (after successful backend update)
      if (onPinChange) {
        await onPinChange(folderId, isPinned);
      }
      
      // Invalidate the pinned folders query to ensure fresh data
      refetchPinnedFolders();
    } catch (error) {
      console.error('Error toggling pin:', error);
      // Revert local state on error
      if (isPinned) {
        setLocalPinnedIds(prev => [...prev, folderId]);
      } else {
        setLocalPinnedIds(prev => prev.filter(id => id !== folderId));
      }
    }
  }, [toggleFolderPin, folderType, onPinChange, refetchPinnedFolders]);

  // Add pinned status to folders using our local state
  const foldersWithPinStatus = React.useMemo(() => {
    if (!folders?.length) return [];
    
    return folders.map(folder => ({
      ...folder,
      is_pinned: localPinnedIds.includes(folder.id)
    }));
  }, [folders, localPinnedIds]);

  return (
    <BasePanel
      title={folderType === 'company' ? 'Company Templates' : 'Organization Templates'}
      icon={FolderOpen}
      showBackButton={true}
      onBack={onBackToTemplates}
      className="jd-w-80"
      maxHeight={maxHeight}
    >
      <TooltipProvider>
        {/* Search input */}
        <FolderSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholderText={`Search ${folderType} folders...`}
          onReset={clearSearch}
        />
        
        <Separator />
        
        {/* Content area with conditional rendering based on state */}
        <div className="jd-overflow-y-auto">
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
            <div className="jd-space-y-1 jd-px-2">
              {foldersWithPinStatus.map(folder => (
                <FolderItem
                  key={`${folderType}-folder-${folder.id}`}
                  folder={folder}
                  type={folderType}
                  enableNavigation={false} // Use tree expansion mode
                  onUseTemplate={useTemplate}
                  onTogglePin={handleTogglePin}
                  organizations={organizations}
                  showPinControls={true}
                  showEditControls={false}
                  showDeleteControls={false}
                />
              ))}
            </div>
          )}
        </div>
      </TooltipProvider>
    </BasePanel>
  );
};

export default memo(BrowseTemplatesPanel);