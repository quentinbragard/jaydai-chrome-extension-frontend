import React, { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useDialog } from '@/hooks/dialogs/useDialog';
import { FolderPlus, Plus, Trash, ArrowUp, ArrowDown } from 'lucide-react';
import { DEFAULT_FORM_DATA } from '@/types/prompts/templates';
import { toast } from 'sonner';
import { promptApi } from '@/services/api';
import { getMessage } from '@/core/utils/i18n';
import { BaseDialog } from '../BaseDialog';

// Define types for folder data
interface FolderData {
  id: number;
  name: string;
  fullPath: string;
}

/**
 * Unified Template Dialog for both creating and editing templates
 * Updated to support block management
 */
export const TemplateDialog: React.FC = () => {
  // Get create and edit dialog states
  const createDialog = useDialog('createTemplate');
  const editDialog = useDialog('editTemplate');
  
  // Determine if either dialog is open
  const isOpen = createDialog.isOpen || editDialog.isOpen;
  
  // Get the appropriate data based on which dialog is open
  const data = createDialog.isOpen ? createDialog.data : editDialog.data;
  
  // Local state for form data 
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [userFoldersList, setUserFoldersList] = useState<FolderData[]>([]);
  const [selectedBlockType, setSelectedBlockType] = useState<string>('');
  
  // Extract data from dialog
  const currentTemplate = data?.template || null;
  const initialFormData = data?.formData || DEFAULT_FORM_DATA;
  const onFormChange = data?.onFormChange;
  const onSave = data?.onSave;
  const userFolders = data?.userFolders || [];
  const selectedFolder = data?.selectedFolder;
  const availableBlocks = data?.availableBlocks || {};
  
  // Process user folders for the select dropdown
  const processUserFolders = useCallback(() => {
    // Safely validate and transform user folders
    if (!userFolders || !Array.isArray(userFolders)) {
      console.log('No valid user folders found');
      setUserFoldersList([]);
      return;
    }
    
    // Helper function to flatten folder hierarchy
    const flattenFolderHierarchy = (
      folders: any[], 
      path: string = "", 
      result: {id: number, name: string, fullPath: string}[] = []
    ) => {
      folders.forEach(folder => {
        // Extra validation to ensure folder is valid
        if (!folder || typeof folder.id !== 'number' || !folder.name) {
          console.warn('Invalid folder encountered:', folder);
          return;
        }
        
        const folderPath = path ? `${path} / ${folder.name}` : folder.name;
        
        result.push({
          id: folder.id,
          name: folder.name,
          fullPath: folderPath
        });
        
        // Recursively process subfolders if they exist
        if (folder.Folders && Array.isArray(folder.Folders) && folder.Folders.length > 0) {
          flattenFolderHierarchy(folder.Folders, folderPath, result);
        }
      });
    
      return result;
    };
    
    const flattenedFolders = flattenFolderHierarchy(userFolders);
    console.log('Processed user folders:', flattenedFolders);
    setUserFoldersList(flattenedFolders || []);
  }, [userFolders]);
  
  // Initialize form state when dialog opens or data changes
  useEffect(() => {
    if (isOpen) {
      // Reset validation errors
      setValidationErrors({});
  
      // Initialize form data only once when dialog opens
      console.log('Setting initial form data:', initialFormData);
      setFormData(initialFormData);
      
      // Set selected folder ID from form data if available
      if (initialFormData.folder_id) {
        setSelectedFolderId(initialFormData.folder_id.toString());
      } else {
        setSelectedFolderId('');
      }
      
      // Process user folders
      processUserFolders();
      
      // If there's a pre-selected folder, update the form accordingly
      if (selectedFolder) {
        console.log('Auto-selecting folder from creation:', selectedFolder);
        setSelectedFolderId(selectedFolder.id.toString());
        handleFormChange('folder_id', selectedFolder.id);
        handleFormChange('folder', selectedFolder.name);
      }
    }
  }, [isOpen, userFolders, selectedFolder, initialFormData, processUserFolders]);
  
  // Handle dialog close
  const handleClose = () => {
    if (createDialog.isOpen) {
      createDialog.close();
    } else {
      editDialog.close();
    }
    
    // Reset form state
    setFormData(DEFAULT_FORM_DATA);
    setSelectedFolderId('');
    setValidationErrors({});
    setSelectedBlockType('');
  };
  
  // Form field change handler with validation
  const handleFormChange = (field: string, value: any) => {
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Update local state first
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Call the external change handler if provided
      if (onFormChange) {
        console.log(`Updating form field ${field}:`, value);
        onFormChange(newData);
      }
      
      return newData;
    });
  };
  
  // Handle folder selection
  const handleFolderSelect = (folderId: string) => {
    if (folderId === 'new') {
      // Open create folder dialog and pass callback to handle newly created folder
      if (window.dialogManager) {
        window.dialogManager.openDialog('createFolder', {
          onSaveFolder: async (folderData: { name: string; path: string; description: string }) => {
            try {
              // Direct API call fallback
              const response = await promptApi.createFolder(folderData);
              
              if (response.success && response.folder) {
                return { success: true, folder: response.folder };
              } else {
                toast.error(response.error || getMessage('failedToCreateFolder'));
                return { success: false, error: response.error || getMessage('unknownError') };
              }
            } catch (error) {
              console.error('Error creating folder:', error);
              return { success: false, error: getMessage('failedToCreateFolder') };
            }
          },
          onFolderCreated: (folder: any) => {
            // When folder is created, update the form with the new folder
            console.log('New folder created, updating selection:', folder);
            setSelectedFolderId(folder.id.toString());
            handleFormChange('folder_id', folder.id);
            handleFormChange('folder', folder.name);
            
            // Add the new folder to the list immediately for better UX
            setUserFoldersList(prev => {
              // Check if folder is already in the list
              if (prev.some(f => f.id === folder.id)) {
                return prev;
              }
              
              // Add the new folder to the list
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
    
    // Handle "root" folder (no folder) specially
    if (folderId === 'root') {
      handleFormChange('folder_id', undefined);
      handleFormChange('folder', '');
      return;
    }
    
    // Update form data with folder_id (as a number)
    handleFormChange('folder_id', parseInt(folderId, 10));
    
    // Find the selected folder's path for display
    const selectedFolder = userFoldersList.find(f => f.id.toString() === folderId);
    if (selectedFolder) {
      handleFormChange('folder', selectedFolder.fullPath);
    }
  };

  // Add a block to the template
  const handleAddBlock = (blockId: string) => {
    if (!blockId) return;
    
    // Convert to number (or use as is for custom blocks)
    const id = blockId === 'custom' ? blockId : parseInt(blockId, 10);
    
    // Add block ID to blocks array
    handleFormChange('blocks', [...(formData.blocks || []), id]);
    
    // Reset selected block type
    setSelectedBlockType('');
  };

  // Remove a block from the template
  const handleRemoveBlock = (index: number) => {
    const newBlocks = [...(formData.blocks || [])];
    newBlocks.splice(index, 1);
    handleFormChange('blocks', newBlocks);
  };

  // Move a block up in the template
  const handleMoveBlockUp = (index: number) => {
    if (index === 0) return;
    
    const newBlocks = [...(formData.blocks || [])];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index - 1];
    newBlocks[index - 1] = temp;
    
    handleFormChange('blocks', newBlocks);
  };

  // Move a block down in the template
  const handleMoveBlockDown = (index: number) => {
    const blocks = formData.blocks || [];
    if (index === blocks.length - 1) return;
    
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + 1];
    newBlocks[index + 1] = temp;
    
    handleFormChange('blocks', newBlocks);
  };
  
  // Function to truncate folder name with ellipsis
  const truncateFolderPath = (path: string, maxLength: number = 35) => {
    if (!path || path.length <= maxLength) return path;
    
    // For paths with slashes, try to preserve the last part
    if (path.includes('/')) {
      const parts = path.split('/');
      const lastPart = parts[parts.length - 1].trim();
      const firstParts = parts.slice(0, -1).join('/');
      
      // If the last part is already too long, truncate it
      if (lastPart.length >= maxLength - 3) {
        return lastPart.substring(0, maxLength - 3) + '...';
      }
      
      // Otherwise, try to keep the last part intact and truncate the beginning
      const availableLength = maxLength - lastPart.length - 3 - 3; // 3 for ellipsis, 3 for " / "
      if (availableLength > 5) { // Only if we can show a meaningful portion
        return '...' + firstParts.substring(firstParts.length - availableLength) + ' / ' + lastPart;
      }
    }
    
    // Simple truncation for other cases
    return path.substring(0, maxLength - 3) + '...';
  };
  
  // Validate form before saving
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name?.trim()) {
      errors.name = getMessage('templateNameRequired');
    }
    
    // Only require content if there are no blocks
    if (!formData.content?.trim() && (!formData.blocks || formData.blocks.length === 0)) {
      errors.content = getMessage('templateContentRequired');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper to get block name from ID
  const getBlockName = (blockId: number | string) => {
    if (blockId === 0 || blockId === '0') {
      return 'Template Content';
    }
    
    // Search through all available blocks
    for (const type in availableBlocks) {
      const block = availableBlocks[type]?.find((b: any) => b.id === blockId);
      if (block) {
        return block.title || block.name || `Block ${blockId}`;
      }
    }
    
    return `Block ${blockId}`;
  };

  // Get available block types
  const blockTypes = Object.keys(availableBlocks || {});
  
  // Save template
  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      // Show toast for validation errors
      if (validationErrors.name) {
        toast.error(validationErrors.name);
      } else if (validationErrors.content) {
        toast.error(validationErrors.content);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Saving template with data:', formData);
      
      // If onSave is provided (custom handling), use it
      if (onSave) {
        const success = await onSave(formData);
        if (success) {
          handleClose();
          return success;
        }
      } else {
        // Otherwise use direct API calls
        const templateData = {
          title: formData.name,
          content: formData.content,
          description: formData.description,
          folder_id: formData.folder_id,
          blocks: formData.blocks || [] // Include blocks array
        };
        
        let response;
        if (currentTemplate?.id) {
          // Update existing template
          response = await promptApi.updateTemplate(currentTemplate.id, templateData);
        } else {
          // Create new template
          response = await promptApi.createTemplate(templateData);
        }
        
        if (response.success) {
          // Show success message
          toast.success(currentTemplate ? getMessage('templateUpdated') : getMessage('templateCreated'));
          
          // Set a short timeout to allow the toast to be visible before refresh
          if (currentTemplate) {
            setTimeout(() => {
              // Refresh the page to get updated data
              window.location.reload();
            }, 1000); // 1-second delay so user can see the success message
          }
          
          // Close the dialog
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
  
  // Determine dialog title based on mode
  const dialogTitle = createDialog.isOpen 
    ? getMessage('createTemplate', undefined, 'Create Template') 
    : getMessage('editTemplate', undefined, 'Edit Template');
  
  if (!isOpen) return null;
  
  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          // Reset form when closing
          setFormData(DEFAULT_FORM_DATA);
          setValidationErrors({});
        }
        handleClose();
      }}
      title={dialogTitle}
      className="jd-max-w-lg"
    >
      <div className="jd-flex jd-flex-col jd-space-y-4 jd-mt-4">
        <div>
          <label className="jd-text-sm jd-font-medium">{getMessage('templateName')}</label>
          <Textarea 
            value={formData.name || ''} 
            onChange={(e) => handleFormChange('name', e.target.value)}
            placeholder={getMessage('enterTemplateName')}
            className={`jd-mt-1 ${validationErrors.name ? 'jd-border-red-500' : ''}`}
          />
          {validationErrors.name && (
            <p className="jd-text-xs jd-text-red-500 jd-mt-1">{validationErrors.name}</p>
          )}
        </div>
        
        <div>
          <label className="jd-text-sm jd-font-medium">{getMessage('description')}</label>
          <Textarea 
            value={formData.description || ''} 
            onChange={(e) => handleFormChange('description', e.target.value)}
            onKeyDown={(e) => {
              // Allow Enter key to create a new line
              if (e.key === 'Enter') {
                e.preventDefault();
                
                // Get the current cursor position
                const textarea = e.target as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                
                // Insert a newline at the cursor position
                const newContent = 
                  (formData.description || '').substring(0, start) + 
                  '\n' + 
                  (formData.description || '').substring(end);
                
                // Update the form data
                handleFormChange('description', newContent);
                
                // Set the cursor position after the newline
                setTimeout(() => {
                  textarea.selectionStart = textarea.selectionEnd = start + 1;
                }, 0);
              }
            }}
            placeholder={getMessage('templateDescriptionPlaceholder')}
            className="jd-mt-1"
            rows={3}
          />
        </div>
        
        <div>
          <div className="jd-flex jd-items-center jd-justify-between jd-mb-1">
            <label className="jd-text-sm jd-font-medium">{getMessage('folder')}</label>
          </div>
          
          <Select 
            value={selectedFolderId || 'root'} 
            onValueChange={handleFolderSelect}
          >
            <SelectTrigger className="jd-w-full">
              <SelectValue placeholder={getMessage('selectFolder')}>
                {selectedFolderId === 'root' ? (
                  <span className="jd-text-muted-foreground">{getMessage('noFolder')}</span>
                ) : selectedFolderId ? (
                  <span className="jd-truncate" title={formData.folder}>
                    {truncateFolderPath(formData.folder)}
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
                  title={folder.fullPath} // Show full path on hover
                >
                  {folder.fullPath}
                </SelectItem>
              ))}
              
              {/* Option to create a new folder */}
              <SelectItem value="new" className="jd-text-primary jd-font-medium">
                <div className="jd-flex jd-items-center">
                  <FolderPlus className="jd-h-4 jd-w-4 jd-mr-2" />
                  {getMessage('createNewFolder')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Blocks Section */}
        <div>
          <label className="jd-text-sm jd-font-medium jd-mb-2">{getMessage('blocks', undefined, 'Blocks')}</label>
          
          {/* Block List */}
          <div className="jd-max-h-40 jd-overflow-y-auto jd-border jd-rounded-md jd-p-2 jd-mb-2">
            {formData.blocks && formData.blocks.length > 0 ? (
              <div className="jd-space-y-2">
                {formData.blocks.map((blockId, index) => (
                  <div key={`block-${index}`} className="jd-flex jd-items-center jd-gap-2 jd-border jd-p-2 jd-rounded">
                    <Badge variant="outline" className="jd-flex-shrink-0">
                      {blockId === 0 ? 'Content' : (
                        typeof blockId === 'string' && blockId.startsWith('custom') 
                          ? 'Custom' 
                          : getBlockName(blockId)
                      )}
                    </Badge>
                    
                    <div className="jd-flex-1 jd-text-sm jd-truncate">
                      {blockId === 0 ? 'Template Content' : `Block ${blockId}`}
                    </div>
                    
                    <div className="jd-flex jd-items-center jd-gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="jd-h-7 jd-w-7 jd-p-0" 
                        onClick={() => handleMoveBlockUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="jd-h-4 jd-w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="jd-h-7 jd-w-7 jd-p-0" 
                        onClick={() => handleMoveBlockDown(index)}
                        disabled={index === (formData.blocks?.length || 0) - 1}
                      >
                        <ArrowDown className="jd-h-4 jd-w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="jd-h-7 jd-w-7 jd-p-0 jd-text-red-500" 
                        onClick={() => handleRemoveBlock(index)}
                      >
                        <Trash className="jd-h-4 jd-w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="jd-py-4 jd-text-sm jd-text-center jd-text-muted-foreground">
                {getMessage('noBlocks', undefined, 'No blocks added. Template will use content only.')}
              </div>
            )}
          </div>
          
          {/* Add Block Controls */}
          <div className="jd-flex jd-items-center jd-gap-2">
            <Select 
              value={selectedBlockType} 
              onValueChange={setSelectedBlockType}
            >
              <SelectTrigger className="jd-flex-1">
                <SelectValue placeholder={getMessage('selectBlockType', undefined, 'Select block type')} />
              </SelectTrigger>
              <SelectContent>
                {blockTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedBlockType && (
              <Select onValueChange={handleAddBlock}>
                <SelectTrigger className="jd-flex-1">
                  <SelectValue placeholder={getMessage('selectBlock', undefined, 'Select block')} />
                </SelectTrigger>
                <SelectContent>
                  {availableBlocks[selectedBlockType]?.map((block: any) => (
                    <SelectItem key={block.id} value={block.id.toString()}>
                      {block.title || block.name || `Block ${block.id}`}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">{getMessage('customBlock', undefined, 'Custom')}</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleAddBlock('0')}
              title={getMessage('addContentBlock', undefined, 'Add content block')}
            >
              <Plus className="jd-h-4 jd-w-4 jd-mr-1" />
              {getMessage('addContent', undefined, 'Content')}
            </Button>
          </div>
        </div>
        
        <div>
          <label className="jd-text-sm jd-font-medium">{getMessage('content')}</label>
          <textarea 
            className={`jd-flex jd-w-full jd-rounded-md jd-border jd-border-input jd-bg-background jd-px-3 jd-py-2 jd-text-sm jd-shadow-sm jd-mt-1 ${
              validationErrors.content ? 'jd-border-red-500' : ''
            }`}
            rows={6}
            value={formData.content || ''} 
            onChange={(e) => handleFormChange('content', e.target.value)}
            onKeyDown={(e) => {
              // Prevent default handling of Enter to allow multi-line content
              if (e.key === 'Enter') {
                e.preventDefault();
                
                // Get the current cursor position
                const textarea = e.target as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                
                // Insert a newline at the cursor position
                const newContent = 
                  formData.content.substring(0, start) + 
                  '\n' + 
                  formData.content.substring(end);
                
                // Update the form data
                handleFormChange('content', newContent);
                
                // Set the cursor position after the newline
                setTimeout(() => {
                  textarea.selectionStart = textarea.selectionEnd = start + 1;
                }, 0);
              }
            }}
            placeholder={getMessage('enterTemplateContent')}
          />
          {validationErrors.content && (
            <p className="jd-text-xs jd-text-red-500 jd-mt-1">{validationErrors.content}</p>
          )}
        </div>
      </div>
      
      <div className="jd-mt-4 jd-flex jd-justify-end jd-gap-2">
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
    </BaseDialog>
  );
};