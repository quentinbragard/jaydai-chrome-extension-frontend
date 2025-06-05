// src/hooks/dialogs/useCreateTemplateDialog.ts - Enhanced version
import { useState, useEffect } from 'react';
import { useDialog } from '@/hooks/dialogs/useDialog';
import { Block, BlockType } from '@/types/prompts/blocks';
import { 
  PromptMetadata, 
  DEFAULT_METADATA, 
  MetadataItem,
  MultipleMetadataType,
  SingleMetadataType,
  isMultipleMetadataType,
  generateMetadataItemId
} from '@/types/prompts/metadata';
import { toast } from 'sonner';
import { promptApi } from '@/services/api';
import { getMessage, getCurrentLanguage } from '@/core/utils/i18n';
import { buildCompletePrompt } from '@/components/prompts/promptUtils';
import {
  useProcessUserFolders,
  validateTemplateForm,
  FolderData
} from '@/components/prompts/templates/templateUtils';

// Enhanced template form validation
const validateEnhancedTemplateForm = (
  name: string,
  content: string,
  blocks: Block[],
  metadata: PromptMetadata,
  activeTab: 'basic' | 'advanced',
  setValidationErrors: (errors: Record<string, string>) => void
) => {
  const errors: Record<string, string> = {};
  
  if (!name?.trim()) errors.name = 'templateNameRequired';
  
  if (activeTab === 'basic' && !content?.trim()) {
    errors.content = 'templateContentRequired';
  }
  
  if (activeTab === 'advanced') {
    // Check if there's any content in blocks or metadata
    const hasBlockContent = blocks.some(b => {
      const blockContent = typeof b.content === 'string' ? b.content : b.content[getCurrentLanguage()] || b.content.en || '';
      return blockContent.trim();
    });
    
    const hasMetadataContent = 
      Object.values(metadata.values || {}).some(v => v?.trim()) ||
      (metadata.constraints && metadata.constraints.some(c => c.value.trim())) ||
      (metadata.examples && metadata.examples.some(e => e.value.trim()));
    
    if (!hasBlockContent && !hasMetadataContent) {
      errors.content = 'templateContentRequired';
    }
  }
  
  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};

// Enhanced content generation
const generateEnhancedFinalContent = (
  content: string,
  blocks: Block[],
  metadata: PromptMetadata,
  activeTab: 'basic' | 'advanced'
): string => {
  if (activeTab === 'basic') return content;
  
  return buildCompletePrompt(metadata, blocks);
};

// Enhanced block IDs extraction
const getEnhancedBlockIds = (
  blocks: Block[],
  metadata: PromptMetadata,
  activeTab: 'basic' | 'advanced'
): number[] => {
  if (activeTab === 'basic') return [];
  
  const metadataIds: number[] = [];
  
  // Add single metadata block IDs
  ['role', 'context', 'goal', 'audience', 'tone_style', 'output_format'].forEach(type => {
    const id = metadata[type as SingleMetadataType];
    if (id && id !== 0) metadataIds.push(id);
  });
  
  // Add multiple metadata block IDs
  if (metadata.constraints) {
    metadata.constraints.forEach(constraint => {
      if (constraint.blockId && constraint.blockId !== 0) {
        metadataIds.push(constraint.blockId);
      }
    });
  }
  
  if (metadata.examples) {
    metadata.examples.forEach(example => {
      if (example.blockId && example.blockId !== 0) {
        metadataIds.push(example.blockId);
      }
    });
  }
  
  const contentIds = blocks.filter(b => b.id > 0 && !b.isNew).map(b => b.id);
  return [...metadataIds, ...contentIds];
};

