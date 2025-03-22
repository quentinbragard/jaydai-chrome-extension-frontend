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
import { Template, TemplateFormData, TemplateFolder, DEFAULT_FORM_DATA } from './types';
import { FolderPlus } from 'lucide-react';
import FolderDialog from './FolderDialog';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplate: Template | null;
  formData: TemplateFormData;
  onFormChange: (formData: TemplateFormData) => void;
  onSaveTemplate: () => void;
  userFolders?: TemplateFolder[];
}

// Function to recursively get all folders and subfolders with proper paths
const flattenFolderHierarchy = (
  folders: TemplateFolder[], 
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
  // Ensure we always have valid form data
  const safeFormData = formData || DEFAULT_FORM_DATA;
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flattenedFolders, setFlattenedFolders] = useState<{id: number, name: string, fullPath: string}[]>([]);

  useEffect(() => {
    // If template has a folder_id, set it as selected
    if (currentTemplate?.folder_id) {
      setSelectedFolderId(currentTemplate.folder_id.toString());
    } else {
      setSelectedFolderId('root');
    }
    
    // Flatten folder hierarchy for the dropdown
    const flattened = flattenFolderHierarchy(userFolders);
    setFlattenedFolders(flattened);
  }, [currentTemplate, userFolders]);

  // Safe handler for form changes that won't fail if formData is undefined
  const handleFormChange = (field: keyof TemplateFormData, value: any) => {
    onFormChange({
      ...safeFormData,
      [field]: value
    });
  };

  // Handle folder selection from dropdown
  const handleFolderSelect = (folderId: string) => {
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

  // Handle new folder creation
  const handleSaveFolder = async (folderData: { name: string; path: string; description: string }) => {
    // This function will be implemented in a separate component
    // When that component calls back with success, we'll update our folder list
    return true;
  };

  // Handle folder creation
  const handleCreateFolder = async (folderData: { name: string; path: string; description: string }) => {
    try {
      const success = await handleSaveFolder(folderData);
      if (success) {
        // Wait for folders to refresh and then select the new folder
        setTimeout(() => {
          // Get the most recently created folder (likely to be the one we just created)
          const newFolder = flattenedFolders.find(f => f.name === folderData.name);
          if (newFolder) {
            handleFolderSelect(newFolder.id.toString());
          }
        }, 500); // Short delay to allow folders to refresh
      }
      return success;
    } catch (error) {
      console.error('Error creating folder:', error);
      return false;
    }
  };

  // Handle save with loading state
  const handleSave = async () => {
    if (!safeFormData.name.trim()) {
      alert('Template name is required');
      return;
    }

    if (!safeFormData.content.trim()) {
      alert('Template content is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveTemplate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>
              {currentTemplate ? chrome.i18n.getMessage('editTemplate') : chrome.i18n.getMessage('createTemplateTitle')}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {currentTemplate ? chrome.i18n.getMessage('editTemplateDesc') : chrome.i18n.getMessage('createTemplateDesc')}
          </DialogDescription>
          
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">{chrome.i18n.getMessage('templateName')}</label>
              <Input 
                value={safeFormData.name} 
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder={chrome.i18n.getMessage('templateName')}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">{chrome.i18n.getMessage('templateDescription')}</label>
              <Input 
                value={safeFormData.description} 
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder={chrome.i18n.getMessage('templateDescription')}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">{chrome.i18n.getMessage('templateFolder')}</label>
              </div>
              
              <Select 
                value={selectedFolderId ? selectedFolderId.toString() : 'root'} 
                onValueChange={handleFolderSelect}
              >
                <SelectTrigger>
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
              <label className="text-sm font-medium">{chrome.i18n.getMessage('templateContent')}</label>
              <textarea 
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                rows={6}
                value={safeFormData.content} 
                onChange={(e) => handleFormChange('content', e.target.value)}
                placeholder={chrome.i18n.getMessage('templateContent')}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {chrome.i18n.getMessage('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full inline-block mr-2"></div>
                  {currentTemplate ? chrome.i18n.getMessage('updating') : chrome.i18n.getMessage('creating')}
                </>
              ) : (
                currentTemplate ? chrome.i18n.getMessage('update') : chrome.i18n.getMessage('create')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Render the folder dialog separately to prevent closing the parent dialog */}
      {folderDialogOpen && (
        <FolderDialog
          open={folderDialogOpen}
          onOpenChange={(open) => {
            setFolderDialogOpen(open);
            // Do not close the parent dialog when closing this one
          }}
          onSaveFolder={handleCreateFolder}
        />
      )}
    </>
  );
};

export default TemplateDialog;