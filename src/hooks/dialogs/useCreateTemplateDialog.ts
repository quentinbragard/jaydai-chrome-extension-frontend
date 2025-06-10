// src/hooks/dialogs/useCreateTemplateDialog.ts - FIXED: Restored original dialog integration

import { useState, useEffect } from 'react';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
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
import { getMessage } from '@/core/utils/i18n';
import {
  useProcessUserFolders,
  FolderData
} from '@/utils/prompts/templateUtils';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';
import { useTemplateMetadataHandlers } from '@/hooks/prompts/useTemplateMetadata'; // ✅ Use shared metadata hook
import {
  ensureMetadataBlocks,
  getMetadataBlockMapping
} from './templateDialogUtils';

export function useCreateTemplateDialog() {
  // ✅ Restore original dialog integration
  const createDialog = useDialog(DIALOG_TYPES.CREATE_TEMPLATE);
  const editDialog = useDialog(DIALOG_TYPES.EDIT_TEMPLATE);

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

  // ✅ Use shared metadata hook
  const {
    handleUpdateMetadata,
    handleAddMetadata,
    handleRemoveMetadata,
    handleUpdateMetadataItem,
    handleReorderMetadataItems
  } = useTemplateMetadataHandlers({ metadata, setMetadata });

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
            // ✅ Fixed: Check template's content, not current state
            if (currentTemplate.content) {
              const contentString = getLocalizedContent(currentTemplate.content);
              setContent(contentString);
            } else {
              setContent('');
            }
            setMetadata(currentTemplate.metadata || DEFAULT_METADATA);
          } catch (err) {
            console.error('Error processing template:', err);
            setError(getMessage('errorProcessingTemplate'));
          } finally {
            setIsProcessing(false);
          }
        };

        processTemplateData();
      } else {
        // New template
        setName('');
        setDescription('');
        setContent('');
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
    setMetadata(DEFAULT_METADATA);
    setValidationErrors({});
    setActiveTab('basic');
  };

  const handleFolderSelect = (folderId: string) => {
    if (folderId === 'new') {
      if (window.dialogManager) {
        window.dialogManager.openDialog(DIALOG_TYPES.CREATE_FOLDER, {
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
  const handleComplete = async (content: string, metadata: PromptMetadata) => {
    setIsSubmitting(true);
    try {
      // Ensure all metadata values are persisted as blocks so we can
      // pass only block ID mappings to the API.
      const processedMetadata = await ensureMetadataBlocks(metadata);
      const metadataMapping = getMetadataBlockMapping(processedMetadata, activeTab);

      // Update local state with block IDs so the dialog stays in sync
      setMetadata(processedMetadata);

      const formData = {
        name: name.trim(),
        content: content,
        description: description?.trim(),
        folder_id: selectedFolderId ? parseInt(selectedFolderId, 10) : undefined,
        metadata: metadataMapping
      };

      let success = false;
      success = await saveTemplate(formData, currentTemplate?.id);

      if (success) {
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

  const dialogTitle = isEditMode 
    ? getMessage('editTemplate', undefined, 'Edit Template') 
    : getMessage('createTemplate', undefined, 'Create Template');

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
    error,
    isProcessing,
    isSubmitting,
    // ✅ Unified metadata handlers
    handleUpdateMetadata,
    handleAddMetadata,
    handleRemoveMetadata,
    handleUpdateMetadataItem,
    handleReorderMetadataItems,
    handleComplete,
    handleClose
  };
}