// src/components/dialogs/templates/CreateTemplateDialog.tsx
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderPlus } from 'lucide-react';
import { useDialog } from '@/hooks/dialogs/useDialog';
import { Block, BlockType } from '@/types/prompts/blocks';
import { PromptMetadata, DEFAULT_METADATA } from '@/types/prompts/metadata';
import { toast } from 'sonner';
import { promptApi } from '@/services/api';
import { getMessage, getCurrentLanguage } from '@/core/utils/i18n';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { BasicEditor, AdvancedEditor } from '../editors';

import {
  useProcessUserFolders,
  truncateFolderPath,
  validateTemplateForm,
  generateFinalContent,
  getBlockIds,
  FolderData
} from '@/components/prompts/templates/templateUtils';



/**
 * Unified Template Dialog for both creating and editing templates
 * Now with Basic and Advanced editing modes
 */
export const CreateTemplateDialog: React.FC = () => {
  // Get create and edit dialog states
  const createDialog = useDialog('createTemplate');
  const editDialog = useDialog('editTemplate');
  
  // Determine if either dialog is open
  const isOpen = createDialog.isOpen || editDialog.isOpen;
  const isEditMode = editDialog.isOpen;
  
  // Get the appropriate data based on which dialog is open
  const data = createDialog.isOpen ? createDialog.data : editDialog.data;
  
  // State for template data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [content, setContent] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [metadata, setMetadata] = useState<PromptMetadata>(DEFAULT_METADATA);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [userFoldersList, setUserFoldersList] = useState<FolderData[]>([]);

  // Extract data from dialog
  const currentTemplate = data?.template || null;
  const onFormChange = data?.onFormChange;
  const onSave = data?.onSave;
  const userFolders = data?.userFolders || [];
  const selectedFolder = data?.selectedFolder;
  
  // Process user folders for the select dropdown
  const processUserFolders = useProcessUserFolders(userFolders, setUserFoldersList);
  
  // Initialize form state when dialog opens or data changes
  useEffect(() => {
    if (isOpen) {
      setValidationErrors({});
      
      if (currentTemplate) {
        // Editing existing template
        setName(currentTemplate.title || '');
        setDescription(currentTemplate.description || '');
        setSelectedFolderId(currentTemplate.folder_id ? currentTemplate.folder_id.toString() : '');
        
        // Handle blocks and metadata if they exist
        if (currentTemplate.expanded_blocks && Array.isArray(currentTemplate.expanded_blocks)) {
          const templateBlocks: Block[] = currentTemplate.expanded_blocks.map((block: any, index: number) => ({
            id: block.id || Date.now() + index,
            type: block.type || 'content',
            content: block.content || '',
            title: block.title,
            description: block.description
          }));
          setBlocks(templateBlocks);
          
          // Extract metadata from blocks if any
          // TODO: Parse metadata from blocks
        } else {
          // Legacy template with just content
          setContent(currentTemplate.content || '');
          setBlocks([{
            id: Date.now(),
            type: 'content',
            content: currentTemplate.content || '',
            title: { en: 'Template Content' }
          }]);
        }
      } else {
        // Creating new template
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
  
  // Handle dialog close
  const handleClose = () => {
    if (createDialog.isOpen) {
      createDialog.close();
    } else {
      editDialog.close();
    }
    
    // Reset form state
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
  
  // Handle folder selection
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
              return [...prev, {
                id: folder.id,
                name: folder.name,
                fullPath: folder.name
              }];
            });
          }
        });
      }
      return;
    }
    
    setSelectedFolderId(folderId);
  };
  
  
  // Validate form before saving
  const validateForm = () =>
    validateTemplateForm(
      name,
      content,
      blocks,
      metadata,
      activeTab,
      errors => setValidationErrors(
        Object.fromEntries(
          Object.entries(errors).map(([k, v]) => [k, getMessage(v as any)])
        )
      )
    );

  // Generate final content from blocks and metadata
  const generateFinalContentLocal = () =>
    generateFinalContent(content, blocks, metadata, activeTab);

  // Extract block IDs for API
  const getBlockIdsLocal = () => getBlockIds(blocks, metadata, activeTab);
  
  // Save template
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
        folder_id: selectedFolderId ? parseInt(selectedFolderId, 10) : undefined
      };
      
      if (onSave) {
        const formData = {
          name: name.trim(),
          content: finalContent,
          description: description?.trim(),
          folder_id: selectedFolderId ? parseInt(selectedFolderId, 10) : undefined
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
  
  // Block management functions
  const handleAddBlock = (
    position: 'start' | 'end',
    blockType?: BlockType | null,
    existingBlock?: Block
  ) => {
    const newBlock: Block = existingBlock
      ? { ...existingBlock, isNew: false }
      : {
          id: Date.now() + Math.random(),
          type: blockType || null,
          content: '',
          name: blockType
            ? `New ${blockType.charAt(0).toUpperCase() + blockType.slice(1)} Block`
            : 'New Block',
          description: '',
          isNew: true
        };

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
      const newBlocks = prevBlocks.map(block =>
        block.id === blockId ? { ...block, ...updatedBlock } : block
      );
      if (activeTab === 'basic' && newBlocks.length > 0 && newBlocks[0].id === blockId) {
        const first = newBlocks[0];
        const lang = getCurrentLanguage();
        const newContent = typeof first.content === 'string'
          ? first.content
          : (first.content as any)[lang] || (first.content as any).en || '';
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
  
  // Determine dialog title
  const dialogTitle = isEditMode 
    ? getMessage('editTemplate', undefined, 'Edit Template') 
    : getMessage('createTemplate', undefined, 'Create Template');
  
  if (!isOpen) return null;
  
  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          handleClose();
        }
      }}
      title={dialogTitle}
      className="jd-max-w-4xl jd-h-[80vh]"
    >
      <div className="jd-flex jd-flex-col jd-h-full jd-gap-4">
        {/* Basic Info Section */}
        <div className="jd-space-y-4">
          <div>
            <label className="jd-text-sm jd-font-medium">{getMessage('templateName')}</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder={getMessage('enterTemplateName')}
              className={`jd-mt-1 ${validationErrors.name ? 'jd-border-red-500' : ''}`}
            />
            {validationErrors.name && (
              <p className="jd-text-xs jd-text-red-500 jd-mt-1">{validationErrors.name}</p>
            )}
          </div>
          
          <div className="jd-grid jd-grid-cols-2 jd-gap-4">
            <div>
              <label className="jd-text-sm jd-font-medium">{getMessage('description')}</label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder={getMessage('templateDescriptionPlaceholder')}
                className="jd-mt-1"
                rows={2}
              />
            </div>
            
            <div>
              <label className="jd-text-sm jd-font-medium">{getMessage('folder')}</label>
              <Select 
                value={selectedFolderId || 'root'} 
                onValueChange={handleFolderSelect}
              >
                <SelectTrigger className="jd-w-full jd-mt-1">
                  <SelectValue placeholder={getMessage('selectFolder')}>
                    {selectedFolderId === 'root' ? (
                      <span className="jd-text-muted-foreground">{getMessage('noFolder')}</span>
                    ) : selectedFolderId ? (
                      <span className="jd-truncate">
                        {truncateFolderPath(userFoldersList.find(f => f.id.toString() === selectedFolderId)?.fullPath || '')}
                      </span>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="jd-max-h-80 jd-bg-background">
                  <SelectItem value="root">
                    <span className="jd-text-muted-foreground">{getMessage('noFolder')}</span>
                  </SelectItem>
                  
                  {userFoldersList.map(folder => (
                    <SelectItem 
                      key={folder.id} 
                      value={folder.id.toString()}
                      className="jd-truncate"
                      title={folder.fullPath}
                    >
                      {folder.fullPath}
                    </SelectItem>
                  ))}
                  
                  <SelectItem value="new" className="jd-text-primary jd-font-medium">
                    <div className="jd-flex jd-items-center">
                      <FolderPlus className="jd-h-4 jd-w-4 jd-mr-2" />
                      {getMessage('createNewFolder')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Content Editor Tabs */}
        <div className="jd-flex-1 jd-overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={value => setActiveTab(value as 'basic' | 'advanced')}
            className="jd-h-full jd-flex jd-flex-col"
          >
            <TabsList className="jd-grid jd-w-full jd-grid-cols-2">
              <TabsTrigger value="basic">Basic Editor</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="jd-flex-1 jd-overflow-y-auto jd-mt-4">
              <BasicEditor
                blocks={blocks}
                onUpdateBlock={handleUpdateBlock}
                mode="create"
              />
            </TabsContent>

            <TabsContent value="advanced" className="jd-flex-1 jd-overflow-y-auto jd-mt-4">
              <AdvancedEditor
                blocks={blocks}
                metadata={metadata}
                onAddBlock={handleAddBlock}
                onRemoveBlock={handleRemoveBlock}
                onUpdateBlock={handleUpdateBlock}
                onReorderBlocks={handleReorderBlocks}
                onUpdateMetadata={handleUpdateMetadata}
                isProcessing={false}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Footer */}
        <div className="jd-flex jd-justify-end jd-gap-2 jd-pt-4 jd-border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {getMessage('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="jd-h-4 jd-w-4 jd-border-2 jd-border-current jd-border-t-transparent jd-animate-spin jd-rounded-full jd-inline-block jd-mr-2"></div>
                {currentTemplate ? getMessage('updating') : getMessage('creating')}
              </>
            ) : (
              currentTemplate ? getMessage('update') : getMessage('create')
            )}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};