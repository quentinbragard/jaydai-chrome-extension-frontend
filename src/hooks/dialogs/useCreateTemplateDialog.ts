// src/hooks/dialogs/useCreateTemplateDialog.ts - FIXED: Proper metadata vs content block separation
import { useState, useEffect } from 'react';
import { useDialog } from '@/hooks/dialogs/useDialog';
import { Block, BlockType } from '@/types/prompts/blocks';
import {
  PromptMetadata,
  DEFAULT_METADATA,
  MetadataItem,
  MultipleMetadataType,
  SingleMetadataType
} from '@/types/prompts/metadata';
import { toast } from 'sonner';
import { promptApi } from '@/services/api';
import { getMessage, getCurrentLanguage } from '@/core/utils/i18n';
import {
  useProcessUserFolders,
  validateTemplateForm,
  FolderData
} from '@/components/prompts/templates/templateUtils';
import {
  validateEnhancedTemplateForm,
  generateEnhancedFinalContent,
  getEnhancedContentBlockIds, // FIXED: Use this for content blocks
  getMetadataBlockMapping,    // FIXED: Use this for metadata blocks
  createEnhancedMetadataForSaving,
  parseTemplateMetadata,
  createBlock,
  addBlock as addBlockUtil,
  removeBlock as removeBlockUtil,
  updateBlock as updateBlockUtil,
  reorderBlocks as reorderBlocksUtil,
  addMetadataItem,
  removeMetadataItem,
  updateMetadataItem,
  reorderMetadataItems
} from './templateDialogUtils';

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

  const validateForm = () => {
    const errors = validateEnhancedTemplateForm(
      name,
      content,
      blocks,
      metadata,
      activeTab
    );
    setValidationErrors(
      Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, getMessage(v as any)]))
    );
    return Object.keys(errors).length === 0;
  };

  // FIXED: Proper separation of content blocks vs metadata blocks
  const generateFinalContentLocal = () => generateEnhancedFinalContent(content, blocks, metadata, activeTab);
  const getContentBlockIdsLocal = () => getEnhancedContentBlockIds(blocks, activeTab); // FIXED: Only content blocks
  const getMetadataMappingLocal = () => getMetadataBlockMapping(metadata, activeTab); // FIXED: Only metadata blocks

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
      const contentBlockIds = getContentBlockIdsLocal(); // FIXED: Content blocks only
      const metadataBlockMapping = getMetadataMappingLocal(); // FIXED: Metadata blocks only
      
      // FIXED: Create comprehensive enhanced metadata for saving
      const enhancedMetadata = createEnhancedMetadataForSaving(metadata, activeTab);

      console.log('FIXED Template Save Data:', {
        finalContent,
        contentBlockIds,      // FIXED: These are content blocks
        metadataBlockMapping, // FIXED: These are metadata blocks
        enhancedMetadata
      });

      const templateData = {
        title: name.trim(),
        content: finalContent,
        
        // FIXED: Store content block IDs in blocks field
        blocks: contentBlockIds,
        
        description: description?.trim(),
        folder_id: selectedFolderId ? parseInt(selectedFolderId, 10) : undefined,
        
        // FIXED: Store comprehensive metadata structure
        enhanced_metadata: enhancedMetadata,
        
        // FIXED: Store metadata block IDs in metadata field
        metadata: metadataBlockMapping
      };

      console.log('Final Template Data Structure:', {
        ...templateData,
        explanation: {
          'blocks': 'Content block IDs (blocks added to content section)',
          'metadata': 'Metadata block IDs (blocks selected in metadata dropdowns)',
          'enhanced_metadata': 'Complete metadata structure with values and references'
        }
      });

      if (onSave) {
        const formData = {
          name: name.trim(),
          content: finalContent,
          description: description?.trim(),
          folder_id: selectedFolderId ? parseInt(selectedFolderId, 10) : undefined,
          enhanced_metadata: enhancedMetadata,
          metadata: metadataBlockMapping
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

          // Show detailed info about what was saved
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Template saved successfully with proper block separation:');
            console.log(`   📝 Content blocks: ${contentBlockIds.length}`);
            console.log(`   🏷️  Metadata blocks: ${Object.keys(metadataBlockMapping).length}`);
            
            if (Object.keys(metadataBlockMapping).length > 0) {
              console.log('   Metadata block mapping:', metadataBlockMapping);
              toast.success(`Template saved with ${Object.keys(metadataBlockMapping).length} metadata blocks tracked`);
            }
          }

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
    setMetadata(prev => addMetadataItem(prev, type));
  };

  const handleRemoveMetadataItem = (type: MultipleMetadataType, itemId: string) => {
    setMetadata(prev => removeMetadataItem(prev, type, itemId));
  };

  const handleUpdateMetadataItem = (
    type: MultipleMetadataType,
    itemId: string,
    updates: Partial<MetadataItem>
  ) => {
    setMetadata(prev => updateMetadataItem(prev, type, itemId, updates));
  };

  const handleReorderMetadataItems = (type: MultipleMetadataType, newItems: MetadataItem[]) => {
    setMetadata(prev => reorderMetadataItems(prev, type, newItems));
  };

  // Content block handlers (these only affect content blocks, not metadata)
  const handleAddBlock = (
    position: 'start' | 'end',
    blockType?: BlockType | null,
    existingBlock?: Block,
    duplicate?: boolean
  ) => {
    const newBlock = createBlock(blockType, existingBlock, duplicate);
    setBlocks(prev => addBlockUtil(prev, position, newBlock));
  };

  const handleRemoveBlock = (blockId: number) => {
    setBlocks(prev => removeBlockUtil(prev, blockId));
  };

  const handleUpdateBlock = (blockId: number, updatedBlock: Partial<Block>) => {
    setBlocks(prev => {
      const newBlocks = updateBlockUtil(prev, blockId, updatedBlock);
      if (activeTab === 'basic' && newBlocks.length > 0 && newBlocks[0].id === blockId) {
        const first = newBlocks[0];
        const lang = getCurrentLanguage();
        const newContent =
          typeof first.content === 'string'
            ? first.content
            : (first.content as any)[lang] || (first.content as any).en || '';
        setContent(newContent);
      }
      return newBlocks;
    });
  };

  const handleReorderBlocks = (newBlocks: Block[]) => {
    setBlocks(prev => reorderBlocksUtil(prev, newBlocks));
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
    isSubmitting,
    // FIXED: Expose both mappings for debugging/development
    getContentBlockIds: () => getContentBlockIdsLocal(),
    getMetadataBlockMapping: () => getMetadataMappingLocal()
  };
}