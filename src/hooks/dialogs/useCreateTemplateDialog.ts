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
import { useTemplateCreation } from '@/hooks/prompts/useTemplateCreation';
import { getMessage, getCurrentLanguage } from '@/core/utils/i18n';
import {
  useProcessUserFolders,
  FolderData
} from '@/components/prompts/templates/templateUtils';
import { getLocalizedContent } from '@/components/prompts/blocks/blockUtils';
import {
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
  const [metadata, setMetadata] = useState<PromptMetadata>(DEFAULT_METADATA);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [userFoldersList, setUserFoldersList] = useState<FolderData[]>([]);

  // Reuse generic template creation logic
  const { saveTemplate } = useTemplateCreation();

  const currentTemplate = data?.template || null;
  const userFolders = data?.userFolders || [];
  const selectedFolder = data?.selectedFolder;

  const processUserFolders = useProcessUserFolders(userFolders, setUserFoldersList);

  useEffect(() => {
    if (isOpen) {
      setValidationErrors({});

      if (currentTemplate) {
        console.log('currentTemplate', currentTemplate);
        setName(currentTemplate.title || '');
        setDescription(currentTemplate.description || '');
        setSelectedFolderId(currentTemplate.folder_id ? currentTemplate.folder_id.toString() : '');

        const processTemplateData = async () => {
          try {
            if (content) {
              const contentString = getLocalizedContent(currentTemplate.content);
              setContent(contentString);
            } else {
              setContent('');
            }
            setMetadata(currentTemplate.metadata);
          } catch (err) {
            console.error('CustomizeTemplateDialog: Error processing template:', err);
            setError(getMessage('errorProcessingTemplate'));
          } finally {
            setIsProcessing(false);
          }
        };
  
        processTemplateData();
      }
      } else {
        setName('');
        setDescription('');
        setContent('');
        
        setMetadata({});
        setSelectedFolderId(selectedFolder?.id?.toString() || '');
      }

      processUserFolders();
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
        type: 'custom',
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


  // Save the template using final prompt content computed by the dialog
  // If no content is provided, rebuild it from current state
  const handleComplete = async (content: string, metadata: PromptMetadata) => {

    setIsSubmitting(true);
    try {
      // Ensure any custom metadata values are saved as blocks so they can be persisted

      const formData = {
        name: name.trim(),
        content: content,
        description: description?.trim(),
        folder_id: selectedFolderId ? parseInt(selectedFolderId, 10) : undefined,
        metadata: metadata
      };

      let success = false;
      success = await saveTemplate(formData, currentTemplate?.id);

      if (success) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Template saved successfully with proper block separation:');
          console.log(`   📝 Content blocks: ${contentBlockIds.length}`);
          console.log(`   🏷️  Metadata blocks: ${Object.keys(metadataBlockMapping).length}`);
        }

        if (currentTemplate) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }

        handleClose();
        return true;
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
    content,
    setContent,
    metadata,
    setMetadata,
    selectedFolderId,
    handleFolderSelect,
    userFoldersList,
    validationErrors,
    activeTab,
    setActiveTab,
    handleUpdateMetadata,
    // Enhanced metadata handlers
    handleAddMetadataItem,
    handleRemoveMetadataItem,
    handleUpdateMetadataItem,
    handleReorderMetadataItems,
    handleComplete,
    handleClose,
    isSubmitting
  };
}