export function useCreateTemplateDialog() {
  const createDialog = useDialog('createTemplate');
  const editDialog = useDialog('editTemplate');

  const isOpen = createDialog.isOpen || editDialog.isOpen;
  const isEditMode = editDialog.isOpen;
  const data = createDialog.isOpen ? createDialog.data : editDialog.data;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [content, setContent] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [metadata, setMetadata] = useState<PromptMetadata>(DEFAULT_METADATA);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [userFoldersList, setUserFoldersList] = useState<FolderData[]>([]);

  const currentTemplate = data?.template || null;
  const onSave = data?.onSave;
  const userFolders = data?.userFolders || [];
  const selectedFolder = data?.selectedFolder;

  const processUserFolders = useProcessUserFolders(userFolders, setUserFoldersList);

  useEffect(() => {
    if (isOpen) {
      setValidationErrors({});

      if (currentTemplate) {
        setName(currentTemplate.title || '');
        setDescription(currentTemplate.description || '');
        setSelectedFolderId(currentTemplate.folder_id ? currentTemplate.folder_id.toString() : '');

        if (currentTemplate.enhanced_metadata) {
          // Load enhanced metadata structure
          const enhancedMetadata = parseTemplateMetadata(currentTemplate.enhanced_metadata);
          setMetadata(enhancedMetadata);
        }

        if (currentTemplate.expanded_blocks && Array.isArray(currentTemplate.expanded_blocks)) {
          const templateBlocks: Block[] = currentTemplate.expanded_blocks.map((block: any, index: number) => ({
            id: block.id || Date.now() + index,
            type: block.type || 'content',
            content: block.content || '',
            title: block.title,
            description: block.description
          }));
          setBlocks(templateBlocks);
        } else {
          setContent(currentTemplate.content || '');
          setBlocks([
            {
              id: Date.now(),
              type: 'content',
              content: currentTemplate.content || '',
              title: { en: 'Template Content' }
            }
          ]);
        }
      } else {
        setName('');
        setDescription('');
        setContent('');
        setBlocks([
          {
            id: Date.now(),
            type: 'content',
            content: '',
            title: { en: 'Template Content' }
          }
        ]);
        setMetadata(DEFAULT_METADATA);
        setSelectedFolderId(selectedFolder?.id?.toString() || '');
      }

      processUserFolders();
    }
  }, [isOpen, currentTemplate, selectedFolder, processUserFolders]);

  // Helper function to parse template metadata
  const parseTemplateMetadata = (enhancedMetadata: any): PromptMetadata => {
    const parsedMetadata: PromptMetadata = { ...DEFAULT_METADATA };

    // Parse single metadata values
    if (enhancedMetadata.values) {
      parsedMetadata.values = { ...enhancedMetadata.values };
    }

    // Parse single metadata block references
    ['role', 'context', 'goal', 'audience', 'tone_style', 'output_format'].forEach(type => {
      if (enhancedMetadata[type]) {
        parsedMetadata[type as SingleMetadataType] = enhancedMetadata[type];
      }
    });

    // Parse multiple metadata items
    if (enhancedMetadata.constraints && Array.isArray(enhancedMetadata.constraints)) {
      parsedMetadata.constraints = enhancedMetadata.constraints.map((item: any) => ({
        id: item.id || generateMetadataItemId(),
        blockId: item.blockId,
        value: item.value || ''
      }));
    }

    if (enhancedMetadata.examples && Array.isArray(enhancedMetadata.examples)) {
      parsedMetadata.examples = enhancedMetadata.examples.map((item: any) => ({
        id: item.id || generateMetadataItemId(),
        blockId: item.blockId,
        value: item.value || ''
      }));
    }

    return parsedMetadata;
  };

  const handleClose = () => {
    if (createDialog.isOpen) {
      createDialog.close();
    } else {
      editDialog.close();
    }

    setName('');
    setDescription('');
    setSelectedFolderId('');
    setContent('');
    setBlocks([
      {
        id: Date.now(),
        type: 'content',
        content: '',
        title: { en: 'Template Content' }
      }
    ]);
    setMetadata(DEFAULT_METADATA);
    setValidationErrors({});
    setActiveTab('basic');
  };

  const handleFolderSelect = (folderId: string) => {
    if (folderId === 'new') {
      if (window.dialogManager) {
        window.dialogManager.openDialog('createFolder', {
          onSaveFolder: async (folderData: { name: string; path: string; description: string }) => {
            try {
              const response = await promptApi.createFolder(folderData);
              if (response.success && response.data) {
                return { success: true, folder: response.data };
              } else {
                toast.error(response.message || getMessage('failedToCreateFolder'));
                return { success: false, error: response.message || getMessage('unknownError') };
              }
            } catch (error) {
              console.error('Error creating folder:', error);
              return { success: false, error: getMessage('failedToCreateFolder') };
            }
          },
          onFolderCreated: (folder: any) => {
            setSelectedFolderId(folder.id.toString());
            setUserFoldersList(prev => {
              if (prev.some(f => f.id === folder.id)) {
                return prev;
              }
              return [...prev, { id: folder.id, name: folder.name, fullPath: folder.name }];
            });
          }
        });
      }
      return;
    }

    setSelectedFolderId(folderId);
  };

  const validateForm = () =>
    validateEnhancedTemplateForm(
      name,
      content,
      blocks,
      metadata,
      activeTab,
      errors =>
        setValidationErrors(
          Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, getMessage(v as any)]))
        )
    );

  const generateFinalContentLocal = () => generateEnhancedFinalContent(content, blocks, metadata, activeTab);
  const getBlockIdsLocal = () => getEnhancedBlockIds(blocks, metadata, activeTab);

  const handleSave = async () => {
    if (!validateForm()) {
      if (validationErrors.name) {
        toast.error(validationErrors.name);
      } else if (validationErrors.content) {
        toast.error(validationErrors.content);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const finalContent = generateFinalContentLocal();
      const blockIds = getBlockIdsLocal();

      const templateData = {
        title: name.trim(),
        content: finalContent,
        blocks: blockIds,
        description: description?.trim(),
        folder_id: selectedFolderId ? parseInt(selectedFolderId, 10) : undefined,
        // Include enhanced metadata for future use
        enhanced_metadata: metadata
      };

      if (onSave) {
        const formData = {
          name: name.trim(),
          content: finalContent,
          description: description?.trim(),
          folder_id: selectedFolderId ? parseInt(selectedFolderId, 10) : undefined,
          enhanced_metadata: metadata
        };
        const success = await onSave(formData);
        if (success) {
          handleClose();
          return success;
        }
      } else {
        let response;
        if (currentTemplate?.id) {
          response = await promptApi.updateTemplate(currentTemplate.id, templateData);
        } else {
          response = await promptApi.createTemplate(templateData);
        }

        if (response.success) {
          toast.success(currentTemplate ? getMessage('templateUpdated') : getMessage('templateCreated'));

          if (currentTemplate) {
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }

          handleClose();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(getMessage('errorSavingTemplate'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced metadata handlers
  const handleAddMetadataItem = (type: MultipleMetadataType) => {
    const newItem: MetadataItem = {
      id: generateMetadataItemId(),
      value: ''
    };

    setMetadata(prev => ({
      ...prev,
      [type]: [...(prev[type] || []), newItem]
    }));
  };

  const handleRemoveMetadataItem = (type: MultipleMetadataType, itemId: string) => {
    setMetadata(prev => ({
      ...prev,
      [type]: (prev[type] || []).filter(item => item.id !== itemId)
    }));
  };

  const handleUpdateMetadataItem = (type: MultipleMetadataType, itemId: string, updates: Partial<MetadataItem>) => {
    setMetadata(prev => ({
      ...prev,
      [type]: (prev[type] || []).map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  };

  const handleReorderMetadataItems = (type: MultipleMetadataType, newItems: MetadataItem[]) => {
    setMetadata(prev => ({
      ...prev,
      [type]: newItems
    }));
  };

  // Block handlers
  const handleAddBlock = (
    position: 'start' | 'end',
    blockType?: BlockType | null,
    existingBlock?: Block,
    duplicate?: boolean
  ) => {
    let newBlock: Block;

    if (existingBlock) {
      newBlock = duplicate
        ? {
            ...existingBlock,
            id: Date.now() + Math.random(),
            isNew: true
          }
        : { ...existingBlock, isNew: false };
    } else {
      newBlock = {
        id: Date.now() + Math.random(),
        type: blockType || null,
        content: '',
        name: blockType
          ? `New ${blockType.charAt(0).toUpperCase() + blockType.slice(1)} Block`
          : 'New Block',
        description: '',
        isNew: true
      };
    }

    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      if (position === 'start') {
        newBlocks.unshift(newBlock);
      } else {
        newBlocks.push(newBlock);
      }
      return newBlocks;
    });
  };

  const handleRemoveBlock = (blockId: number) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
  };

  const handleUpdateBlock = (blockId: number, updatedBlock: Partial<Block>) => {
    setBlocks(prevBlocks => {
      const newBlocks = prevBlocks.map(block => (block.id === blockId ? { ...block, ...updatedBlock } : block));
      if (activeTab === 'basic' && newBlocks.length > 0 && newBlocks[0].id === blockId) {
        const first = newBlocks[0];
        const lang = getCurrentLanguage();
        const newContent = typeof first.content === 'string' ? first.content : (first.content as any)[lang] || (first.content as any).en || '';
        setContent(newContent);
      }
      return newBlocks;
    });
  };

  const handleReorderBlocks = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
  };

  const handleUpdateMetadata = (newMetadata: PromptMetadata) => {
    setMetadata(newMetadata);
  };

  const dialogTitle = isEditMode ? getMessage('editTemplate', undefined, 'Edit Template') : getMessage('createTemplate', undefined, 'Create Template');

  return {
    isOpen,
    dialogTitle,
    name,
    setName,
    description,
    setDescription,
    selectedFolderId,
    handleFolderSelect,
    userFoldersList,
    validationErrors,
    blocks,
    metadata,
    activeTab,
    setActiveTab,
    handleAddBlock,
    handleRemoveBlock,
    handleUpdateBlock,
    handleReorderBlocks,
    handleUpdateMetadata,
    // Enhanced metadata handlers
    handleAddMetadataItem,
    handleRemoveMetadataItem,
    handleUpdateMetadataItem,
    handleReorderMetadataItems,
    handleSave,
    handleClose,
    isSubmitting
  };
}