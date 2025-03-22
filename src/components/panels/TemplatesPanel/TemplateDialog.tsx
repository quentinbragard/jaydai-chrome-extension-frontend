import React, { useState, useEffect } from 'react';
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
import { Template, TemplateFormData, DEFAULT_FORM_DATA } from './types';
import { FolderPlus } from 'lucide-react';
import FolderDialog from './FolderDialog';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplate: Template | null;
  formData: TemplateFormData;
  onFormChange: (formData: TemplateFormData) => void;
  onSaveTemplate: () => void;
  userFolders?: any[];
}

// Function to recursively get all folders and subfolders with proper paths
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

const TemplateDialog: React.FC<TemplateDialogProps> = ({
  open,
  onOpenChange,
  currentTemplate,
  formData,
  onFormChange,
  onSaveTemplate,
  userFolders = []
}) => {
  // Do NOT create local state for formData - use the prop directly
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flattenedFolders, setFlattenedFolders] = useState<{id: number, name: string, fullPath: string}[]>([]);

  // Get valid form data to work with
  const safeFormData = formData || DEFAULT_FORM_DATA;

  // Debug: Log current props on render
  console.log('TemplateDialog render:', { 
    open, 
    currentTemplate: currentTemplate?.id, 
    formData: safeFormData,
    userFolders: userFolders?.length  
  });

  // Update selected folder ID when the form data changes
  useEffect(() => {
    // If the form has a folder_id, set it as selected
    if (safeFormData.folder_id) {
      setSelectedFolderId(safeFormData.folder_id.toString());
    } else {
      setSelectedFolderId('root');
    }
  }, [safeFormData.folder_id]);
  
  // Process folder data when dialog opens or folders change
  useEffect(() => {
    // Only process folders when dialog is open
    if (!open) return;
    
    // Flatten folder hierarchy for the dropdown
    const flattened = flattenFolderHierarchy(userFolders);
    setFlattenedFolders(flattened);
    
    console.log('Folders processed:', { 
      count: flattened.length, 
      folderIdFromProps: safeFormData.folder_id 
    });
  }, [open, userFolders, safeFormData.folder_id]);

  // Safe handler for form changes
  const handleFormChange = (field: keyof TemplateFormData, value: any) => {
    console.log('Form field changed:', { field, value });
    
    // Call the provided callback with the updated data
    onFormChange({
      ...safeFormData,
      [field]: value
    });
  };

  // Handle folder selection from dropdown
  const handleFolderSelect = (folderId: string) => {
    console.log('Folder selected:', folderId);
    if (folderId === 'new') {
      // Open folder creation dialog
      setFolderDialogOpen(true);
      return;
    }
    
    setSelectedFolderId(folderId);
    
    // Handle "root" folder (no folder) specially
    if (folderId === 'root') {
      handleFormChange('folder_id', undefined);
      handleFormChange('folder', '');
      return;
    }
    
    // Update form data with folder_id
    handleFormChange('folder_id', parseInt(folderId));
    
    // Find the selected folder's path for display
    const selectedFolder = flattenedFolders.find(f => f.id.toString() === folderId);
    if (selectedFolder) {
      handleFormChange('folder', selectedFolder.fullPath);
    }
  };

  // Handler for folder creation
  const handleCreateFolder = async (folderData: { name: string; path: string; description: string }) => {
    try {
      console.log('Creating folder:', folderData);
      
      // In a real implementation this would call your API
      const success = true;
      
      if (success) {
        // Wait for folders to refresh and then select the new folder
        setTimeout(() => {
          console.log('Folder created, should update the selection...');
        }, 500); 
      }
      return success;
    } catch (error) {
      console.error('Error creating folder:', error);
      return false;
    }
  };

  // Handle save with loading state
  const handleSave = async () => {
    if (!safeFormData.name?.trim()) {
      alert('Template name is required');
      return;
    }

    if (!safeFormData.content?.trim()) {
      alert('Template content is required');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Saving template with data:', safeFormData);
      await onSaveTemplate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-md" 
          onClick={(e) => e.stopPropagation()}
        >
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
                value={safeFormData.name} 
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Enter template name"
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input 
                value={safeFormData.description} 
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
                value={selectedFolderId ? selectedFolderId.toString() : 'root'} 
                onValueChange={handleFolderSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    <span className="text-muted-foreground">No folder (root)</span>
                  </SelectItem>
                  
                  {flattenedFolders.map(folder => (
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
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm mt-1"
                rows={6}
                value={safeFormData.content} 
                onChange={(e) => handleFormChange('content', e.target.value)}
                placeholder="Enter your template content here"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
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
      
      {/* Folder dialog */}
      {folderDialogOpen && (
        <FolderDialog
          open={folderDialogOpen}
          onOpenChange={(open) => {
            setFolderDialogOpen(open);
          }}
          onSaveFolder={handleCreateFolder}
        />
      )}
    </>
  );
};

export default TemplateDialog;