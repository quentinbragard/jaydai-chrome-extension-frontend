// src/components/dialogs/templates/TemplateDialog.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDialog } from '@/components/dialogs/core/DialogContext';
import { DIALOG_TYPES } from '@/core/dialogs/registry';
import { FolderPlus } from 'lucide-react';
import { DEFAULT_FORM_DATA } from '@/types/templates';
import { toast } from 'sonner';
import { promptApi } from '@/services/api/PromptApi';

/**
 * Unified Template Dialog for both creating and editing templates
 */
export const TemplateDialog: React.FC = () => {
  // Get create and edit dialog states
  const createDialog = useDialog(DIALOG_TYPES.CREATE_TEMPLATE);
  const editDialog = useDialog(DIALOG_TYPES.EDIT_TEMPLATE);
  
  // Determine if either dialog is open
  const isOpen = createDialog.isOpen || editDialog.isOpen;
  
  // Get the appropriate data based on which dialog is open
  const data = createDialog.isOpen ? createDialog.data : editDialog.data;
  const dialogType = createDialog.isOpen ? DIALOG_TYPES.CREATE_TEMPLATE : DIALOG_TYPES.EDIT_TEMPLATE;
  
  // Local state for form data 
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [userFoldersList, setUserFoldersList] = useState<any[]>([]);
  
  // Extract data from dialog
  const currentTemplate = data?.template || null;
  const initialFormData = data?.formData || DEFAULT_FORM_DATA;
  const onFormChange = data?.onFormChange;
  const onSave = data?.onSave || (() => Promise.resolve(false));
  const userFolders = data?.userFolders || [];
  
  // Process user folders for the select dropdown
  const processUserFolders = useCallback(() => {
    // Helper function to flatten folder hierarchy
    const flattenFolderHierarchy = (
      folders: any[], 
      path: string = "", 
      result: {id: number, name: string, fullPath: string}[] = []
    ) => {
      folders.forEach(folder => {
        if (!folder || !folder.id || !folder.name) return;
        
        const folderPath = path ? `${path} / ${folder.name}` : folder.name;
        
        result.push({
          id: folder.id,
          name: folder.name,
          fullPath: folderPath
        });
        
        if (folder.Folders && folder.Folders.length > 0) {
          flattenFolderHierarchy(folder.Folders, folderPath, result);
        }
      });
    
      return result;
    };
    
    const flattenedFolders = flattenFolderHierarchy(userFolders);
    console.log('Processed user folders:', flattenedFolders);
    setUserFoldersList(flattenedFolders);
  }, [userFolders]);
  
  // Initialize form state when dialog opens or data changes
  useEffect(() => {
    if (isOpen) {
      // Reset validation errors
      setValidationErrors({});
      
      if (initialFormData) {
        console.log('Setting initial form data:', initialFormData);
        setFormData(initialFormData);
        
        // Set selected folder ID
        if (initialFormData.folder_id) {
          setSelectedFolderId(initialFormData.folder_id.toString());
        } else {
          setSelectedFolderId('');
        }
      }
      
      // Process user folders
      processUserFolders();
    }
  }, [isOpen, initialFormData, processUserFolders]);
  
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
      // Open create folder dialog
      if (window.dialogManager) {
        window.dialogManager.openDialog(DIALOG_TYPES.CREATE_FOLDER, {
          onSaveFolder: handleCreateFolder
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
  
  // Handler for folder creation
  const handleCreateFolder = async (folderData: { name: string; path: string; description: string }) => {
    try {
      console.log('Creating folder:', folderData);
      
      const result = await promptApi.createFolder(folderData);
      
      if (result.success && result.folder) {
        toast.success(`Folder "${folderData.name}" created`);
        
        // Add the new folder to the list
        const newFolder = {
          id: result.folder.id,
          name: result.folder.name,
          fullPath: result.folder.name
        };
        
        setUserFoldersList(prev => [...prev, newFolder]);
        
        // Auto-select the new folder
        setSelectedFolderId(result.folder.id.toString());
        handleFormChange('folder_id', result.folder.id);
        handleFormChange('folder', result.folder.name);
        
        return true;
      } else {
        toast.error(`Failed to create folder: ${result.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Error creating folder');
      return false;
    }
  };
  
  // Validate form before saving
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Template name is required';
    }
    
    if (!formData.content?.trim()) {
      errors.content = 'Template content is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
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
      const success = await onSave();
      if (success) {
        handleClose();
      }
      return success;
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error saving template');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentTemplate ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
          <DialogDescription>
            {currentTemplate 
              ? 'Edit your template details below.' 
              : 'Create a new template to use with AI conversations.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Template Name</label>
            <Input 
              value={formData.name || ''} 
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="Enter template name"
              className={`mt-1 ${validationErrors.name ? 'border-red-500' : ''}`}
            />
            {validationErrors.name && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input 
              value={formData.description || ''} 
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Brief description of this template"
              className="mt-1"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Folder</label>
            </div>
            
            <Select 
              value={selectedFolderId || 'root'} 
              onValueChange={handleFolderSelect}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  <span className="text-muted-foreground">No folder (root)</span>
                </SelectItem>
                
                {userFoldersList.map(folder => (
                  <SelectItem key={folder.id} value={folder.id.toString()}>
                    {folder.fullPath}
                  </SelectItem>
                ))}
                
                {/* Option to create a new folder */}
                <SelectItem value="new" className="text-primary font-medium">
                  <div className="flex items-center">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create new folder...
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Content</label>
            <textarea 
              className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm mt-1 ${
                validationErrors.content ? 'border-red-500' : ''
              }`}
              rows={6}
              value={formData.content || ''} 
              onChange={(e) => handleFormChange('content', e.target.value)}
              placeholder="Enter your template content here"
            />
            {validationErrors.content && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.content}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full inline-block mr-2"></div>
                {currentTemplate ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              currentTemplate ? 'Update' : 'Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};